import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sprout } from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/services/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Criar conta — Agora Vai" }] }),
  component: Signup,
});

function Signup() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.signup(name, email, password);
      toast.success("Conta criada com sucesso!");
      nav({ to: "/app" });
    } catch {
      toast.error("Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex items-center justify-center p-6 order-2 md:order-1">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Criar conta</h1>
            <p className="text-sm text-muted-foreground mt-1">Leva menos de 1 minuto.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Como podemos te chamar?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pwd">Senha</Label>
            <Input id="pwd" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11 rounded-full">
            {loading ? "Criando..." : "Criar conta grátis"}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Já tem conta? <Link to="/login" className="text-primary font-medium hover:underline">Entrar</Link>
          </p>
        </form>
      </div>
      <div className="hidden md:block gradient-hero p-12 order-1 md:order-2">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-9 rounded-xl gradient-primary grid place-items-center text-primary-foreground">
            <Sprout className="size-5" />
          </div>
          <span className="font-display font-semibold">Agora Vai</span>
        </Link>
        <div className="mt-24 max-w-md">
          <h2 className="font-display text-4xl font-bold tracking-tight">
            Comece com o pé <span className="text-gradient">direito</span>.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Crie sua conta e descubra para onde vai o seu dinheiro hoje mesmo.
          </p>
        </div>
      </div>
    </div>
  );
}
