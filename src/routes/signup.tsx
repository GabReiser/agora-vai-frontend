import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sprout } from "lucide-react";
import { toast } from "sonner";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/config/firebase";
import { fetchWithAuth } from "@/lib/api";
import { useAuth, type BackendProfile } from "@/contexts/AuthContext";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Criar conta — Agora Vai" }] }),
  component: Signup,
});

function Signup() {
  const nav = useNavigate();
  const { loginState, suppressNextAutoSync } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchMyProfileWithRetry<T>(attempts = 2): Promise<T> {
    let lastError: unknown;

    for (let i = 0; i < attempts; i += 1) {
      try {
        return await fetchWithAuth<T>("/users/me");
      } catch (error) {
        lastError = error;
        const is500 = error instanceof Error && error.message.includes("500");
        const shouldRetry = is500 && i < attempts - 1;
        if (!shouldRetry) throw error;
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    throw lastError;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      suppressNextAutoSync();
      const credential = await createUserWithEmailAndPassword(auth, email, password);

      await fetchMyProfileWithRetry<unknown>();

      await fetchWithAuth<unknown>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });

      const profile = await fetchMyProfileWithRetry<BackendProfile>();
      console.log("Resposta do back-end (/users/me) após PATCH:", profile);

      loginState(credential.user, profile);

      toast.success("Conta criada com sucesso!");
      nav({ to: "/dashboard" });
    } catch (error: unknown) {
      console.error("Falha no fluxo de cadastro:", error);

      const errorCode =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: string }).code)
          : "";

      if (errorCode === "auth/email-already-in-use") {
        try {
          suppressNextAutoSync();
          const credential = await signInWithEmailAndPassword(auth, email, password);

          await fetchMyProfileWithRetry<unknown>();

          await fetchWithAuth<unknown>("/users/me", {
            method: "PATCH",
            body: JSON.stringify({ name }),
          });

          const profile = await fetchMyProfileWithRetry<BackendProfile>();
          console.log("Self-healing de cadastro concluído:", profile);

          loginState(credential.user, profile);

          toast.success("Conta recuperada com sucesso!");
          nav({ to: "/dashboard" });
        } catch (recoveryError) {
          console.error("Falha no self-healing de cadastro:", recoveryError);
          toast.error("Este e-mail já está em uso.");
        }
      } else {
        toast.error("Erro ao criar conta.");
      }
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
