// @ts-nocheck — This is a Supabase Edge Function (Deno runtime), not compiled by local TS
// ═══════════════════════════════════════════════════════════════
// Serve Resume Edge Function — Downloads file from FTP and streams it
// Usage: GET /serve-resume?file=resume_xxx.pdf
// ═══════════════════════════════════════════════════════════════
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FTP_HOST = Deno.env.get("FTP_HOST") || "82.25.87.221";
const FTP_PORT = parseInt(Deno.env.get("FTP_PORT") || "21");
const FTP_USER = Deno.env.get("FTP_USER") || "";
const FTP_PASS = Deno.env.get("FTP_PASS") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// ─── Minimal FTP Client for downloading ─────────────────────────
class FTPDownloader {
  private conn!: Deno.TcpConn;
  private reader!: ReadableStreamDefaultReader<Uint8Array>;
  private textDecoder = new TextDecoder();
  private textEncoder = new TextEncoder();
  private buffer = "";

  async connect(host: string, port: number): Promise<void> {
    this.conn = await Deno.connect({ hostname: host, port });
    this.reader = this.conn.readable.getReader();
    await this.readResponse();
  }

  private async readResponse(): Promise<string> {
    while (true) {
      const { value, done } = await this.reader.read();
      if (done) break;
      this.buffer += this.textDecoder.decode(value);
      const lines = this.buffer.split("\r\n");
      for (let i = 0; i < lines.length - 1; i++) {
        if (/^\d{3} /.test(lines[i])) {
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

  async download(filepath: string, controlHost: string): Promise<Uint8Array> {
    // Binary mode
    await this.sendCommand("TYPE I");

    // Try EPSV first
    let dataHost = controlHost;
    let dataPort = 0;

    const epsvResp = await this.sendCommand("EPSV");
    if (epsvResp.startsWith("229")) {
      const epsvMatch = epsvResp.match(/\|\|\|(\d+)\|/);
      if (epsvMatch) {
        dataPort = parseInt(epsvMatch[1]);
        dataHost = controlHost;
      }
    }

    if (dataPort === 0) {
      // Fall back to PASV
      const pasvResp = await this.sendCommand("PASV");
      if (!pasvResp.startsWith("227")) throw new Error(`PASV failed: ${pasvResp}`);
      const match = pasvResp.match(/\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/);
      if (!match) throw new Error(`Cannot parse PASV: ${pasvResp}`);
      dataHost = `${match[1]}.${match[2]}.${match[3]}.${match[4]}`;
      dataPort = parseInt(match[5]) * 256 + parseInt(match[6]);
      // Override private IPs
      if (dataHost.startsWith("10.") || dataHost.startsWith("192.168.") ||
          dataHost.startsWith("172.") || dataHost === "127.0.0.1") {
        dataHost = controlHost;
      }
    }

    const dataConn = await Deno.connect({ hostname: dataHost, port: dataPort });

    const retrResp = await this.sendCommand(`RETR ${filepath}`);
    if (!retrResp.startsWith("150") && !retrResp.startsWith("125")) {
      dataConn.close();
      throw new Error(`RETR failed: ${retrResp}`);
    }

    // Read all data
    const chunks: Uint8Array[] = [];
    const dataReader = dataConn.readable.getReader();
    while (true) {
      const { value, done } = await dataReader.read();
      if (done) break;
      chunks.push(value);
    }

    await this.readResponse(); // 226 Transfer complete

    // Combine chunks
    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }

  async quit(): Promise<void> {
    try { await this.sendCommand("QUIT"); } catch {}
    try { this.conn.close(); } catch {}
  }
}

// ─── Content type mapping ───────────────────────────────────────
function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf": return "application/pdf";
    case "doc": return "application/msword";
    case "docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    default: return "application/octet-stream";
  }
}

// ─── Main handler ────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const filename = url.searchParams.get("file");

    if (!filename) {
      return new Response(JSON.stringify({ error: "Missing ?file= parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize filename — prevent directory traversal
    const safeName = filename.replace(/[^a-zA-Z0-9_.\-]/g, "");
    if (safeName !== filename || filename.includes("..") || filename.includes("/")) {
      return new Response(JSON.stringify({ error: "Invalid filename" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ftp = new FTPDownloader();
    try {
      // Check if this is a view request for a DOCX/DOC file
      const viewMode = url.searchParams.get("view") === "true";
      const ext = safeName.split(".").pop()?.toLowerCase();
      const isWordDoc = ext === "doc" || ext === "docx";

      // For Word docs in view mode, redirect to Google Docs Viewer
      if (viewMode && isWordDoc) {
        // Build the direct download URL for this file (without view param)
        const downloadUrl = `${url.origin}${url.pathname}?file=${safeName}`;
        const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(downloadUrl)}&embedded=false`;
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            "Location": googleViewerUrl,
          },
        });
      }

      await ftp.connect(FTP_HOST, FTP_PORT);
      await ftp.login(FTP_USER, FTP_PASS);
      const fileData = await ftp.download(`/resumes/${safeName}`, FTP_HOST);
      await ftp.quit();

      if (fileData.length === 0) {
        return new Response(JSON.stringify({ error: "File is empty or not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // For PDF in view mode or default: serve inline
      // For download mode: serve as attachment
      const disposition = (viewMode || ext === "pdf")
        ? `inline; filename="${safeName}"`
        : `attachment; filename="${safeName}"`;

      return new Response(fileData, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": getContentType(safeName),
          "Content-Disposition": disposition,
          "Content-Length": fileData.length.toString(),
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch (ftpErr: any) {
      await ftp.quit();
      return new Response(JSON.stringify({ error: `FTP download failed: ${ftpErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
