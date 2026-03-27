// @ts-nocheck — This is a Supabase Edge Function (Deno runtime), not compiled by local TS
// ═══════════════════════════════════════════════════════════════
// Resume Upload Edge Function — FTP Upload to Hostinger
// Receives a file via multipart POST, uploads to FTP, returns URL
// ═══════════════════════════════════════════════════════════════
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// FTP credentials from environment secrets
const FTP_HOST = Deno.env.get("FTP_HOST") || "82.25.87.221";
const FTP_PORT = parseInt(Deno.env.get("FTP_PORT") || "21");
const FTP_USER = Deno.env.get("FTP_USER") || "";
const FTP_PASS = Deno.env.get("FTP_PASS") || "";
const FTP_BASE_DIR = Deno.env.get("FTP_BASE_DIR") || "/resumes";
const PUBLIC_BASE_URL = Deno.env.get("FTP_PUBLIC_URL") || "https://opentoowork.tech/resumes";

// Supabase for auth verification
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Enhanced FTP Client with Diagnostics ───────────────────────
class SimpleFTP {
  private conn!: Deno.TcpConn;
  private reader!: ReadableStreamDefaultReader<Uint8Array>;
  private textDecoder = new TextDecoder();
  private textEncoder = new TextEncoder();
  private buffer = "";
  public logs: string[] = [];

  private log(msg: string) {
    console.log(msg);
    this.logs.push(msg);
  }

  async connect(host: string, port: number): Promise<string> {
    this.log(`Connecting to FTP ${host}:${port}...`);
    this.conn = await Deno.connect({ hostname: host, port });
    this.reader = this.conn.readable.getReader();
    const resp = await this.readResponse();
    this.log(`FTP connect: ${resp.split('\n')[0]}`);
    return resp;
  }

