import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/queries";
import { toList } from "@/lib/jobs";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Boas-vindas — Nexora" }, { name: "description", content: "Configure seu perfil." }] }),
  component: Onboarding,
});

const MODES = ["remoto", "híbrido", "presencial"];

function Onboarding() {
  const { data: p } = useQuery(profileQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ full_name: "", headline: "", location: "", roles: "", skills: "", summary: "", modes: [] as string[] });
  useEffect(() => { if (p) setF((x) => ({ ...x, full_name: p.full_name ?? "" })); }, [p]);
  const [saving, setSaving] = useState(false);

  async function finish() {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").update({
      full_name: f.full_name, headline: f.headline, location: f.location, summary: f.summary,
      desired_roles: toList(f.roles), skills: toList(f.skills), work_modes: f.modes, onboarded: true,
    }).eq("id", u.user!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Perfil criado! Complete experiências e formação quando quiser.");
    navigate({ to: "/profile" });
  }

  const steps = [
    <div key="a" className="space-y-4">
      <Field label="Nome completo"><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></Field>
      <Field label="Cargo ou área atual"><Input placeholder="Ex.: Professora de matemática" value={f.headline} onChange={(e) => setF({ ...f, headline: e.target.value })} /></Field>
      <Field label="Cidade / estado"><Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></Field>
    </div>,
    <div key="b" className="space-y-4">
      <Field label="Cargos desejados (separe por vírgula)"><Input placeholder="Analista de dados, Product Ops" value={f.roles} onChange={(e) => setF({ ...f, roles: e.target.value })} /></Field>
      <Field label="Principais habilidades (separe por vírgula)"><Textarea value={f.skills} onChange={(e) => setF({ ...f, skills: e.target.value })} /></Field>
      <Field label="Modalidade preferida">
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <Button key={m} type="button" size="sm" variant={f.modes.includes(m) ? "default" : "outline"}
              onClick={() => setF({ ...f, modes: f.modes.includes(m) ? f.modes.filter((x) => x !== m) : [...f.modes, m] })}>{m}</Button>
          ))}
        </div>
      </Field>
    </div>,
    <div key="c" className="space-y-4">
      <Field label="Resumo profissional"><Textarea rows={6} placeholder="Conte sua trajetória e o que busca na transição." value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} /></Field>
    </div>,
  ];

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-sm text-muted-foreground">Passo {step + 1} de 3</p>
      <h1 className="mt-1 text-3xl font-semibold">Vamos montar seu perfil</h1>
      <div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((step + 1) / 3) * 100}%` }} /></div>
      <div className="mt-8 rounded-2xl border bg-card p-6">{steps[step]}</div>
      <div className="mt-6 flex justify-between">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Voltar</Button>
        {step < 2 ? <Button onClick={() => setStep(step + 1)}>Continuar</Button> : <Button disabled={saving} onClick={finish}>{saving ? "Salvando…" : "Concluir"}</Button>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
