import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, ExternalLink, FileText, Loader2, Repeat, Sparkles, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { analyzeMatch, generateResume } from "@/lib/nexora.functions";
import { jobQuery, matchesQuery } from "@/lib/queries";
import { SOURCE_LABEL } from "@/lib/jobs";

export const Route = createFileRoute("/_authenticated/jobs/$jobId")({
  head: () => ({ meta: [{ title: "Detalhes da vaga — Nexora" }, { name: "description", content: "Detalhes e match da vaga." }] }),
  component: JobDetail,
});

function JobDetail() {
  const { jobId } = Route.useParams();
  const { data: job, isLoading } = useQuery(jobQuery(jobId));
  const matches = useQuery(matchesQuery);
  const match = matches.data?.find((m) => m.job_id === jobId);
  const analyze = useServerFn(analyzeMatch);
  const gen = useServerFn(generateResume);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<"match" | "resume" | null>(null);

  async function runMatch() {
    setBusy("match");
    try {
      await analyze({ data: { jobId } });
      await qc.invalidateQueries({ queryKey: ["matches"] });
      toast.success("Análise concluída.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }
  async function runResume() {
    setBusy("resume");
    try {
      const r = await gen({ data: { jobId } });
      await qc.invalidateQueries({ queryKey: ["resumes"] });
      toast.success("Currículo gerado. Revise antes de usar.");
      navigate({ to: "/resumes/$resumeId", params: { resumeId: r.id } });
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(null);
    }
  }
  async function remove() {
    if (!confirm("Excluir esta vaga e suas análises?")) return;
    await supabase.from("jobs").delete().eq("id", jobId);
    qc.invalidateQueries();
    navigate({ to: "/jobs" });
  }

  if (isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (!job) return <p>Vaga não encontrada. <Link to="/jobs" className="text-primary">Voltar</Link></p>;

  return (
    <div>
      <Link to="/jobs" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Vagas</Link>
      <div className="grid gap-6 lg:grid-cols-5">
        <article className="rounded-2xl border bg-card p-6 lg:col-span-3">
          <h1 className="text-2xl font-semibold">{job.title}</h1>
          <p className="mt-1 text-muted-foreground">{job.company} · {job.location}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">Fonte: {SOURCE_LABEL[job.source] ?? job.source}</Badge>
            {job.published_at && <Badge variant="outline">Publicada em {new Date(job.published_at).toLocaleDateString("pt-BR")}</Badge>}
            {job.contract_type && <Badge variant="outline">{job.contract_type.replace(/_/g, " ")}</Badge>}
            {job.salary && <Badge variant="outline">{job.salary}</Badge>}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {job.url && <Button variant="outline" size="sm" asChild><a href={job.url} target="_blank" rel="noopener noreferrer">Ver vaga original <ExternalLink className="ml-1 h-3 w-3" /></a></Button>}
            <Button variant="ghost" size="sm" onClick={remove}><Trash2 className="mr-1 h-4 w-4" /> Excluir</Button>
          </div>
          <h2 className="mt-6 font-semibold">Descrição</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{job.description}</p>
          {job.requirements && (<><h2 className="mt-6 font-semibold">Requisitos</h2><p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{job.requirements}</p></>)}
        </article>

        <aside className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Match com IA</h2>
              <Button size="sm" variant={match ? "outline" : "default"} disabled={busy !== null} onClick={runMatch}>
                {busy === "match" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}{match ? "Reanalisar" : "Analisar"}
              </Button>
            </div>
            {busy === "match" && <p className="mt-4 text-sm text-muted-foreground">Comparando seu perfil com a vaga…</p>}
            {!match && busy !== "match" && <p className="mt-4 text-sm text-muted-foreground">Compare seu perfil com esta vaga para ver pontuação, lacunas e competências transferíveis.</p>}
            {match && (
              <div className="mt-5">
                <div className="flex items-end gap-2"><span className="font-display text-5xl font-bold text-primary">{match.score}</span><span className="pb-2 text-muted-foreground">/ 100 estimado</span></div>
                <div className="mt-3 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${match.score}%` }} /></div>
                <p className="mt-4 text-sm">{match.explanation}</p>
                <List title="Requisitos atendidos" items={match.met} icon={<CheckCircle2 className="h-4 w-4 text-success" />} />
                <List title="Lacunas" items={match.gaps} icon={<XCircle className="h-4 w-4 text-destructive" />} />
                <List title="Competências transferíveis" items={match.transferable} icon={<Repeat className="h-4 w-4 text-primary" />} />
                <p className="mt-4 text-xs text-muted-foreground">Estimativa gerada por IA. Não garante contratação nem aprovação em sistemas ATS.</p>
              </div>
            )}
          </div>
          <div className="rounded-2xl border bg-card p-6">
            <h2 className="font-semibold">Currículo para esta vaga</h2>
            <p className="mt-1 text-sm text-muted-foreground">Versão ATS usando apenas as informações do seu perfil.</p>
            <Button className="mt-4 w-full" disabled={busy !== null} onClick={runResume}>
              {busy === "resume" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FileText className="mr-1 h-4 w-4" />}Gerar currículo
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function List({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) {
  if (!items.length) return null;
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 space-y-1.5">{items.map((i) => <li key={i} className="flex gap-2 text-sm">{icon}<span>{i}</span></li>)}</ul>
    </div>
  );
}
