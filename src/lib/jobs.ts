export type ExternalJob = {
  source: string;
  external_id: string;
  title: string;
  company: string | null;
  location: string | null;
  work_mode: string | null;
  contract_type: string | null;
  seniority: string | null;
  salary: string | null;
  description: string;
  url: string;
  published_at: string | null;
};

export function stripHtml(html: string): string {
  return html
    .replace(/<\/(p|li|h\d|div|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const STATUSES = [
  { id: "saved", label: "Vagas salvas" },
  { id: "applied", label: "Candidaturas enviadas" },
  { id: "interview", label: "Entrevistas" },
  { id: "offer", label: "Propostas" },
  { id: "closed", label: "Encerrados" },
] as const;
export type AppStatus = (typeof STATUSES)[number]["id"];

export const SOURCE_LABEL: Record<string, string> = {
  remotive: "Remotive",
  adzuna: "Adzuna",
  manual: "Importada manualmente",
};

/** Split comma/newline separated text into a clean unique list. */
export function toList(s: string): string[] {
  return Array.from(new Set(s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean))).slice(0, 50);
}

export function validateResumeFile(file: { type: string; size: number; name: string }): string | null {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return "Envie um arquivo PDF.";
  if (file.size > 5 * 1024 * 1024) return "O arquivo deve ter no máximo 5 MB.";
  return null;
}
