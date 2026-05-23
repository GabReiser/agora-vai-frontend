import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sprout } from "lucide-react";
import { toast } from "sonner";
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  type UserCredential,
} from "firebase/auth";
import { auth } from "@/config/firebase";
import { fetchWithAuth } from "@/lib/api";
import { useAuth, type BackendProfile } from "@/contexts/AuthContext";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Agora Vai" }] }),
  component: Login,
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.3 12 2.3 6.8 2.3 2.6 6.5 2.6 11.8S6.8 21.3 12 21.3c6.9 0 9.5-4.8 9.5-7.4 0-.5-.1-.9-.1-1.3H12Z"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#F25022" d="M3 3h8.5v8.5H3z"/>
      <path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5z"/>
      <path fill="#00A4EF" d="M3 12.5h8.5V21H3z"/>
      <path fill="#FFB900" d="M12.5 12.5H21V21h-8.5z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
      <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.9-.8-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.5.8 1.1 1.7 2.4 3 2.4 1.2-.1 1.6-.8 3.1-.8 1.4 0 1.9.8 3.1.8 1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.7-1-2.7-4.1ZM14.3 5.9c.7-.8 1.1-1.9 1-3-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.6 2.9-1.4Z"/>
    </svg>
  );
}

function Login() {
  const nav = useNavigate();
  const { loginState, suppressNextAutoSync } = useAuth();
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

  async function finalizeSocialLogin(credential: UserCredential) {
    await fetchMyProfileWithRetry<unknown>();

    if (credential.user.displayName?.trim()) {
      await fetchWithAuth<unknown>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ name: credential.user.displayName }),
      });
    }

    const profile = await fetchMyProfileWithRetry<BackendProfile>();
    loginState(credential.user, profile);
    nav({ to: "/dashboard" });
  }

  async function handleProviderLogin(provider: GoogleAuthProvider | OAuthProvider, providerName: string) {
    setLoading(true);
    try {
      suppressNextAutoSync();
      const credential = await signInWithPopup(auth, provider);
      await finalizeSocialLogin(credential);
      toast.success(`Login com ${providerName} realizado com sucesso!`);
    } catch (error) {
      const errorCode =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: string }).code)
          : "";

      if (errorCode === "auth/popup-closed-by-user") {
        toast.error("Login cancelado.");
      } else if (errorCode === "auth/popup-blocked") {
        toast.error("Seu navegador bloqueou o popup. Permita popups e tente novamente.");
      } else {
        toast.error(`Erro ao entrar com ${providerName}.`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await handleProviderLogin(provider, "Google");
  }

  async function handleMicrosoftLogin() {
    const provider = new OAuthProvider("microsoft.com");
    provider.setCustomParameters({ prompt: "select_account" });
    await handleProviderLogin(provider, "Microsoft");
  }

  async function handleAppleLogin() {
    const provider = new OAuthProvider("apple.com");
    provider.addScope("email");
    provider.addScope("name");
    await handleProviderLogin(provider, "Apple");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      suppressNextAutoSync();
      const credential = await signInWithEmailAndPassword(auth, email, password);

      const profile = await fetchMyProfileWithRetry<BackendProfile>();

      console.log("Resposta do back-end (/users/me):", profile);

      loginState(credential.user, profile);

      toast.success(`Bem-vinda(o) de volta${profile?.name ? `, ${profile.name}` : ""}!`);
      nav({ to: "/dashboard" });
    } catch (error) {
      console.error("Falha no fluxo de login:", error);
      const message = error instanceof Error ? error.message : "Erro ao entrar.";
      toast.error(message);
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

          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="h-11 bg-card/40 border-border/60 hover:bg-card/80 hover:border-primary/40"
            >
              <GoogleIcon />
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={handleMicrosoftLogin}
              className="h-11 bg-card/40 border-border/60 hover:bg-card/80 hover:border-primary/40"
            >
              <MicrosoftIcon />
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={handleAppleLogin}
              className="h-11 bg-card/40 border-border/60 hover:bg-card/80 hover:border-primary/40"
            >
              <AppleIcon />
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/60" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou continue com</span>
            </div>
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
        </form>
      </div>
    </div>
  );
}
