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

// ─── Minimal FTP Client using Deno TCP ───────────────────────
class SimpleFTP {
  private conn!: Deno.TcpConn;
  private reader!: ReadableStreamDefaultReader<Uint8Array>;
  private textDecoder = new TextDecoder();
  private textEncoder = new TextEncoder();
  private buffer = "";

  async connect(host: string, port: number): Promise<string> {
    this.conn = await Deno.connect({ hostname: host, port });
    this.reader = this.conn.readable.getReader();
    return await this.readResponse();
  }

  private async readResponse(): Promise<string> {
    // Read until we get a complete FTP response (line ending with \r\n and 3-digit code + space)
    while (true) {
      const { value, done } = await this.reader.read();
      if (done) break;
      this.buffer += this.textDecoder.decode(value);
      
      // Check if we have a complete response
      const lines = this.buffer.split("\r\n");
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        // A final response line has format: "XXX " (3 digits + space)
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
    return await this.readResponse();
  }

  async login(user: string, pass: string): Promise<void> {
    const userResp = await this.sendCommand(`USER ${user}`);
    if (!userResp.startsWith("331")) throw new Error(`USER failed: ${userResp}`);
    const passResp = await this.sendCommand(`PASS ${pass}`);
    if (!passResp.startsWith("230")) throw new Error(`PASS failed: ${passResp}`);
  }

  async cwd(dir: string): Promise<void> {
    const resp = await this.sendCommand(`CWD ${dir}`);
    if (!resp.startsWith("250")) {
      // Try to create directory
      await this.sendCommand(`MKD ${dir}`);
      const retryResp = await this.sendCommand(`CWD ${dir}`);
      if (!retryResp.startsWith("250")) throw new Error(`CWD failed: ${retryResp}`);
    }
  }

  async binary(): Promise<void> {
    await this.sendCommand("TYPE I");
  }

  async pasv(): Promise<{ host: string; port: number }> {
    const resp = await this.sendCommand("PASV");
    if (!resp.startsWith("227")) throw new Error(`PASV failed: ${resp}`);
    
    const match = resp.match(/\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/);
    if (!match) throw new Error(`Cannot parse PASV response: ${resp}`);
    
    const host = `${match[1]}.${match[2]}.${match[3]}.${match[4]}`;
    const port = parseInt(match[5]) * 256 + parseInt(match[6]);
    return { host, port };
  }

  async stor(filename: string, data: Uint8Array): Promise<void> {
    await this.binary();
    const { host, port } = await this.pasv();
    
    // Open data connection
    const dataConn = await Deno.connect({ hostname: host, port });
    
    // Send STOR command
    const resp = await this.sendCommand(`STOR ${filename}`);
    if (!resp.startsWith("150") && !resp.startsWith("125")) {
      dataConn.close();
      throw new Error(`STOR failed: ${resp}`);
    }
    
    // Write file data
    const writer = dataConn.writable.getWriter();
    await writer.write(data);
    await writer.close();
    
    // Wait for transfer complete
    const doneResp = await this.readResponse();
    if (!doneResp.startsWith("226")) {
      console.warn(`Transfer response: ${doneResp}`);
    }
  }

  async mkdirRecursive(path: string): Promise<void> {
    const parts = path.split("/").filter(Boolean);
    let current = "";
    for (const part of parts) {
      current += `/${part}`;
      try {
        await this.sendCommand(`MKD ${current}`);
      } catch {
        // Directory might already exist, ignore
      }
    }
    await this.cwd(path);
  }

  async quit(): Promise<void> {
    try {
      await this.sendCommand("QUIT");
    } catch {
      // Ignore quit errors
    }
    try {
      this.conn.close();
    } catch {
      // Ignore close errors
    }
  }
}

// ─── Main handler ────────────────────────────────────────────
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse the multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: "Only PDF, DOC, and DOCX files are allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "File size must be under 10MB" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Generate unique filename
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const sanitizedName = user.id.substring(0, 8);
    const timestamp = Date.now();
    const filename = `resume_${sanitizedName}_${timestamp}.${fileExt}`;

    // 4. Read file into buffer
    const fileBuffer = new Uint8Array(await file.arrayBuffer());

    // 5. Upload via FTP
    const ftp = new SimpleFTP();
    try {
      await ftp.connect(FTP_HOST, FTP_PORT);
      await ftp.login(FTP_USER, FTP_PASS);
      await ftp.mkdirRecursive(FTP_BASE_DIR);
      await ftp.stor(filename, fileBuffer);
      await ftp.quit();
    } catch (ftpError: any) {
      console.error("FTP upload error:", ftpError);
      await ftp.quit();
      return new Response(JSON.stringify({ error: `FTP upload failed: ${ftpError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Build the public URL
    const publicUrl = `${PUBLIC_BASE_URL}/${filename}`;

    // 7. Update candidate profile with the resume URL
    const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    await adminSupabase
      .from("candidate_profiles")
      .update({ resume_url: publicUrl })
      .eq("user_id", user.id);

    // 8. Return success
    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        filename,
        size: file.size,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
