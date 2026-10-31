import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Briefcase, ExternalLink, Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageHeader } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { searchJobs } from "@/lib/nexora.functions";
import { jobsQuery } from "@/lib/queries";
import { SOURCE_LABEL, type ExternalJob } from "@/lib/jobs";

export const Route = createFileRoute("/_authenticated/jobs/")({
  head: () => ({ meta: [{ title: "Vagas — Nexora" }, { name: "description", content: "Busque vagas reais." }] }),
  component: Jobs,
});

type Status = { source: string; ok: boolean; message?: string; count: number };

function Jobs() {
  const search = useServerFn(searchJobs);
  const saved = useQuery(jobsQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [f, setF] = useState({ query: "", location: "", source: "all", workMode: "", seniority: "", contract: "" });
  const [results, setResults] = useState<ExternalJob[] | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      const r = await search({ data: f as never });
      setResults(r.jobs);
      setStatuses(r.statuses);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function save(j: ExternalJob) {
    setSavingId(j.external_id);
    const existing = saved.data?.find((s) => s.source === j.source && s.external_id === j.external_id);
    if (existing) return navigate({ to: "/jobs/$jobId", params: { jobId: existing.id } });
    const { data, error } = await supabase.from("jobs").insert(j).select().single();
    setSavingId(null);
    if (error) return toast.error(error.message);
    await supabase.from("applications").insert({ job_id: data.id, title: data.title, company: data.company, link: data.url, status: "saved" });
    qc.invalidateQueries({ queryKey: ["jobs"] });
    qc.invalidateQueries({ queryKey: ["applications"] });
    toast.success("Vaga salva.");
    navigate({ to: "/jobs/$jobId", params: { jobId: data.id } });
  }

  const sel = (k: keyof typeof f, ph: string, opts: [string, string][]) => (
    <Select value={f[k] || "any"} onValueChange={(v) => setF({ ...f, [k]: v === "any" ? "" : v })}>
      <SelectTrigger><SelectValue placeholder={ph} /></SelectTrigger>
      <SelectContent><SelectItem value="any">{ph}</SelectItem>{opts.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
    </Select>
  );

  return (
    <div>
      <PageHeader title="Vagas" subtitle="Vagas reais de fontes externas. Sempre confira no link original." action={<ManualImport />} />
      <Tabs defaultValue="search">
        <TabsList><TabsTrigger value="search">Buscar</TabsTrigger><TabsTrigger value="saved">Salvas ({saved.data?.length ?? 0})</TabsTrigger></TabsList>
        <TabsContent value="search" className="mt-6">
          <form onSubmit={run} className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
            <Input className="lg:col-span-2" placeholder="Cargo ou palavra-chave" value={f.query} onChange={(e) => setF({ ...f, query: e.target.value })} />
            <Input placeholder="Localização (Brasil)" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
            {sel("source", "Todas as fontes", [["remotive", "Remotas (Remotive)"], ["adzuna", "Brasil (Adzuna)"]])}
            {sel("workMode", "Modalidade", [["remoto", "Remoto"], ["presencial", "Presencial/híbrido"]])}
            {sel("seniority", "Senioridade", [["junior", "Júnior"], ["pleno", "Pleno"], ["senior", "Sênior"]])}
            {sel("contract", "Contrato", [["full time", "Tempo integral"], ["part time", "Meio período"], ["contract", "Contrato/PJ"], ["permanent", "Efetivo"]])}
            <Button className="lg:col-span-5 sm:col-span-2" disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}Buscar vagas</Button>
          </form>

          {statuses.filter((s) => !s.ok).map((s) => (
            <div key={s.source} className="mt-4 flex gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
              <div><b>{SOURCE_LABEL[s.source]}:</b> {s.message} Você pode importar vagas manualmente.</div>
            </div>
          ))}

          <div className="mt-6 space-y-3">
            {results === null && !loading && <EmptyState icon={<Search className="h-5 w-5" />} title="Comece uma busca" text="Pesquise por cargo, área ou tecnologia." />}
            {results?.length === 0 && <EmptyState icon={<Briefcase className="h-5 w-5" />} title="Nenhuma vaga encontrada" text="Tente outros termos ou remova filtros." />}
            {results?.map((j) => (
              <article key={j.source + j.external_id} className="rounded-2xl border bg-card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold">{j.title}</h3>
                    <p className="text-sm text-muted-foreground">{j.company} · {j.location}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary">{SOURCE_LABEL[j.source]}</Badge>
                      {j.work_mode && <Badge variant="outline">{j.work_mode}</Badge>}
                      {j.contract_type && <Badge variant="outline">{j.contract_type.replace(/_/g, " ")}</Badge>}
                      {j.published_at && <Badge variant="outline">{new Date(j.published_at).toLocaleDateString("pt-BR")}</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild><a href={j.url} target="_blank" rel="noopener noreferrer">Original <ExternalLink className="ml-1 h-3 w-3" /></a></Button>
                    <Button size="sm" disabled={savingId === j.external_id} onClick={() => save(j)}>Salvar e analisar</Button>
                  </div>
                </div>
                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{j.description}</p>
              </article>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="saved" className="mt-6 space-y-3">
          {saved.data?.length === 0 && <EmptyState icon={<Briefcase className="h-5 w-5" />} title="Nenhuma vaga salva" text="Salve vagas da busca ou importe manualmente." />}
          {saved.data?.map((j) => (
            <Link key={j.id} to="/jobs/$jobId" params={{ jobId: j.id }} className="block rounded-2xl border bg-card p-5 hover:border-primary">
              <h3 className="font-semibold">{j.title}</h3>
              <p className="text-sm text-muted-foreground">{j.company} · {j.location} · {SOURCE_LABEL[j.source] ?? j.source}</p>
            </Link>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ManualImport() {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", company: "", location: "", url: "", description: "", requirements: "" });
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.url && !/^https?:\/\//.test(f.url)) return toast.error("Link deve começar com http(s)://");
    const { data, error } = await supabase.from("jobs").insert({ ...f, url: f.url || null, source: "manual", published_at: null }).select().single();
    if (error) return toast.error(error.message);
    await supabase.from("applications").insert({ job_id: data.id, title: data.title, company: data.company, link: data.url, status: "saved" });
    qc.invalidateQueries({ queryKey: ["jobs"] });
    qc.invalidateQueries({ queryKey: ["applications"] });
    setOpen(false);
    toast.success("Vaga importada.");
    navigate({ to: "/jobs/$jobId", params: { jobId: data.id } });
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline"><Plus className="mr-1 h-4 w-4" /> Importar vaga</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Importar vaga manualmente</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1"><Label>Cargo *</Label><Input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Empresa</Label><Input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></div>
            <div className="space-y-1"><Label>Local</Label><Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></div>
          </div>
          <div className="space-y-1"><Label>Link original</Label><Input type="url" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></div>
          <div className="space-y-1"><Label>Descrição *</Label><Textarea required rows={5} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div className="space-y-1"><Label>Requisitos</Label><Textarea rows={3} value={f.requirements} onChange={(e) => setF({ ...f, requirements: e.target.value })} /></div>
          <Button className="w-full">Importar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
