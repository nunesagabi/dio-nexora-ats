import { createFileRoute } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Política de privacidade — Nexora" },
      { name: "description", content: "Como a Nexora coleta, usa, protege e exclui seus dados." },
      { property: "og:title", content: "Política de privacidade — Nexora" },
      { property: "og:description", content: "Como a Nexora protege seus dados." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Logo />
        <h1 className="mt-10 text-3xl font-semibold">Política de privacidade</h1>
        <div className="mt-6 space-y-5 text-muted-foreground [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground">
          <p>A Nexora trata seus dados de acordo com a LGPD (Lei 13.709/2018), apenas para oferecer os recursos da plataforma.</p>
          <h2>Quais dados coletamos</h2>
          <p>Dados de conta (nome e e-mail), informações profissionais que você cadastra (experiências, formação, habilidades, preferências), currículos em PDF enviados, vagas salvas, análises e candidaturas.</p>
          <h2>Como usamos</h2>
          <p>Para buscar vagas, calcular compatibilidade e gerar currículos. Trechos do seu perfil e da vaga são enviados a um modelo de IA somente no momento da análise e não são usados para treinar modelos.</p>
          <h2>Proteção</h2>
          <p>Cada pessoa acessa apenas os próprios dados. Currículos ficam em armazenamento privado. Credenciais de integrações ficam no servidor e nunca no navegador.</p>
          <h2>Seus direitos e exclusão</h2>
          <p>Você pode editar seus dados a qualquer momento e excluir sua conta em Configurações → Excluir conta. A exclusão remove permanentemente perfil, arquivos, vagas, análises, currículos e candidaturas.</p>
          <h2>Fontes de vagas</h2>
          <p>As vagas vêm de fontes externas (Remotive e Adzuna) e pertencem aos seus anunciantes. Sempre confira a vaga no link original.</p>
        </div>
      </div>
    </div>
  );
}
