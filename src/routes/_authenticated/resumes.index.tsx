import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader } from "@/components/Logo";
import { generateResume } from "@/lib/nexora.functions";
import { resumesQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/resumes/")({
  head: () => ({ meta: [{ title: "Currículos — Nexora" }, { name: "description", content: "Seus currículos ATS." }] }),
  component: Resumes,
});

function Resumes() {
  const { data, isLoading } = useQuery(resumesQuery);
  const gen = useServerFn(generateResume);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  async function general() {
    setBusy(true);
    try {
      const r = await gen({ data: { jobId: null } });
      await qc.invalidateQueries({ queryKey: ["resumes"] });
      navigate({ to: "/resumes/$resumeId", params: { resumeId: r.id } });
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <div>
      <PageHeader title="Currículos ATS" subtitle="Gere versões por vaga na página de cada vaga, ou um currículo geral aqui."
        action={<Button disabled={busy} onClick={general}>{busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}Gerar currículo geral</Button>} />
      {isLoading && <Skeleton className="h-40 rounded-2xl" />}
      {data?.length === 0 && <EmptyState icon={<FileText className="h-5 w-5" />} title="Nenhum currículo ainda" text="Gere um currículo geral ou personalizado para uma vaga salva." />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((r) => (
          <Link key={r.id} to="/resumes/$resumeId" params={{ resumeId: r.id }} className="rounded-2xl border bg-card p-5 hover:border-primary">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-semibold">{r.title}</h3>
            <p className="text-xs text-muted-foreground">Atualizado em {new Date(r.updated_at).toLocaleDateString("pt-BR")}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
