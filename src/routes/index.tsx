import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sprout, ArrowRight, Check, Sparkles, PieChart, Repeat,
  ShieldCheck, Banknote, LineChart as LineChartIcon,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agora Vai — Gestão financeira simples e inteligente" },
      { name: "description", content: "Organize suas finanças com leveza. Dashboard, assinaturas, IA financeira e Open Finance." },
    ],
  }),
  component: Landing,
});

function Nav() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-background/70 border-b border-border/60">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-9 rounded-xl gradient-primary grid place-items-center text-primary-foreground">
            <Sprout className="size-5" />
          </div>
          <span className="font-display font-semibold">Agora Vai</span>
        </Link>
        <nav className="ml-10 hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground">Funcionalidades</a>
          <a href="#planos" className="hover:text-foreground">Planos</a>
          <a href="#ia" className="hover:text-foreground">IA Financeira</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost"><Link to="/login">Entrar</Link></Button>
          <Button asChild className="rounded-full"><Link to="/signup">Começar grátis</Link></Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="gradient-hero">
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32 text-center">
        <Badge variant="secondary" className="rounded-full bg-accent text-accent-foreground border-0 px-3 py-1">
          <Sparkles className="size-3 mr-1.5" /> Novo: IA Financeira com Open Finance
        </Badge>
        <h1 className="mt-6 font-display text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mx-auto">
          Seu dinheiro,{" "}
          <span className="text-gradient">leve</span> e organizado.
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          O Agora Vai é o jeito mais acolhedor de cuidar da sua vida financeira.
          Sem planilhas confusas. Sem termos complicados. Só clareza.
        </p>
        <div className="mt-9 flex items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-full h-12 px-7 text-base">
            <Link to="/signup">Criar conta grátis <ArrowRight className="size-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-7 text-base">
            <a href="#planos">Ver planos</a>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Sem cartão de crédito · Cancele quando quiser</p>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { k: "+12k", v: "usuários ativos" },
            { k: "98%", v: "satisfação" },
            { k: "4.9★", v: "nas lojas" },
            { k: "256-bit", v: "criptografia" },
          ].map((s) => (
            <div key={s.v} className="rounded-2xl border border-border bg-card p-4">
              <p className="font-display font-bold text-2xl text-gradient">{s.k}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.v}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const features = [
  { icon: PieChart, title: "Dashboard claro", desc: "Gráficos modernos que mostram para onde vai seu dinheiro, em segundos." },
  { icon: Repeat, title: "Assinaturas no controle", desc: "Visualize tudo o que pesa todo mês e cancele o que não usa." },
  { icon: Sparkles, title: "IA Financeira (Pro)", desc: "Sugestões personalizadas baseadas no seu comportamento real." },
  { icon: Banknote, title: "Open Finance (Pro)", desc: "Conecte suas contas com segurança e veja tudo em um lugar só." },
  { icon: LineChartIcon, title: "Categorização fácil", desc: "Lançamentos rápidos que se organizam sozinhos." },
  { icon: ShieldCheck, title: "Seguro por padrão", desc: "Seus dados criptografados, sempre sob seu controle." },
];

function Features() {
  return (
    <section id="features" className="max-w-6xl mx-auto px-6 py-24">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-primary">Tudo o que você precisa</p>
        <h2 className="mt-2 font-display text-4xl md:text-5xl font-bold tracking-tight">Finanças sem peso na agenda.</h2>
        <p className="mt-4 text-muted-foreground text-lg">
          Pensamos cada detalhe para que você entenda seu dinheiro em poucos toques.
        </p>
      </div>
      <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl border border-border bg-card p-6 hover:shadow-md transition-shadow">
            <div className="size-11 rounded-xl bg-accent text-accent-foreground grid place-items-center">
              <f.icon className="size-5" />
            </div>
            <h3 className="mt-5 font-display font-semibold text-lg">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Plans() {
  const free = ["Lançamentos ilimitados", "Dashboard com gráficos", "Categorias personalizadas", "Gestão manual de assinaturas"];
  const pro = ["Tudo do Free", "Open Finance (sincronize bancos)", "IA Financeira com insights", "Sugestões de economia", "Reserva de emergência inteligente", "Suporte prioritário"];
  return (
    <section id="planos" className="max-w-6xl mx-auto px-6 py-24">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-sm font-semibold text-primary">Planos</p>
        <h2 className="mt-2 font-display text-4xl md:text-5xl font-bold tracking-tight">Comece grátis. Cresça quando quiser.</h2>
      </div>
      <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="rounded-3xl border border-border bg-card p-8">
          <p className="text-sm font-medium text-muted-foreground">Free</p>
          <p className="mt-3 font-display text-5xl font-bold">R$ 0</p>
          <p className="text-sm text-muted-foreground mt-1">para sempre</p>
          <ul className="mt-8 space-y-3">
            {free.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm">
                <Check className="size-4 text-primary mt-0.5" /> {f}
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" className="w-full mt-8 rounded-full h-11">
            <Link to="/signup">Começar grátis</Link>
          </Button>
        </div>
        <div className="relative rounded-3xl gradient-primary text-primary-foreground p-8 shadow-xl">
          <Badge className="absolute -top-3 right-6 bg-warning text-warning-foreground border-0">Mais popular</Badge>
          <p className="text-sm font-medium opacity-90">Pro</p>
          <p className="mt-3 font-display text-5xl font-bold">R$ 19<span className="text-xl font-normal opacity-80">,90/mês</span></p>
          <p className="text-sm opacity-90 mt-1">7 dias grátis</p>
          <ul className="mt-8 space-y-3">
            {pro.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm">
                <Check className="size-4 mt-0.5" /> {f}
              </li>
            ))}
          </ul>
          <Button asChild variant="secondary" className="w-full mt-8 rounded-full h-11 bg-background text-foreground hover:bg-background/90">
            <Link to="/signup">Experimentar Pro</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function IASection() {
  return (
    <section id="ia" className="max-w-6xl mx-auto px-6 py-24">
      <div className="rounded-3xl gradient-hero border border-border p-10 md:p-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <Badge variant="secondary" className="rounded-full">Plano Pro</Badge>
          <h2 className="mt-4 font-display text-4xl md:text-5xl font-bold tracking-tight">
            Uma IA que entende seu jeito de gastar.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Receba sugestões personalizadas, alertas de gastos incomuns e recomendações
            de reserva — tudo em linguagem simples.
          </p>
          <Button asChild className="mt-6 rounded-full h-11"><Link to="/signup">Quero experimentar</Link></Button>
        </div>
        <div className="space-y-3">
          {[
            { t: "Notamos um aumento de 15% nos gastos com delivery", b: "warning" },
            { t: "Você tem 2 assinaturas de streaming pouco utilizadas", b: "muted" },
            { t: "Sugestão de reserva: R$ 3.900 baseado nas suas entradas", b: "primary" },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5" /> Insight inteligente
              </div>
              <p className="mt-2 text-sm font-medium">{c.t}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center gap-4 justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg gradient-primary grid place-items-center text-primary-foreground">
            <Sprout className="size-4" />
          </div>
          <span className="font-display font-semibold text-foreground">Agora Vai</span>
          <span className="opacity-60">· agoravaiapp.com</span>
        </div>
        <p>© {new Date().getFullYear()} Agora Vai. Feito com carinho no Brasil.</p>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main>
        <Hero />
        <Features />
        <IASection />
        <Plans />
      </main>
      <Footer />
    </div>
  );
}
