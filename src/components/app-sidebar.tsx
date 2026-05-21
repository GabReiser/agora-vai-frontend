import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ArrowLeftRight, Repeat, Sparkles, Settings, Sprout, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/lancamentos", label: "Lançamentos", icon: ArrowLeftRight },
  { to: "/app/assinaturas", label: "Assinaturas", icon: Repeat },
  { to: "/app/ranking", label: "Ranking & Missões", icon: Trophy },
  { to: "/app/insights", label: "Insights", icon: Sparkles, pro: true },
  { to: "/app/configuracoes", label: "Configurações", icon: Settings },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="px-6 py-5 flex items-center gap-2">
        <div className="size-9 rounded-xl gradient-primary grid place-items-center text-primary-foreground shadow-sm">
          <Sprout className="size-5" />
        </div>
        <div>
          <p className="font-display font-semibold leading-none">Agora Vai</p>
          <p className="text-xs text-muted-foreground mt-1">seu dinheiro, leve.</p>
        </div>
      </div>
      <nav className="px-3 py-2 space-y-1">
        {items.map((it) => {
          const active = it.exact ? path === it.to : path.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              <span className="flex-1">{it.label}</span>
              {it.pro && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md gradient-primary text-primary-foreground">
                  PRO
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Precisa de mais?</p>
          <p className="text-sm font-medium mt-1">Desbloqueie IA Financeira e Open Finance.</p>
          <Link to="/app/configuracoes" className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline">
            Conhecer o Pro →
          </Link>
        </div>
      </div>
    </aside>
  );
}
