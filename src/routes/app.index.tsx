import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";
import { transactionsService } from "@/services/transactions";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function KpiCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: React.ElementType; tone: "primary" | "success" | "warning" | "muted" }) {
  const toneMap = {
    primary: "bg-accent text-accent-foreground",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={`size-9 rounded-xl grid place-items-center ${toneMap[tone]}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <p className="mt-3 font-display text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function Dashboard() {
  const { data: txs = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => transactionsService.list(),
  });

  const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const savingsRate = income ? (balance / income) * 100 : 0;

  const byCategory = Object.values(
    txs.filter((t) => t.type === "expense").reduce<Record<string, { name: string; value: number }>>((acc, t) => {
      acc[t.category] = { name: t.category, value: (acc[t.category]?.value ?? 0) + t.amount };
      return acc;
    }, {}),
  );

  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
  const flow = months.map((m, i) => ({
    mes: m,
    Entradas: 4800 + Math.round(Math.sin(i) * 600) + i * 200,
    Saídas: 3600 + Math.round(Math.cos(i) * 400) + i * 150,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">Olá! Veja como você está. 👋</h2>
        <p className="text-muted-foreground text-sm mt-1">Resumo do mês atual.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Entradas" value={brl(income)} icon={TrendingUp} tone="success" />
        <KpiCard label="Saídas" value={brl(expense)} icon={TrendingDown} tone="warning" />
        <KpiCard label="Saldo" value={brl(balance)} icon={Wallet} tone="primary" />
        <KpiCard label="Taxa de poupança" value={`${savingsRate.toFixed(0)}%`} icon={PiggyBank} tone="muted" />
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold">Fluxo de caixa</h3>
              <p className="text-xs text-muted-foreground">Entradas vs. Saídas — últimos 6 meses</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={flow}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }}
                  formatter={(v: number) => brl(v)}
                />
                <Legend />
                <Bar dataKey="Entradas" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Saídas" fill="var(--chart-4)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold">Despesas por categoria</h3>
          <p className="text-xs text-muted-foreground">Para onde foi seu dinheiro</p>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}>
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }}
                  formatter={(v: number) => brl(v)}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display font-semibold">Lançamentos recentes</h3>
        <div className="mt-4 divide-y divide-border">
          {txs.slice(0, 6).map((t) => (
            <div key={t.id} className="flex items-center py-3 gap-4">
              <div className={`size-9 rounded-xl grid place-items-center ${t.type === "income" ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}`}>
                {t.type === "income" ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{t.description}</p>
                <p className="text-xs text-muted-foreground">{t.category}</p>
              </div>
              <p className={`font-semibold ${t.type === "income" ? "text-success" : "text-foreground"}`}>
                {t.type === "income" ? "+" : "-"} {brl(t.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
