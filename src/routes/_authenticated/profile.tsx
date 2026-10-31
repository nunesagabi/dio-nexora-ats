import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { educationsQuery, experiencesQuery, profileQuery } from "@/lib/queries";
import { toList, validateResumeFile } from "@/lib/jobs";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Perfil — Nexora" }, { name: "description", content: "Seu perfil profissional." }] }),
  component: Profile,
});

function Profile() {
  const { data: p, isLoading } = useQuery(profileQuery);
  const qc = useQueryClient();
  const [f, setF] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!p) return;
    setF({
      full_name: p.full_name ?? "", headline: p.headline ?? "", location: p.location ?? "", phone: p.phone ?? "",
      linkedin: p.linkedin ?? "", summary: p.summary ?? "", salary_expectation: p.salary_expectation ?? "", seniority: p.seniority ?? "",
      desired_roles: p.desired_roles.join(", "), skills: p.skills.join(", "), languages: p.languages.join(", "), work_modes: p.work_modes.join(", "),
    });
  }, [p]);

  async function save() {
    if (!p) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: f.full_name, headline: f.headline, location: f.location, phone: f.phone, linkedin: f.linkedin,
      summary: f.summary, salary_expectation: f.salary_expectation, seniority: f.seniority,
      desired_roles: toList(f.desired_roles), skills: toList(f.skills), languages: toList(f.languages), work_modes: toList(f.work_modes),
      onboarded: true, updated_at: new Date().toISOString(),
    }).eq("id", p.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Perfil salvo.");
  }

  async function upload(file: File) {
    if (!p) return;
    const err = validateResumeFile(file);
    if (err) return toast.error(err);
    const path = `${p.id}/curriculo.pdf`;
    const { error } = await supabase.storage.from("resumes").upload(path, file, { upsert: true, contentType: "application/pdf" });
    if (error) return toast.error(error.message);
    await supabase.from("profiles").update({ resume_path: path }).eq("id", p.id);
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Currículo enviado com segurança.");
  }

  async function openPdf() {
    if (!p?.resume_path) return;
    const { data, error } = await supabase.storage.from("resumes").createSignedUrl(p.resume_path, 60);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank", "noopener");
  }

  if (isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />;
  const field = (k: string, label: string, ph?: string) => (
    <div className="space-y-2"><Label htmlFor={k}>{label}</Label><Input id={k} placeholder={ph} value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
  );

  return (
    <div>
      <PageHeader title="Perfil profissional" subtitle="Essas informações alimentam o match e os currículos. Use apenas dados verdadeiros." action={<Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar perfil"}</Button>} />
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 rounded-2xl border bg-card p-6 lg:col-span-2">
          <h2 className="font-semibold">Dados e preferências</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("full_name", "Nome completo")}
            {field("headline", "Título profissional")}
            {field("location", "Localização")}
            {field("phone", "Telefone")}
            {field("linkedin", "LinkedIn")}
            {field("seniority", "Senioridade", "Júnior, pleno, sênior")}
            {field("desired_roles", "Cargos desejados", "separados por vírgula")}
            {field("salary_expectation", "Pretensão salarial", "Ex.: R$ 8.000 CLT")}
            {field("work_modes", "Modalidades", "remoto, híbrido")}
            {field("languages", "Idiomas", "Português nativo, Inglês avançado")}
          </div>
          <div className="space-y-2"><Label htmlFor="skills">Habilidades</Label><Textarea id="skills" value={f.skills ?? ""} onChange={(e) => setF({ ...f, skills: e.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor="summary">Resumo</Label><Textarea id="summary" rows={5} value={f.summary ?? ""} onChange={(e) => setF({ ...f, summary: e.target.value })} /></div>
        </section>
        <section className="h-fit rounded-2xl border bg-card p-6">
          <h2 className="font-semibold">Currículo em PDF</h2>
          <p className="mt-1 text-sm text-muted-foreground">Armazenado de forma privada. Máx. 5 MB.</p>
          <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-sm text-muted-foreground hover:bg-muted">
            <FileUp className="h-6 w-6 text-primary" /> {p?.resume_path ? "Substituir PDF" : "Enviar PDF"}
            <input type="file" accept="application/pdf" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
          {p?.resume_path && <Button variant="outline" className="mt-3 w-full" onClick={openPdf}>Ver PDF enviado</Button>}
        </section>
      </div>
      <Experiences />
      <Educations />
    </div>
  );
}

function Experiences() {
  const { data = [] } = useQuery(experiencesQuery);
  const qc = useQueryClient();
  const [f, setF] = useState({ role: "", company: "", start_date: "", end_date: "", description: "" });
  async function add() {
    if (!f.role || !f.company) return toast.error("Informe cargo e empresa.");
    const { error } = await supabase.from("experiences").insert(f);
    if (error) return toast.error(error.message);
    setF({ role: "", company: "", start_date: "", end_date: "", description: "" });
    qc.invalidateQueries({ queryKey: ["experiences"] });
  }
  async function remove(id: string) {
    await supabase.from("experiences").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["experiences"] });
  }
  return (
    <section className="mt-6 rounded-2xl border bg-card p-6">
      <h2 className="font-semibold">Experiências</h2>
      <ul className="mt-4 space-y-3">
        {data.length === 0 && <li className="text-sm text-muted-foreground">Nenhuma experiência cadastrada.</li>}
        {data.map((e) => (
          <li key={e.id} className="flex items-start justify-between gap-4 rounded-xl bg-muted p-4">
            <div><div className="font-medium">{e.role} · {e.company}</div><div className="text-xs text-muted-foreground">{e.start_date} – {e.end_date || "atual"}</div>{e.description && <p className="mt-2 whitespace-pre-line text-sm">{e.description}</p>}</div>
            <Button size="icon" variant="ghost" aria-label="Remover" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4" /></Button>
          </li>
        ))}
      </ul>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <Input placeholder="Cargo" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} />
        <Input placeholder="Empresa" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} />
        <Input placeholder="Início (03/2020)" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} />
        <Input placeholder="Fim (vazio = atual)" value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} />
        <Textarea className="sm:col-span-4" placeholder="Responsabilidades e resultados" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      </div>
      <Button variant="secondary" className="mt-3" onClick={add}><Plus className="mr-1 h-4 w-4" /> Adicionar experiência</Button>
    </section>
  );
}

