import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Nova senha — Nexora" }, { name: "description", content: "Defina uma nova senha." }, { property: "og:title", content: "Nova senha — Nexora" }, { property: "og:description", content: "Defina uma nova senha." }] }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const navigate = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada.");
    navigate({ to: "/dashboard" });
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-3xl border bg-card p-8 shadow-soft">
        <Logo />
        <h1 className="text-2xl font-semibold">Defina sua nova senha</h1>
        <div className="space-y-2"><Label htmlFor="pw">Nova senha</Label><Input id="pw" type="password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <Button className="w-full">Salvar senha</Button>
      </form>
    </div>
  );
}
