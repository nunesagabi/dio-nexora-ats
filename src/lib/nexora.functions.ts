import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { stripHtml, type ExternalJob } from "./jobs";

const AI_LIMIT_PER_HOUR = 30;

/* ---------------- Job search ---------------- */

const searchSchema = z.object({
  query: z.string().max(120).default(""),
  location: z.string().max(120).default(""),
  source: z.enum(["all", "remotive", "adzuna"]).default("all"),
  workMode: z.string().max(30).default(""),
  seniority: z.string().max(30).default(""),
  contract: z.string().max(30).default(""),
});

type SourceStatus = { source: string; ok: boolean; message?: string; count: number };

async function searchRemotive(q: string): Promise<ExternalJob[]> {
  const url = `https://remotive.com/api/remote-jobs?limit=40${q ? `&search=${encodeURIComponent(q)}` : ""}`;
  const res = await fetch(url, { headers: { "User-Agent": "Nexora/1.0" } });
  if (!res.ok) throw new Error(`Remotive respondeu ${res.status}`);
  const data = (await res.json()) as { jobs: any[] };
  const okLoc = /(worldwide|anywhere|brazil|brasil|latam|latin america|americas|south america)/i;
  return data.jobs
    .filter((j) => !j.candidate_required_location || okLoc.test(j.candidate_required_location))
    .map((j) => ({
      source: "remotive",
      external_id: String(j.id),
      title: j.title,
      company: j.company_name,
      location: j.candidate_required_location || "Remoto",
      work_mode: "remoto",
      contract_type: j.job_type || null,
      seniority: null,
      salary: j.salary || null,
      description: stripHtml(j.description ?? "").slice(0, 8000),
      url: j.url,
      published_at: j.publication_date ? new Date(j.publication_date).toISOString() : null,
    }));
}

async function searchAdzuna(q: string, where: string): Promise<ExternalJob[]> {
  const id = process.env.ADZUNA_APP_ID;
  const key = process.env.ADZUNA_APP_KEY;
  if (!id || !key) throw new Error("PENDING");
  const params = new URLSearchParams({ app_id: id, app_key: key, results_per_page: "30", "content-type": "application/json" });
  if (q) params.set("what", q);
  if (where) params.set("where", where);
  const res = await fetch(`https://api.adzuna.com/v1/api/jobs/br/search/1?${params}`);
  if (!res.ok) throw new Error(`Adzuna respondeu ${res.status}`);
  const data = (await res.json()) as { results: any[] };
  return data.results.map((j) => ({
    source: "adzuna",
    external_id: String(j.id),
    title: stripHtml(j.title),
    company: j.company?.display_name ?? null,
    location: j.location?.display_name ?? "Brasil",
    work_mode: /remot|home office/i.test(`${j.title} ${j.description}`) ? "remoto" : "presencial/híbrido",
    contract_type: [j.contract_type, j.contract_time].filter(Boolean).join(" · ") || null,
    seniority: null,
    salary: j.salary_min ? `R$ ${Math.round(j.salary_min)}${j.salary_max ? ` – ${Math.round(j.salary_max)}` : ""}` : null,
    description: stripHtml(j.description ?? ""),
    url: j.redirect_url,
    published_at: j.created ?? null,
  }));
}

export const searchJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => searchSchema.parse(d))
  .handler(async ({ data }) => {
    const statuses: SourceStatus[] = [];
    let jobs: ExternalJob[] = [];
    const tasks: Array<[string, Promise<ExternalJob[]>]> = [];
    if (data.source !== "adzuna") tasks.push(["remotive", searchRemotive(data.query)]);
    if (data.source !== "remotive") tasks.push(["adzuna", searchAdzuna(data.query, data.location)]);
    for (const [source, p] of tasks) {
      try {
        const r = await p;
        jobs = jobs.concat(r);
        statuses.push({ source, ok: true, count: r.length });
      } catch (e) {
        const msg = (e as Error).message;
        statuses.push({
          source,
          ok: false,
          count: 0,
          message:
            msg === "PENDING"
              ? "Integração Adzuna (vagas no Brasil) pendente: credenciais ADZUNA_APP_ID e ADZUNA_APP_KEY não configuradas."
              : `Fonte indisponível no momento (${msg}).`,
        });
      }
    }
    const norm = (s: string | null | undefined) => (s ?? "").toLowerCase();
    if (data.location && data.source !== "adzuna") {
      // Remotive is remote-only; keep location filter loose for it.
    }
    if (data.workMode) jobs = jobs.filter((j) => norm(j.work_mode).includes(data.workMode.toLowerCase()));
    if (data.contract) jobs = jobs.filter((j) => norm(j.contract_type).replace(/_/g, " ").includes(data.contract.toLowerCase()));
    if (data.seniority) {
      const map: Record<string, RegExp> = {
        junior: /(junior|júnior|jr\b|entry)/i,
        pleno: /(pleno|mid|intermediate)/i,
        senior: /(senior|sênior|sr\b|lead|staff|principal)/i,
      };
      const re = map[data.seniority];
      if (re) jobs = jobs.filter((j) => re.test(j.title));
    }
    jobs.sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
    return { jobs: jobs.slice(0, 60), statuses };
  });

/* ---------------- AI helpers ---------------- */

async function enforceRateLimit(supabase: any, kind: string) {
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await supabase.from("ai_usage").select("id", { count: "exact", head: true }).gte("created_at", since);
  if ((count ?? 0) >= AI_LIMIT_PER_HOUR) throw new Error(`Limite de ${AI_LIMIT_PER_HOUR} análises por hora atingido. Tente mais tarde.`);
  await supabase.from("ai_usage").insert({ kind });
}

