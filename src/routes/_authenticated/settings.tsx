import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { deleteAccount } from "@/lib/nexora.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Configurações — Nexora" }, { name: "description", content: "Conta e privacidade." }] }),
  component: Settings,
});

function Settings() {
  const { user } = Route.useRouteContext();
  const del = useServerFn(deleteAccount);
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  async function exportData() {
    const tables = ["profiles", "experiences", "educations", "jobs", "match_analyses", "resumes", "applications"] as const;
    const out: Record<string, unknown> = {};
    for (const t of tables) out[t] = (await supabase.from(t).select("*")).data;
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "nexora-meus-dados.json";
    a.click();
  }

  async function removeAccount() {
    setBusy(true);
    try {
      await del();
      await supabase.auth.signOut();
      toast.success("Conta e dados excluídos.");
      navigate({ to: "/" });
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Configurações" subtitle={user.email ?? undefined} />
      <section className="rounded-2xl border bg-card p-6">
        <h2 className="font-semibold">Privacidade</h2>
        <p className="mt-1 text-sm text-muted-foreground">Leia a <Link to="/privacy" className="text-primary underline">política de privacidade</Link> ou baixe uma cópia dos seus dados.</p>
        <Button variant="outline" className="mt-4" onClick={exportData}>Baixar meus dados</Button>
      </section>
      <section className="mt-6 rounded-2xl border border-destructive/40 bg-card p-6">
        <h2 className="font-semibold text-destructive">Excluir conta</h2>
        <p className="mt-1 text-sm text-muted-foreground">Remove permanentemente perfil, arquivos, vagas, análises, currículos e candidaturas. Digite EXCLUIR para confirmar.</p>
        <div className="mt-4 flex gap-2">
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="EXCLUIR" />
          <Button variant="destructive" disabled={confirmText !== "EXCLUIR" || busy} onClick={removeAccount}>{busy ? "Excluindo…" : "Excluir conta"}</Button>
        </div>
      </section>
    </div>
  );
}