function Educations() {
  const { data = [] } = useQuery(educationsQuery);
  const qc = useQueryClient();
  const [f, setF] = useState({ degree: "", institution: "", start_date: "", end_date: "" });
  async function add() {
    if (!f.degree || !f.institution) return toast.error("Informe curso e instituição.");
    const { error } = await supabase.from("educations").insert(f);
    if (error) return toast.error(error.message);
    setF({ degree: "", institution: "", start_date: "", end_date: "" });
    qc.invalidateQueries({ queryKey: ["educations"] });
  }
  async function remove(id: string) {
    await supabase.from("educations").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["educations"] });
  }
  return (
    <section className="mt-6 rounded-2xl border bg-card p-6">
      <h2 className="font-semibold">Formação</h2>
      <ul className="mt-4 space-y-3">
        {data.length === 0 && <li className="text-sm text-muted-foreground">Nenhuma formação cadastrada.</li>}
        {data.map((e) => (
          <li key={e.id} className="flex items-center justify-between rounded-xl bg-muted p-4">
            <div><div className="font-medium">{e.degree}</div><div className="text-xs text-muted-foreground">{e.institution} · {e.start_date} – {e.end_date}</div></div>
            <Button size="icon" variant="ghost" aria-label="Remover" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4" /></Button>
          </li>
        ))}
      </ul>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <Input placeholder="Curso" value={f.degree} onChange={(e) => setF({ ...f, degree: e.target.value })} />
        <Input placeholder="Instituição" value={f.institution} onChange={(e) => setF({ ...f, institution: e.target.value })} />
        <Input placeholder="Início" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} />
        <Input placeholder="Conclusão" value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} />
      </div>
      <Button variant="secondary" className="mt-3" onClick={add}><Plus className="mr-1 h-4 w-4" /> Adicionar formação</Button>
    </section>
  );
}
