import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Legend,
} from "recharts";
import { Users, TrendingUp, Activity, DollarSign, Sprout, ShieldCheck } from "lucide-react";
import { adminService } from "@/services/admin";
import { brl, compact } from "@/lib/format";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · Agora Vai" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

function Kpi({ label, value, icon: Icon, accent }: { label: string; value: string; icon: React.ElementType; accent: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={`size-9 rounded-xl grid place-items-center ${accent}`}><Icon className="size-4" /></div>
      </div>
      <p className="mt-3 font-display text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function Admin() {
  const { data } = useQuery({ queryKey: ["admin-metrics"], queryFn: () => adminService.metrics() });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-3">
          <div className="size-9 rounded-xl gradient-primary grid place-items-center text-primary-foreground">
            <Sprout className="size-5" />
          </div>
          <div>
            <p className="font-display font-semibold leading-none">Agora Vai</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><ShieldCheck className="size-3" /> Painel administrativo</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/app" className="text-sm text-muted-foreground hover:text-foreground">Voltar ao app</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Métricas do SaaS</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral em tempo real (mock).</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi label="Usuários cadastrados" value={data ? compact(data.totalUsers) : "—"} icon={Users} accent="bg-accent text-accent-foreground" />
          <Kpi label="Usuários Pro" value={data ? compact(data.proUsers) : "—"} icon={TrendingUp} accent="bg-success/15 text-success" />
          <Kpi label="Conversão para Pro" value={data ? `${data.conversionRate}%` : "—"} icon={TrendingUp} accent="bg-warning/20 text-warning-foreground" />
          <Kpi label="Requisições 24h" value={data ? compact(data.requests24h) : "—"} icon={Activity} accent="bg-muted text-muted-foreground" />
        </div>

        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold">Crescimento de usuários</h3>
            <p className="text-xs text-muted-foreground">Últimos 14 dias</p>
            <div className="h-72 mt-4">
              <ResponsiveContainer>
                <AreaChart data={data?.series ?? []}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                  <Area type="monotone" dataKey="users" stroke="var(--chart-1)" strokeWidth={2} fill="url(#g)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold flex items-center gap-2">MRR <DollarSign className="size-4 text-muted-foreground" /></h3>
            <p className="text-xs text-muted-foreground">Receita recorrente mensal</p>
            <p className="font-display text-4xl font-bold mt-4">{data ? brl(data.mrr) : "—"}</p>
            <p className="text-xs text-success mt-1">+8,4% vs mês anterior</p>
            <div className="mt-6 space-y-3">
              {[
                { l: "Plano Free", v: "10.648 usuários", pct: 85 },
                { l: "Plano Pro", v: "1.832 usuários", pct: 15 },
              ].map((r) => (
                <div key={r.l}>
                  <div className="flex justify-between text-sm"><span>{r.l}</span><span className="text-muted-foreground">{r.v}</span></div>
                  <div className="h-2 mt-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full gradient-primary" style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold">Requisições no sistema</h3>
          <p className="text-xs text-muted-foreground">Volume diário (API)</p>
          <div className="h-72 mt-4">
            <ResponsiveContainer>
              <BarChart data={data?.series ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Legend />
                <Bar dataKey="requests" name="Requisições" fill="var(--chart-2)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
