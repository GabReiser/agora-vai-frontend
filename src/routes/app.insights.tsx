import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, AlertTriangle, TrendingUp, Info, Banknote, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { insightsService, type InsightTone } from "@/services/insights";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/app/insights")({ component: Insights });

const toneStyles: Record<InsightTone, { bg: string; icon: React.ElementType }> = {
  warning: { bg: "bg-warning/15 text-warning-foreground", icon: AlertTriangle },
  success: { bg: "bg-success/15 text-success", icon: TrendingUp },
  info: { bg: "bg-accent text-accent-foreground", icon: Info },
};

const banks = [
  { name: "Nubank", color: "#8A05BE" },
  { name: "Itaú", color: "#EC7000" },
  { name: "Bradesco", color: "#CC092F" },
  { name: "Banco do Brasil", color: "#FFEF38" },
  { name: "Santander", color: "#EC0000" },
  { name: "Inter", color: "#FF7A00" },
];

function Insights() {
  const { profile, setProfile } = useAuth();
  const isPro = profile?.planType === "PRO";
  const [, force] = useState(0);
  const { data: insights = [] } = useQuery({
    queryKey: ["insights"], queryFn: () => insightsService.list(), enabled: isPro,
  });

  if (!isPro) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <div className="rounded-3xl gradient-hero border border-border p-10 text-center">
          <div className="size-14 rounded-2xl gradient-primary text-primary-foreground grid place-items-center mx-auto">
            <Lock className="size-6" />
          </div>
          <h2 className="mt-5 font-display text-3xl font-bold tracking-tight">
            Desbloqueie a <span className="text-gradient">IA Financeira</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Receba sugestões personalizadas baseadas no seu comportamento, conecte seus bancos via Open Finance e organize tudo em um só lugar.
          </p>
          <Button asChild className="mt-6 rounded-full h-11">
            <Link to="/app/configuracoes">Conhecer o Plano Pro</Link>
          </Button>
          <button
            onClick={() => {
              if (!profile) return;
              setProfile({ ...profile, planType: "PRO" });
              toast.success("Modo demo: Pro ativado!");
              force((x) => x + 1);
            }}
            className="block text-xs text-muted-foreground mt-4 mx-auto hover:underline"
          >
            (demo) ativar Pro agora
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" /> IA Financeira · Pro
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">Insights para você</h2>
          <p className="text-sm text-muted-foreground mt-1">Análises baseadas no seu padrão de gastos.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="rounded-full"><Banknote className="size-4" /> Sincronizar banco</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Open Finance · conectar conta</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Seus dados são criptografados. Você pode desconectar a qualquer momento.</p>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {banks.map((b) => (
                <button
                  key={b.name}
                  onClick={() => toast.success(`Solicitação enviada para ${b.name}.`)}
                  className="rounded-xl border border-border bg-card hover:bg-accent transition p-4 flex items-center gap-3"
                >
                  <span className="size-9 rounded-lg grid place-items-center text-white font-bold" style={{ background: b.color }}>
                    {b.name[0]}
                  </span>
                  <span className="text-sm font-medium">{b.name}</span>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {insights.map((ins) => {
          const s = toneStyles[ins.tone];
          const Icon = s.icon;
          return (
            <div key={ins.id} className="rounded-2xl border border-border bg-card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`size-11 rounded-xl grid place-items-center ${s.bg}`}>
                  <Icon className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display font-semibold">{ins.title}</h3>
                    {ins.metric && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">{ins.metric}</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{ins.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
