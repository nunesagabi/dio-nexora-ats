import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["signin", "signup", "forgot"]).optional() }),
  head: () => ({
    meta: [
      { title: "Entrar — Nexora" },
      { name: "description", content: "Acesse sua conta Nexora ou crie uma nova." },
      { property: "og:title", content: "Entrar — Nexora" },
      { property: "og:description", content: "Acesse sua conta Nexora." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initial } = Route.useSearch();
  const [mode, setMode] = useState(initial ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard" });
    });
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === "SIGNED_IN" && s) navigate({ to: "/dashboard" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name } },
        });
        if (error) throw error;
        if (!data.session) setSent("Enviamos um link de confirmação para seu e-mail. Confirme para entrar.");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
        if (error) throw error;
        setSent("Se o e-mail existir, você receberá um link para redefinir a senha.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error((err as Error).message === "Invalid login credentials" ? "E-mail ou senha incorretos." : (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Não foi possível entrar com Google.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4">
      <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-soft">
        <Logo />
        <h1 className="mt-6 text-2xl font-semibold">
          {mode === "signup" ? "Crie sua conta" : mode === "forgot" ? "Recuperar senha" : "Bem-vinda de volta"}
        </h1>
        {sent ? (
          <p className="mt-4 rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">{sent}</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="space-y-2"><Label htmlFor="name">Nome completo</Label><Input id="name" required value={name} onChange={(e) => setName(e.target.value)} /></div>
            )}
            <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            {mode !== "forgot" && (
              <div className="space-y-2"><Label htmlFor="pw">Senha</Label><Input id="pw" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            )}
            <Button className="w-full" disabled={loading}>
              {loading ? "Aguarde…" : mode === "signup" ? "Criar conta" : mode === "forgot" ? "Enviar link" : "Entrar"}
            </Button>
            {mode !== "forgot" && (
              <Button type="button" variant="outline" className="w-full" onClick={google}>Continuar com Google</Button>
            )}
          </form>
        )}
        <div className="mt-6 flex flex-col gap-1 text-sm text-muted-foreground">
          {mode !== "signin" && <button className="text-left hover:text-foreground" onClick={() => { setMode("signin"); setSent(null); }}>Já tenho conta — entrar</button>}
          {mode !== "signup" && <button className="text-left hover:text-foreground" onClick={() => { setMode("signup"); setSent(null); }}>Não tenho conta — criar</button>}
          {mode === "signin" && <button className="text-left hover:text-foreground" onClick={() => setMode("forgot")}>Esqueci minha senha</button>}
        </div>
      </div>
    </div>
  );
}
