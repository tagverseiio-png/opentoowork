// ═══════════════════════════════════════════════════════════════
// FTP Path Diagnostic Edge Function
// Finds the correct web-accessible directory for file uploads
// ═══════════════════════════════════════════════════════════════
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// FTP credentials from environment secrets
const FTP_HOST = Deno.env.get("FTP_HOST") || "82.25.87.221";
const FTP_PORT = parseInt(Deno.env.get("FTP_PORT") || "21");
const FTP_USER = Deno.env.get("FTP_USER") || "";
const FTP_PASS = Deno.env.get("FTP_PASS") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// ─── Minimal FTP Client ───────────────────────
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
    return await this.readResponse();
  }

  async login(user: string, pass: string): Promise<void> {
    const userResp = await this.sendCommand(`USER ${user}`);
    if (!userResp.startsWith("331")) throw new Error(`USER failed: ${userResp}`);
    const passResp = await this.sendCommand(`PASS ${pass}`);
    if (!passResp.startsWith("230")) throw new Error(`PASS failed: ${passResp}`);
  }

  async pwd(): Promise<string> {
    const resp = await this.sendCommand("PWD");
    const match = resp.match(/"([^"]+)"/);
    return match ? match[1] : "";
  }

  async cwd(dir: string): Promise<boolean> {
    const resp = await this.sendCommand(`CWD ${dir}`);
    return resp.startsWith("250");
  }

  async list(): Promise<string> {
    const resp = await this.sendCommand("PASV");
    if (!resp.startsWith("227")) return "PASV failed";
    
    const match = resp.match(/\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/);
    if (!match) return "Cannot parse PASV";
    
    const host = `${match[1]}.${match[2]}.${match[3]}.${match[4]}`;
    const port = parseInt(match[5]) * 256 + parseInt(match[6]);
    
    const dataConn = await Deno.connect({ hostname: host, port });
    
    const listResp = await this.sendCommand("LIST");
    if (!listResp.startsWith("150") && !listResp.startsWith("125")) {
      dataConn.close();
      return "LIST command failed";
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

// ─── Directory exploration helper ────────────────────────────
async function exploreDirectory(ftp: SimpleFTP, path: string): Promise<{ path: string; contents: string[]; hasPublicHtml: boolean; error?: string }> {
  try {
    const success = await ftp.cwd(path);
    if (!success) {
      return { path, contents: [], hasPublicHtml: false, error: "Cannot access directory" };
    }
    
    const listing = await ftp.list();
    const lines = listing.split("\n").filter(line => line.trim());
    
    // Parse directory names from listing
    const contents: string[] = [];
    for (const line of lines) {
      // Look for directory indicator 'd' at start or just extract names
      const parts = line.split(/\s+/);
      const name = parts[parts.length - 1];
      if (name && name !== "." && name !== "..") {
        contents.push(name);
      }
    }
    
    const hasPublicHtml = contents.some(name => 
      name.toLowerCase().includes("public_html") || 
      name.toLowerCase().includes("htdocs") ||
      name.toLowerCase().includes("www") ||
      name.toLowerCase().includes("html")
    );
    
    return { path, contents, hasPublicHtml };
  } catch (e: any) {
    return { path, contents: [], hasPublicHtml: false, error: e.message };
  }
}

// ─── Main handler ────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const results: any = {
    ftpHost: FTP_HOST,
    ftpUser: FTP_USER,
    testedPaths: [],
    recommendations: [],
  };

  const ftp = new SimpleFTP();
  
  try {
    await ftp.connect(FTP_HOST, FTP_PORT);
    await ftp.login(FTP_USER, FTP_PASS);
    
    // Get initial directory
    const initialDir = await ftp.pwd();
    results.initialDirectory = initialDir;
    
    // List of paths to test
    const pathsToTest = [
      "/",
      "/public_html",
      "/htdocs",
      "/www",
      "/html",
      "/domains",
      `/domains/${FTP_USER.split(".")[0] || "opentoowork"}`,
      `/domains/${FTP_USER.split(".")[0] || "opentoowork"}/public_html`,
      `/home/${FTP_USER}`,
      `/home/${FTP_USER}/public_html`,
    ];
    
    // Test each path
    for (const path of pathsToTest) {
      // Go back to root for each test
      await ftp.cwd("/");
      
      const result = await exploreDirectory(ftp, path);
      results.testedPaths.push(result);
      
      // If we found public_html or htdocs, explore deeper
      if (result.hasPublicHtml && !result.error) {
        // Look for existing directories inside
        for (const item of result.contents.slice(0, 5)) {
          const subPath = `${path}/${item}`;
          const subResult = await exploreDirectory(ftp, subPath);
          if (!subResult.error && subResult.contents.length > 0) {
            results.testedPaths.push(subResult);
          }
        }
      }
    }
    
    // Generate recommendations
    const publicHtmlPaths = results.testedPaths.filter((p: any) => 
      p.path.toLowerCase().includes("public_html") && !p.error
    );
    
    const htdocsPaths = results.testedPaths.filter((p: any) => 
      p.path.toLowerCase().includes("htdocs") && !p.error
    );
    
    if (publicHtmlPaths.length > 0) {
      results.recommendations.push({
        type: "public_html",
        message: "Found public_html directory - this is likely your web root",
        paths: publicHtmlPaths.map((p: any) => p.path),
        suggestedFtpBaseDir: publicHtmlPaths[0].path + "/resumes",
      });
    }
    
    if (htdocsPaths.length > 0) {
      results.recommendations.push({
        type: "htdocs",
        message: "Found htdocs directory - alternative web root",
        paths: htdocsPaths.map((p: any) => p.path),
        suggestedFtpBaseDir: htdocsPaths[0].path + "/resumes",
      });
    }
    
    // Check if /resumes exists and where
    const resumesPaths = results.testedPaths.filter((p: any) => 
      p.contents.some((c: string) => c === "resumes")
    );
    
    if (resumesPaths.length > 0) {
      results.recommendations.push({
        type: "existing_resumes",
        message: "Found existing 'resumes' directory",
        locations: resumesPaths.map((p: any) => `${p.path}/resumes`),
      });
    }
    
    await ftp.quit();
    
    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        nextSteps: [
          "1. Review the tested paths above",
          "2. Look for directories containing 'public_html', 'htdocs', or 'www'",
          "3. Update FTP_BASE_DIR environment variable in Supabase Dashboard",
          "4. Format: /path/to/public_html/resumes (without trailing slash)",
        ],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
    
  } catch (error: any) {
    await ftp.quit();
    return new Response(
      JSON.stringify({ 
        error: error.message,
        ftpHost: FTP_HOST,
        ftpUser: FTP_USER,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