  private async readResponse(): Promise<string> {
    while (true) {
      const { value, done } = await this.reader.read();
      if (done) break;
      this.buffer += this.textDecoder.decode(value);
      
      const lines = this.buffer.split("\r\n");
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        if (/^\d{3} /.test(line)) {
          const response = lines.slice(0, i + 1).join("\r\n");
          this.buffer = lines.slice(i + 1).join("\r\n");
          return response;
        }
      }
    }
    const result = this.buffer;
    this.buffer = "";
    return result;
  }

  private async sendCommand(cmd: string): Promise<string> {
    const writer = this.conn.writable.getWriter();
    await writer.write(this.textEncoder.encode(cmd + "\r\n"));
    writer.releaseLock();
    const resp = await this.readResponse();
    this.log(`> ${cmd}`);
    this.log(`< ${resp.split('\n')[0]}`);
    return resp;
  }

  async login(user: string, pass: string): Promise<void> {
    this.log(`Logging in as ${user}...`);
    const userResp = await this.sendCommand(`USER ${user}`);
    if (!userResp.startsWith("331")) throw new Error(`USER failed: ${userResp}`);
    const passResp = await this.sendCommand(`PASS ${pass}`);
    if (!passResp.startsWith("230")) throw new Error(`PASS failed: ${passResp}`);
    this.log("FTP login successful");
  }

  async pwd(): Promise<string> {
    const resp = await this.sendCommand("PWD");
    const match = resp.match(/"([^"]+)"/);
    const currentDir = match ? match[1] : "unknown";
    this.log(`Current directory: ${currentDir}`);
    return currentDir;
  }

  async cwd(dir: string): Promise<boolean> {
    const resp = await this.sendCommand(`CWD ${dir}`);
    return resp.startsWith("250");
  }

  async binary(): Promise<void> {
    await this.sendCommand("TYPE I");
  }


  async pasv(controlHost: string): Promise<{ host: string; port: number }> {
    // Try EPSV first (Extended Passive) — more NAT-friendly, only returns port
    const epsvResp = await this.sendCommand("EPSV");
    if (epsvResp.startsWith("229")) {
      const epsvMatch = epsvResp.match(/\|\|\|(\d+)\|/);
      if (epsvMatch) {
        const port = parseInt(epsvMatch[1]);
        this.log(`EPSV mode: ${controlHost}:${port}`);
        return { host: controlHost, port };
      }
    }

    // Fall back to PASV
    const resp = await this.sendCommand("PASV");
    if (!resp.startsWith("227")) throw new Error(`PASV failed: ${resp}`);
    
    const match = resp.match(/\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/);
    if (!match) throw new Error(`Cannot parse PASV response: ${resp}`);
    
    let host = `${match[1]}.${match[2]}.${match[3]}.${match[4]}`;
    const port = parseInt(match[5]) * 256 + parseInt(match[6]);
    
    // If PASV returns a private/internal IP, use the original FTP host instead
    if (host.startsWith("10.") || host.startsWith("192.168.") || 
        host.startsWith("172.") || host === "127.0.0.1" || host === "0.0.0.0") {
      this.log(`PASV returned private IP ${host}, overriding with ${controlHost}`);
      host = controlHost;
    }
    
    this.log(`Passive mode: ${host}:${port}`);
    return { host, port };
  }

  async stor(filename: string, data: Uint8Array, controlHost: string): Promise<void> {
    await this.binary();
    const { host, port } = await this.pasv(controlHost);
    
    this.log(`Opening data connection for STOR ${filename} (${data.length} bytes)...`);
    const dataConn = await Deno.connect({ hostname: host, port });
    
    const resp = await this.sendCommand(`STOR ${filename}`);
    if (!resp.startsWith("150") && !resp.startsWith("125")) {
      dataConn.close();
      throw new Error(`STOR failed: ${resp}`);
    }
    
    const writer = dataConn.writable.getWriter();
    await writer.write(data);
    await writer.close();
    this.log(`File data sent (${data.length} bytes)`);
    
    const doneResp = await this.readResponse();
    this.log(`STOR complete: ${doneResp.split('\n')[0]}`);
    if (!doneResp.startsWith("226")) {
      this.log(`Warning: Transfer may have failed: ${doneResp}`);
    }
  }

  async mkdir(path: string): Promise<boolean> {
    const resp = await this.sendCommand(`MKD ${path}`);
    if (resp.startsWith("257")) {
      this.log(`Created directory: ${path}`);
      return true;
    } else if (resp.includes("exists") || resp.includes("File exists")) {
      this.log(`Directory exists: ${path}`);
      return true;
    } else {
      this.log(`MKD ${path}: ${resp.split('\n')[0]}`);
      return false;
    }
  }

  async list(controlHost: string): Promise<string> {
    const { host, port } = await this.pasv(controlHost);
    const dataConn = await Deno.connect({ hostname: host, port });
    
    const resp = await this.sendCommand("LIST");
    if (!resp.startsWith("150") && !resp.startsWith("125")) {
      dataConn.close();
      return "LIST failed";
    }
    
    let listing = "";
    const reader = dataConn.readable.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      listing += this.textDecoder.decode(value);
    }
    
    await this.readResponse();
    return listing;
  }

  async quit(): Promise<void> {
    try {
      await this.sendCommand("QUIT");
    } catch {
      // Ignore
    }
    try {
      this.conn.close();
    } catch {
      // Ignore
    }
  }
}

// ─── Find web-accessible directory ──────────────────────────────
async function findWebRoot(ftp: SimpleFTP): Promise<string> {
  // First, check the initial directory — on Hostinger chrooted FTP,
  // the user lands directly in the web root (there is no /public_html)
  const initialDir = await ftp.pwd();
  ftp.logs.push(`Initial FTP directory: ${initialDir}`);

  const pathsToTry = [
    "/public_html",
    "/htdocs",
    "/www",
    "/html",
    "/domains/opentoowork/public_html",
    "/domains/opentoowork.tech/public_html",
  ];
  
  for (const path of pathsToTry) {
    ftp.logs.push(`Trying web root: ${path}`);
    const success = await ftp.cwd(path);
    if (success) {
      ftp.logs.push(`Found web root: ${path}`);
      return path;
    }
  }
  
  // None of the standard paths worked — Hostinger chroots FTP users
  // directly into their web root, so the initial directory IS the web root
  ftp.logs.push(`No standard web root found. Using initial directory as web root: ${initialDir}`);
  await ftp.cwd(initialDir);
  return initialDir;
}

