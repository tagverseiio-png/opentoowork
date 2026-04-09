type ResumeMode = "view" | "download";

const DOC_EXTENSIONS = new Set(["doc", "docx"]);

const getSupabaseUrl = (): string => {
  const value = import.meta.env.VITE_SUPABASE_URL;
  return typeof value === "string" ? value.replace(/\/$/, "") : "";
};

const getExtensionFromPath = (value: string): string | null => {
  const cleaned = value.split("?")[0].split("#")[0].trim();
  const parts = cleaned.split(".");
  if (parts.length < 2) return null;
  return parts.pop()?.toLowerCase() || null;
};

const getFileFromLegacyPath = (value: string): string | null => {
  const cleaned = value.trim();
  if (!cleaned) return null;

  // Direct file name style: resume_xxx.pdf
  if (/^resume_[^/]+\.[a-z0-9]+$/i.test(cleaned)) {
    return cleaned;
  }

  // Relative/absolute FTP path style: /resumes/resume_xxx.pdf or resumes/resume_xxx.pdf
  const pathMatch = cleaned.match(/(?:^|\/)resumes\/([^/?#]+)/i);
  if (pathMatch?.[1]) {
    return decodeURIComponent(pathMatch[1]);
  }

  return null;
};

const getFileFromUrl = (value: string): string | null => {
  try {
    const parsed = new URL(value);

    const fileParam = parsed.searchParams.get("file");
    if (fileParam) return decodeURIComponent(fileParam);

    const pathMatch = parsed.pathname.match(/(?:^|\/)resumes\/([^/]+)/i);
    if (pathMatch?.[1]) {
      return decodeURIComponent(pathMatch[1]);
    }

    return null;
  } catch {
    return null;
  }
};

const isServeResumeUrl = (value: string): boolean => {
  try {
    return new URL(value).pathname.includes("/functions/v1/serve-resume");
  } catch {
    return false;
  }
};

const stripViewParam = (value: string): string => {
  try {
    const parsed = new URL(value);
    parsed.searchParams.delete("view");
    return parsed.toString();
  } catch {
    return value.replace(/[?&]view=true/g, "").replace(/\?$/, "");
  }
};

const appendViewParam = (value: string): string => {
  try {
    const parsed = new URL(value);
    parsed.searchParams.set("view", "true");
    return parsed.toString();
  } catch {
    return value;
  }
};

const getExtensionFromResolvedUrl = (value: string): string | null => {
  try {
    const parsed = new URL(value);
    const fileParam = parsed.searchParams.get("file");
    if (fileParam) return getExtensionFromPath(fileParam);
    return getExtensionFromPath(parsed.pathname);
  } catch {
    return getExtensionFromPath(value);
  }
};

export const resolveResumeUrl = (rawValue: string | null | undefined): string => {
  if (!rawValue) return "";

  const value = rawValue.trim();
  if (!value) return "";

  const supabaseUrl = getSupabaseUrl();

  if (value.startsWith("http://") || value.startsWith("https://")) {
    const fileFromUrl = getFileFromUrl(value);
    if (fileFromUrl && supabaseUrl) {
      return `${supabaseUrl}/functions/v1/serve-resume?file=${encodeURIComponent(fileFromUrl)}`;
    }
    return value;
  }

  const fileFromPath = getFileFromLegacyPath(value);
  if (fileFromPath && supabaseUrl) {
    return `${supabaseUrl}/functions/v1/serve-resume?file=${encodeURIComponent(fileFromPath)}`;
  }

  // Legacy Supabase storage relative path fallback.
  const cleanPath = value.startsWith("/") ? value.slice(1) : value;
  if (supabaseUrl && cleanPath) {
    return `${supabaseUrl}/storage/v1/object/public/${cleanPath}`;
  }

  return value;
};

export const getResumeActionUrl = (
  rawValue: string | null | undefined,
  mode: ResumeMode,
): string => {
  const resolved = resolveResumeUrl(rawValue);
  if (!resolved) return "";

  const noViewParam = stripViewParam(resolved);
  if (mode === "download") {
    return noViewParam;
  }

  if (!isServeResumeUrl(noViewParam)) {
    return noViewParam;
  }

  const ext = getExtensionFromResolvedUrl(noViewParam);
  if (!ext) {
    return appendViewParam(noViewParam);
  }

  // For both PDF and Word docs, pass view=true so the edge function can decide inline/redirect behavior.
  if (ext === "pdf" || DOC_EXTENSIONS.has(ext)) {
    return appendViewParam(noViewParam);
  }

  return noViewParam;
};

export const isWordResume = (rawValue: string | null | undefined): boolean => {
  const resolved = resolveResumeUrl(rawValue);
  if (!resolved) return false;

  const ext = getExtensionFromResolvedUrl(resolved);
  return !!ext && DOC_EXTENSIONS.has(ext);
};