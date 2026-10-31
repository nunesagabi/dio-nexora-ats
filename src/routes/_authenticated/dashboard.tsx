import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Briefcase, CalendarClock, FileText, Gauge, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/Logo";
import { applicationsQuery, matchesQuery, profileQuery, resumesQuery } from "@/lib/queries";
import { computeStats } from "@/lib/stats";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Nexora" }, { name: "description", content: "Seu painel de carreira." }] }),
  component: Dashboard,
});

function Dashboard() {
  const profile = useQuery(profileQuery);
  const apps = useQuery(applicationsQuery);
  const matches = useQuery(matchesQuery);
  const resumes = useQuery(resumesQuery);

  if (profile.data && !profile.data.onboarded) return <Navigate to="/onboarding" />;
  const loading = profile.isLoading || apps.isLoading || matches.isLoading || resumes.isLoading;
  const err = profile.error || apps.error || matches.error || resumes.error;
  const s = computeStats(apps.data ?? [], matches.data ?? [], (resumes.data ?? []).length);

  const cards = [
    { label: "Vagas salvas", value: s.saved, icon: Briefcase },
    { label: "Candidaturas", value: s.applied, icon: Send },
    { label: "Entrevistas", value: s.interviews, icon: Users },
    { label: "Currículos gerados", value: s.resumes, icon: FileText },
    { label: "Compatibilidade média", value: s.avgScore === null ? "—" : `${s.avgScore}%`, icon: Gauge },
  ];

  const first = profile.data?.full_name?.split(" ")[0];
  return (
    <div>
      <PageHeader title={first ? `Olá, ${first}` : "Seu painel"} subtitle="Acompanhe sua transição com dados reais." action={<Button asChild><Link to="/jobs">Buscar vagas <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>} />
      {err && <p className="mb-6 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">Erro ao carregar dados: {(err as Error).message}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-card p-5">
            <c.icon className="h-5 w-5 text-primary" />
            {loading ? <Skeleton className="mt-4 h-8 w-12" /> : <div className="mt-4 font-display text-3xl font-semibold">{c.value}</div>}
            <div className="mt-1 text-sm text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="flex items-center gap-2 font-semibold"><CalendarClock className="h-5 w-5 text-primary" /> Próximos passos</h2>
          {s.upcoming.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nenhuma data de próximo passo registrada. Adicione datas nas suas candidaturas.</p>
          ) : (
            <ul className="mt-4 divide-y">
              {s.upcoming.map((a) => (
                <li key={a.id} className="flex justify-between py-3 text-sm">
                  <span className="font-medium">{a.title}{a.company ? ` · ${a.company}` : ""}</span>
                  <span className="text-muted-foreground">{new Date(a.next_step_at + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="font-semibold">Sugestões</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {!profile.data?.summary && <Suggestion to="/profile" text="Adicione um resumo profissional ao perfil" />}
            {s.saved + s.applied === 0 && <Suggestion to="/jobs" text="Busque e salve suas primeiras vagas" />}
            {(matches.data ?? []).length === 0 && <Suggestion to="/jobs" text="Analise o match de uma vaga salva" />}
            {s.resumes === 0 && <Suggestion to="/resumes" text="Gere seu primeiro currículo ATS" />}
            <Suggestion to="/applications" text="Atualize o status das candidaturas" />
          </ul>
        </section>
      </div>
    </div>
  );
}

function Suggestion({ to, text }: { to: "/profile" | "/jobs" | "/resumes" | "/applications"; text: string }) {
  return (
    <li>
      <Link to={to} className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 hover:bg-secondary">
        {text} <ArrowRight className="h-4 w-4 text-primary" />
      </Link>
    </li>
  );
}
