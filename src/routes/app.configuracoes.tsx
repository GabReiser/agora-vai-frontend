import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/services/auth";

export const Route = createFileRoute("/app/configuracoes")({ component: Configuracoes });

function Configuracoes() {
  const [, force] = useState(0);
  const user = authService.current();
  if (!user) return null;
  const isPro = user.plan === "pro";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">Configurações</h2>
        <p className="text-sm text-muted-foreground mt-1">Sua conta e seu plano.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-display font-semibold">Perfil</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Nome</Label><Input defaultValue={user.name} /></div>
          <div className="space-y-2"><Label>E-mail</Label><Input defaultValue={user.email} /></div>
        </div>
        <Button className="rounded-full" onClick={() => toast.success("Perfil atualizado.")}>Salvar alterações</Button>
      </section>

      <section className="rounded-3xl border border-border gradient-hero p-8">
        <div className="flex items-center gap-2">
          <Badge className="gradient-primary text-primary-foreground border-0">Plano atual: {isPro ? "Pro" : "Free"}</Badge>
        </div>
        <h3 className="mt-3 font-display text-2xl font-bold tracking-tight">
          {isPro ? "Você está no Pro 🎉" : "Pronto para evoluir?"}
        </h3>
        <p className="text-muted-foreground mt-2">
          {isPro
            ? "Aproveite IA Financeira, Open Finance e sugestões personalizadas."
            : "Desbloqueie IA Financeira, Open Finance e insights personalizados."}
        </p>
        <ul className="mt-5 grid sm:grid-cols-2 gap-2 text-sm">
          {["Open Finance", "Insights de IA", "Reserva inteligente", "Suporte prioritário"].map((f) => (
            <li key={f} className="flex items-center gap-2"><Check className="size-4 text-primary" /> {f}</li>
          ))}
        </ul>
        <div className="mt-6 flex gap-2">
          {!isPro ? (
            <Button
              className="rounded-full h-11"
              onClick={() => { authService.setPlan("pro"); toast.success("Bem-vindo ao Pro!"); force((x) => x + 1); }}
            >
              <Sparkles className="size-4" /> Ativar Pro (demo)
            </Button>
          ) : (
            <Button
              variant="outline" className="rounded-full h-11"
              onClick={() => { authService.setPlan("free"); toast("Voltou para o Free."); force((x) => x + 1); }}
            >
              Voltar para o Free
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
