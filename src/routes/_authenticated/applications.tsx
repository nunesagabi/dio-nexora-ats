import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, ExternalLink, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { applicationsQuery, resumesQuery } from "@/lib/queries";
import { STATUSES, type AppStatus } from "@/lib/jobs";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({ meta: [{ title: "Candidaturas — Nexora" }, { name: "description", content: "Kanban de candidaturas." }] }),
  component: Applications,
});

type App = Tables<"applications">;

function Applications() {
  const { data, isLoading } = useQuery(applicationsQuery);
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<App> | null>(null);

  async function move(a: App, dir: number) {
    const idx = STATUSES.findIndex((s) => s.id === a.status) + dir;
    if (idx < 0 || idx >= STATUSES.length) return;
    const status = STATUSES[idx].id;
    const patch: Partial<App> = { status, updated_at: new Date().toISOString() };
    if (status === "applied" && !a.applied_at) patch.applied_at = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("applications").update(patch).eq("id", a.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["applications"] });
  }

  return (
    <div>
      <PageHeader title="Candidaturas" subtitle="Acompanhe cada processo do início ao fim." action={<Button onClick={() => setEditing({ status: "saved", title: "" })}><Plus className="mr-1 h-4 w-4" /> Nova</Button>} />
      {isLoading ? <Skeleton className="h-96 rounded-2xl" /> : (
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:grid lg:grid-cols-5 lg:px-0">
          {STATUSES.map((col) => {
            const items = (data ?? []).filter((a) => a.status === col.id);
            return (
              <section key={col.id} className="w-72 shrink-0 rounded-2xl bg-muted p-3 lg:w-auto">
                <h2 className="mb-3 flex justify-between px-1 text-sm font-semibold">{col.label}<span className="text-muted-foreground">{items.length}</span></h2>
                <div className="space-y-2">
                  {items.length === 0 && <p className="px-1 py-6 text-center text-xs text-muted-foreground">Vazio</p>}
                  {items.map((a) => (
                    <div key={a.id} className="rounded-xl border bg-card p-3">
                      <div className="text-sm font-medium">{a.title}</div>
                      {a.company && <div className="text-xs text-muted-foreground">{a.company}</div>}
                      {a.next_step_at && <div className="mt-1 text-xs text-primary">Próximo: {new Date(a.next_step_at + "T12:00:00").toLocaleDateString("pt-BR")}</div>}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex">
                          <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Voltar etapa" disabled={col.id === "saved"} onClick={() => move(a, -1)}><ChevronLeft className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Avançar etapa" disabled={col.id === "closed"} onClick={() => move(a, 1)}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                        <div className="flex">
                          {a.job_id && <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" asChild><Link to="/jobs/$jobId" params={{ jobId: a.job_id }}>Vaga</Link></Button>}
                          <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Editar" onClick={() => setEditing(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
      {editing && <EditDialog app={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EditDialog({ app, onClose }: { app: Partial<App>; onClose: () => void }) {
  const [f, setF] = useState<Partial<App>>(app);
  const resumes = useQuery(resumesQuery);
  const qc = useQueryClient();
  async function save() {
    if (!f.title) return toast.error("Informe o cargo.");
    if (f.link && !/^https?:\/\//.test(f.link)) return toast.error("Link deve começar com http(s)://");
    const payload = {
      title: f.title, company: f.company || null, status: (f.status ?? "saved") as AppStatus, notes: f.notes || null,
      link: f.link || null, applied_at: f.applied_at || null, next_step_at: f.next_step_at || null, resume_id: f.resume_id || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = f.id ? await supabase.from("applications").update(payload).eq("id", f.id) : await supabase.from("applications").insert(payload);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["applications"] });
    toast.success("Candidatura salva.");
    onClose();
  }
  async function remove() {
    if (!f.id || !confirm("Excluir candidatura?")) return;
    await supabase.from("applications").delete().eq("id", f.id);
    qc.invalidateQueries({ queryKey: ["applications"] });
    onClose();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{f.id ? "Editar candidatura" : "Nova candidatura"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Cargo *</Label><Input value={f.title ?? ""} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
            <div className="space-y-1"><Label>Empresa</Label><Input value={f.company ?? ""} onChange={(e) => setF({ ...f, company: e.target.value })} /></div>
          </div>
          <div className="space-y-1"><Label>Etapa</Label>
            <Select value={f.status ?? "saved"} onValueChange={(v) => setF({ ...f, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Data da candidatura</Label><Input type="date" value={f.applied_at ?? ""} onChange={(e) => setF({ ...f, applied_at: e.target.value })} /></div>
            <div className="space-y-1"><Label>Próximo passo</Label><Input type="date" value={f.next_step_at ?? ""} onChange={(e) => setF({ ...f, next_step_at: e.target.value })} /></div>
          </div>
          <div className="space-y-1"><Label>Link</Label>
            <div className="flex gap-2"><Input value={f.link ?? ""} onChange={(e) => setF({ ...f, link: e.target.value })} />
              {f.link && <Button variant="outline" size="icon" asChild><a href={f.link} target="_blank" rel="noopener noreferrer" aria-label="Abrir link"><ExternalLink className="h-4 w-4" /></a></Button>}</div>
          </div>
          <div className="space-y-1"><Label>Currículo utilizado</Label>
            <Select value={f.resume_id ?? "none"} onValueChange={(v) => setF({ ...f, resume_id: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="none">Nenhum</SelectItem>{resumes.data?.map((r) => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Observações</Label><Textarea rows={4} value={f.notes ?? ""} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
          <div className="flex justify-between pt-2">
            {f.id ? <Button variant="ghost" onClick={remove}>Excluir</Button> : <span />}
            <Button onClick={save}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