// ─── Ensure resumes directory exists in web root ────────────────
async function ensureResumesDirectory(ftp: SimpleFTP, webRoot: string): Promise<string> {
  const resumesPath = `${webRoot}/resumes`;
  
  // Try to change to resumes directory
  const success = await ftp.cwd(resumesPath);
  if (success) {
    ftp.logs.push(`Using existing resumes directory: ${resumesPath}`);
    return resumesPath;
  }
  
  // Need to create it - go back to web root first
  await ftp.cwd(webRoot);
  ftp.logs.push(`In web root, attempting to create 'resumes' directory`);
  
  // Try creating the directory using relative path
  const created = await ftp.mkdir("resumes");
  if (created) {
    // Try to change into it using full path
    const canCwd = await ftp.cwd(resumesPath);
    if (canCwd) {
      ftp.logs.push(`Created and using resumes directory: ${resumesPath}`);
      return resumesPath;
    }
  }
  
  // Fall back to web root
  ftp.logs.push(`Warning: Could not create/access ${resumesPath}, falling back to ${webRoot}`);
  return webRoot;
}

// ─── Main handler ────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const logs: string[] = [];
  const log = (msg: string) => {
    console.log(msg);
    logs.push(msg);
  };

  try {
    log("=== Upload Resume Request ===");
    log(`FTP_HOST: ${FTP_HOST}`);
    log(`FTP_BASE_DIR (env): ${FTP_BASE_DIR}`);
    log(`PUBLIC_BASE_URL: ${PUBLIC_BASE_URL}`);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization", logs }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized", logs }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    log(`User: ${user.id.substring(0, 8)}...`);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided", logs }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    log(`File: ${file.name}, type: ${file.type}, size: ${file.size}`);

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: "Only PDF, DOC, and DOCX files are allowed", logs }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "File size must be under 10MB", logs }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const sanitizedName = user.id.substring(0, 8);
    const timestamp = Date.now();
    const filename = `resume_${sanitizedName}_${timestamp}.${fileExt}`;
    log(`Generated filename: ${filename}`);

    const fileBuffer = new Uint8Array(await file.arrayBuffer());
    log(`File buffer ready: ${fileBuffer.length} bytes`);

    const ftp = new SimpleFTP();
    let finalDir = "";
    let uploadPath = "";
    
    try {
      await ftp.connect(FTP_HOST, FTP_PORT);
      await ftp.login(FTP_USER, FTP_PASS);
      
      // Find web root and ensure resumes directory
      const webRoot = await findWebRoot(ftp);
      
      uploadPath = await ensureResumesDirectory(ftp, webRoot);
      finalDir = uploadPath;
      
      await ftp.stor(filename, fileBuffer, FTP_HOST);
      
      log("Listing uploaded directory:");
      const listing = await ftp.list(FTP_HOST);
      log(listing.split('\n').slice(0, 10).join('\n'));
      
      await ftp.quit();
      log("FTP session closed successfully");
    } catch (ftpError: any) {
      log(`FTP ERROR: ${ftpError.message}`);
      logs.push(...ftp.logs);
      await ftp.quit();
      return new Response(
        JSON.stringify({
          error: `FTP upload failed: ${ftpError.message}`,
          ftpHost: FTP_HOST,
          ftpPort: FTP_PORT,
          ftpUser: FTP_USER ? `${FTP_USER.substring(0, 4)}...` : "(empty)",
          ftpBaseDir: FTP_BASE_DIR,
          logs,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    logs.push(...ftp.logs);

    const publicUrl = `${PUBLIC_BASE_URL}/${filename}`;
    log(`Public URL: ${publicUrl}`);
    log(`Upload directory: ${finalDir}`);

    const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    await adminSupabase
      .from("candidate_profiles")
      .update({ resume_url: publicUrl })
      .eq("user_id", user.id);
    log("Database updated");

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        filename,
        size: file.size,
        ftpDirectory: finalDir,
        uploadPath: `${finalDir}/${filename}`,
        logs,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    log(`CRITICAL ERROR: ${error.message}`);
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error", logs }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
