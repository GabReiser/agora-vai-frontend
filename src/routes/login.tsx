import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sprout } from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/services/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Agora Vai" }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await authService.login(email, password);
      toast.success(`Bem-vinda(o) de volta, ${user.name}!`);
      nav({ to: user.isAdmin ? "/admin" : "/app" });
    } catch {
      toast.error("Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:block gradient-hero p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-9 rounded-xl gradient-primary grid place-items-center text-primary-foreground">
            <Sprout className="size-5" />
          </div>
          <span className="font-display font-semibold">Agora Vai</span>
        </Link>
        <div className="mt-24 max-w-md">
          <h2 className="font-display text-4xl font-bold tracking-tight">
            Que bom te ver de <span className="text-gradient">novo</span>.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Continue construindo uma relação leve com seu dinheiro.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Entrar</h1>
            <p className="text-sm text-muted-foreground mt-1">Acesse sua conta para continuar.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pwd">Senha</Label>
            <Input id="pwd" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11 rounded-full">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Ainda não tem conta? <Link to="/signup" className="text-primary font-medium hover:underline">Cadastre-se</Link>
          </p>
          <p className="text-xs text-center text-muted-foreground">Dica: use <code>admin@agoravai.app</code> para ver o painel admin.</p>
        </form>
      </div>
    </div>
  );
}
