import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Briefcase, FileText, Gauge, KanbanSquare, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexora — Sua próxima oportunidade começa aqui" },
      { name: "description", content: "Plataforma de carreira inteligente para quem está em transição: vagas reais, match com IA, currículo ATS e gestão de candidaturas." },
      { property: "og:title", content: "Nexora — Carreira inteligente, oportunidades reais" },
      { property: "og:description", content: "Vagas reais no Brasil e remotas, match com IA e currículos ATS personalizados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Briefcase, title: "Vagas reais", text: "Brasil e remotas internacionais, com fonte e link original." },
  { icon: Gauge, title: "Match com IA", text: "Pontuação explicada, lacunas e competências transferíveis." },
  { icon: FileText, title: "Currículo ATS", text: "Versões por vaga, só com informações verdadeiras, em PDF." },
  { icon: KanbanSquare, title: "Candidaturas", text: "Kanban do salvo à proposta, com notas, datas e links." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-hero">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="flex gap-2">
          <Button variant="ghost" asChild><Link to="/auth">Entrar</Link></Button>
          <Button asChild><Link to="/auth" search={{ mode: "signup" }}>Criar conta</Link></Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="py-20 sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-sm text-secondary-foreground shadow-soft">
            <Sparkles className="h-4 w-4" /> Carreira inteligente, oportunidades reais.
          </span>
          <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-[1.05] sm:text-7xl">
            Sua próxima oportunidade <span className="text-primary">começa aqui.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Para quem está em transição de carreira: encontre vagas reais, entenda seu encaixe e candidate-se com um currículo feito para cada vaga.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>Começar grátis <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild><Link to="/privacy">Como cuidamos dos seus dados</Link></Button>
          </div>
        </section>

        <section className="grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-soft">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Seus dados são privados e podem ser excluídos a qualquer momento.</span>
          <Link to="/privacy" className="hover:text-foreground">Política de privacidade</Link>
        </div>
      </footer>
    </div>
  );
}
