import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { Briefcase, FileText, KanbanSquare, LayoutDashboard, LogOut, Settings, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppShell,
});

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Vagas", icon: Briefcase },
  { to: "/applications", label: "Candidaturas", icon: KanbanSquare },
  { to: "/resumes", label: "Currículos", icon: FileText },
  { to: "/profile", label: "Perfil", icon: User },
  { to: "/settings", label: "Ajustes", icon: Settings },
] as const;

function AppShell() {
  const navigate = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-sidebar p-6 lg:flex print:hidden">
        <Logo to="/dashboard" />
        <nav className="mt-10 flex flex-1 flex-col gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-accent !text-sidebar-accent-foreground" }}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <button onClick={signOut} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-card/90 px-4 py-3 backdrop-blur lg:hidden print:hidden">
        <Logo to="/dashboard" />
        <button onClick={signOut} aria-label="Sair" className="rounded-lg p-2 text-muted-foreground"><LogOut className="h-5 w-5" /></button>
      </header>

      <main className="px-4 pb-28 pt-6 sm:px-8 lg:ml-64 lg:pb-12 lg:pt-10 print:m-0 print:p-0">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t bg-card lg:hidden print:hidden">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} className="flex flex-col items-center gap-1 py-2.5 text-[10px] text-muted-foreground" activeProps={{ className: "!text-primary" }}>
            <n.icon className="h-5 w-5" /> {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
