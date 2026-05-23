import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sprout, Eye, EyeOff, Trophy, TrendingUp, Sparkles, Mail } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
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
      loginState(credential.user, profile);
      toast.success("Conta criada com sucesso!");
      nav({ to: "/dashboard" });
    } catch (error: unknown) {
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
          loginState(credential.user, profile);
          toast.success("Conta recuperada com sucesso!");
          nav({ to: "/dashboard" });
        } catch {
          toast.error("Este e-mail já está em uso.");
        }
      } else {
        toast.error("Erro ao criar conta.");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "h-11 bg-background/60 border-border/60 transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      {/* FORM — Left */}
      <div className="flex items-center justify-center p-6 order-2 md:order-1">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Criar conta</h1>
            <p className="text-sm text-muted-foreground mt-1">Leva menos de 1 minuto.</p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-xs text-muted-foreground">
            <Mail className="size-4 text-primary" />
            <span>Cadastro com e-mail e senha. Para login social, use a tela de <Link to="/login" className="text-primary hover:underline">entrar</Link>.</span>
          </div>


          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Como podemos te chamar?" className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com" className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pwd">Senha</Label>
            <div className="relative">
              <Input id="pwd" type={showPassword ? "text" : "password"} required minLength={6}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" className={`${inputClass} pr-10`} />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-11 rounded-full">
            {loading ? "Criando..." : "Criar conta grátis"}
          </Button>

          <p className="text-xs text-center text-muted-foreground leading-relaxed">
            Ao criar sua conta, você concorda com nossos{" "}
            <a href="#" className="underline hover:text-foreground">Termos de Uso</a> e{" "}
            <a href="#" className="underline hover:text-foreground">Política de Privacidade</a>.
          </p>

          <p className="text-sm text-center text-muted-foreground">
            Já tem conta? <Link to="/login" className="text-primary font-medium hover:underline">Entrar</Link>
          </p>
        </form>
      </div>

      {/* HERO — Right */}
      <div className="relative hidden md:flex flex-col justify-between overflow-hidden p-12 order-1 md:order-2
        bg-[radial-gradient(circle_at_20%_10%,oklch(0.35_0.12_180/0.5),transparent_55%),radial-gradient(circle_at_80%_90%,oklch(0.55_0.18_155/0.45),transparent_55%),linear-gradient(135deg,oklch(0.18_0.04_200),oklch(0.22_0.06_165))]">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 size-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 size-96 rounded-full bg-cyan-500/10 blur-3xl" />

        <Link to="/" className="relative z-10 flex items-center gap-2">
          <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-emerald-400 grid place-items-center text-primary-foreground shadow-lg shadow-primary/30">
            <Sprout className="size-5" />
          </div>
          <span className="font-display font-semibold text-foreground">Agora Vai</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-4xl font-bold tracking-tight text-foreground">
            Comece com o pé{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">direito</span>.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Crie sua conta e transforme sua vida financeira em uma jornada gamificada.
          </p>
        </div>

        {/* Floating glass cards */}
        <div className="relative z-10 space-y-4">
          <div className="ml-auto w-64 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-2xl shadow-black/30 animate-in fade-in slide-in-from-right-6 duration-700">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/20 grid place-items-center">
                <Sparkles className="size-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">XP ganho</p>
                <p className="font-display font-semibold text-foreground">+250 XP</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-3/4 bg-gradient-to-r from-primary to-emerald-300" />
            </div>
          </div>

          <div className="w-72 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-2xl shadow-black/30 animate-in fade-in slide-in-from-left-6 duration-700 delay-150">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-400/20 grid place-items-center">
                <Trophy className="size-5 text-amber-300" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Nível desbloqueado</p>
                <p className="font-display font-semibold text-foreground">Nível 4 · Prata</p>
              </div>
            </div>
          </div>

          <div className="ml-12 w-64 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-2xl shadow-black/30 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Economia do mês</p>
              <TrendingUp className="size-4 text-emerald-300" />
            </div>
            <div className="flex items-end gap-1 h-12">
              {[40, 55, 35, 70, 50, 85, 95].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-primary/40 to-emerald-300/80" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
