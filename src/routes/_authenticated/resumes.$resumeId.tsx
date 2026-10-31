import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Download, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { resumeQuery } from "@/lib/queries";
import { parseResume } from "@/lib/resume-format";

export const Route = createFileRoute("/_authenticated/resumes/$resumeId")({
  head: () => ({ meta: [{ title: "Editor de currículo — Nexora" }, { name: "description", content: "Revise e exporte seu currículo." }] }),
  component: Editor,
});

function Editor() {
  const { resumeId } = Route.useParams();
  const { data, isLoading } = useQuery(resumeQuery(resumeId));
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) { setTitle(data.title); setContent(data.content); } }, [data]);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("resumes").update({ title, content, updated_at: new Date().toISOString() }).eq("id", resumeId);
    setSaving(false);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["resumes"] });
    toast.success("Currículo salvo.");
  }
  async function remove() {
    if (!confirm("Excluir este currículo?")) return;
    await supabase.from("resumes").delete().eq("id", resumeId);
    qc.invalidateQueries({ queryKey: ["resumes"] });
    navigate({ to: "/resumes" });
  }
  function exportPdf() {
    const prev = document.title;
    document.title = title.replace(/[^\w\s-]/g, "") || "curriculo";
    window.print();
    document.title = prev;
  }

  if (isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (!data) return <p>Currículo não encontrado.</p>;
  const blocks = parseResume(content);

  return (
    <div>
      <div className="print:hidden">
        <Link to="/resumes" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Currículos</Link>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <Input className="text-lg font-semibold" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}><Save className="mr-1 h-4 w-4" />{saving ? "Salvando…" : "Salvar"}</Button>
            <Button variant="outline" onClick={exportPdf}><Download className="mr-1 h-4 w-4" />Exportar PDF</Button>
            <Button variant="ghost" size="icon" aria-label="Excluir" onClick={remove}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
        <p className="mb-4 rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">Revise tudo: confirme que cada informação é verdadeira. No diálogo de impressão escolha “Salvar como PDF”.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Textarea className="min-h-[70vh] font-mono text-sm print:hidden" value={content} onChange={(e) => setContent(e.target.value)} />
        <div className="rounded-2xl border bg-card p-8 text-card-foreground print:rounded-none print:border-0 print:p-0" id="resume-print">
          {blocks.map((b, i) => {
            if (b.type === "h1") return <h1 key={i} className="text-2xl font-bold">{b.text}</h1>;
            if (b.type === "h2") return <h2 key={i} className="mt-5 border-b pb-1 text-sm font-bold uppercase tracking-wide">{b.text}</h2>;
            if (b.type === "h3") return <h3 key={i} className="mt-3 text-sm font-semibold">{b.text}</h3>;
            if (b.type === "li") return <ul key={i} className="ml-5 list-disc text-sm"><li>{b.text}</li></ul>;
            return <p key={i} className="mt-1 text-sm">{b.text}</p>;
          })}
        </div>
      </div>
    </div>
  );
}