async function loadProfileText(supabase: any, userId: string) {
  const [{ data: p }, { data: exps }, { data: edus }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("experiences").select("*").order("created_at"),
    supabase.from("educations").select("*").order("created_at"),
  ]);
  if (!p) throw new Error("Perfil não encontrado.");
  const lines = [
    `Nome: ${p.full_name ?? ""}`,
    `Título: ${p.headline ?? ""}`,
    `Localização: ${p.location ?? ""}`,
    `Contato: ${[p.phone, p.linkedin].filter(Boolean).join(" | ")}`,
    `Resumo: ${p.summary ?? ""}`,
    `Cargos desejados: ${(p.desired_roles ?? []).join(", ")}`,
    `Habilidades: ${(p.skills ?? []).join(", ")}`,
    `Idiomas: ${(p.languages ?? []).join(", ")}`,
    `Experiências:`,
    ...(exps ?? []).map((e: any) => `- ${e.role} @ ${e.company} (${e.start_date ?? "?"} – ${e.end_date ?? "atual"}): ${e.description ?? ""}`),
    `Formação:`,
    ...(edus ?? []).map((e: any) => `- ${e.degree} — ${e.institution} (${e.start_date ?? ""} – ${e.end_date ?? ""})`),
  ];
  const filled = (exps?.length ?? 0) + (p.skills?.length ?? 0) + (p.summary ? 1 : 0);
  return { text: lines.join("\n").slice(0, 12000), profile: p, filled };
}

async function loadJobText(supabase: any, jobId: string) {
  const { data: j } = await supabase.from("jobs").select("*").eq("id", jobId).maybeSingle();
  if (!j) throw new Error("Vaga não encontrada.");
  const text = `Cargo: ${j.title}\nEmpresa: ${j.company ?? ""}\nLocal: ${j.location ?? ""}\nDescrição: ${j.description ?? ""}\nRequisitos: ${j.requirements ?? ""}`.slice(0, 12000);
  return { text, job: j };
}

/* ---------------- Match ---------------- */

const matchOut = z.object({
  score: z.number(),
  explanation: z.string(),
  met: z.array(z.string()),
  gaps: z.array(z.string()),
  transferable: z.array(z.string()),
});

export const analyzeMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ jobId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const prof = await loadProfileText(supabase, userId);
    if (prof.filled === 0) throw new Error("Complete seu perfil (resumo, experiências ou habilidades) antes de analisar.");
    const job = await loadJobText(supabase, data.jobId);
    await enforceRateLimit(supabase, "match");
    const { runStructured, INJECTION_GUARD } = await import("./ai.server");
    const out = await runStructured(
      matchOut,
      `Você é um orientador de carreira especializado em transição de carreira. Compare o perfil com a vaga e estime a compatibilidade de 0 a 100. Liste requisitos atendidos (met), lacunas (gaps) e competências transferíveis (transferable), com 3 a 6 itens curtos cada. Explique a pontuação em 2-4 frases em português. Seja honesto e não prometa contratação nem aprovação em sistemas ATS. ${INJECTION_GUARD}`,
      `PERFIL:\n<dados>\n${prof.text}\n</dados>\n\nVAGA:\n<dados>\n${job.text}\n</dados>`,
    );
    const score = Math.max(0, Math.min(100, Math.round(out.score)));
    const { data: row, error } = await supabase
      .from("match_analyses")
      .insert({
        job_id: data.jobId,
        score,
        explanation: out.explanation,
        met: out.met.slice(0, 8),
        gaps: out.gaps.slice(0, 8),
        transferable: out.transferable.slice(0, 8),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

/* ---------------- Resume ---------------- */

const resumeOut = z.object({ content: z.string() });

export const generateResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ jobId: z.string().uuid().nullable() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const prof = await loadProfileText(supabase, userId);
    if (prof.filled === 0) throw new Error("Complete seu perfil antes de gerar um currículo.");
    const job = data.jobId ? await loadJobText(supabase, data.jobId) : null;
    await enforceRateLimit(supabase, "resume");
    const { runStructured, INJECTION_GUARD } = await import("./ai.server");
    const out = await runStructured(
      resumeOut,
      `Você escreve currículos otimizados para ATS, em uma coluna. Use EXCLUSIVAMENTE informações presentes no perfil: nunca invente empresas, cargos, datas, números, certificações ou habilidades. Você pode reordenar, reescrever com verbos de ação e priorizar o que é relevante para a vaga. Escreva no idioma da vaga (português se não houver vaga). Formato de texto simples:\n# Nome\nlinha de contato\n## Resumo\n...\n## Experiência\n### Cargo — Empresa | período\n- conquista\n## Formação\n## Habilidades\n## Idiomas\nSem tabelas, ícones ou colunas. ${INJECTION_GUARD}`,
      `PERFIL:\n<dados>\n${prof.text}\n</dados>${job ? `\n\nVAGA ALVO:\n<dados>\n${job.text}\n</dados>` : ""}`,
    );
    const title = job ? `${job.job.title}${job.job.company ? ` — ${job.job.company}` : ""}` : "Currículo geral";
    const { data: row, error } = await supabase
      .from("resumes")
      .insert({ job_id: data.jobId, title, content: out.content.slice(0, 20000) })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

/* ---------------- Account deletion ---------------- */

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const { data: files } = await supabase.storage.from("resumes").list(userId);
    if (files?.length) await supabase.storage.from("resumes").remove(files.map((f) => `${userId}/${f.name}`));
    for (const t of ["applications", "match_analyses", "resumes", "jobs", "experiences", "educations", "ai_usage"] as const) {
      await supabase.from(t).delete().eq("user_id", userId);
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
