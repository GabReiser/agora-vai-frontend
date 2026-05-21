import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, X, MessageSquare, Check, Bot, User as UserIcon, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { nlpService, type NlpParseResult } from "@/services/nlp";
import { transactionsService } from "@/services/transactions";
import { useGamification } from "./gamification-provider";
import { brl, dateBR } from "@/lib/format";
import { cn } from "@/lib/utils";

type Msg =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "bot"; text: string; parsed?: NlpParseResult; confirmed?: boolean };

const SUGGESTIONS = [
  "gastei 45 reais na farmácia hoje",
  "recebi 150 reais de um freela",
  "almoço 32,90",
  "uber 18 ontem",
];

export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Oi! Me conta o que rolou no seu bolso hoje 👀 — algo como “gastei 45 reais na farmácia”.",
    },
  ]);
  const qc = useQueryClient();
  const { triggerXpGain } = useGamification();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const parseMut = useMutation({
    mutationFn: (text: string) => nlpService.parse(text),
    onSuccess: (parsed) => {
      setMessages((m) => [
        ...m,
        {
          id: `b${Date.now()}`,
          role: "bot",
          text: parsed.ok
            ? "Identifiquei isso aqui — revise e confirme:"
            : parsed.reason ?? "Não entendi 😅 tenta de novo?",
          parsed: parsed.ok ? parsed : undefined,
        },
      ]);
    },
  });

  const confirmMut = useMutation({
    mutationFn: (p: NlpParseResult) =>
      transactionsService.create({
        type: p.type!,
        amount: p.amount!,
        category: p.category!,
        description: p.description!,
        date: p.date!,
      }),
    onSuccess: (_t, p) => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      setMessages((m) =>
        m.map((msg) => (msg.role === "bot" && msg.parsed === p ? { ...msg, confirmed: true } : msg)),
      );
      toast.success("Lançamento criado pelo assistente!");
      triggerXpGain(10, { x: window.innerWidth - 80, y: window.innerHeight - 80 });
    },
  });

  const send = (textArg?: string) => {
    const text = (textArg ?? input).trim();
    if (!text) return;
    setMessages((m) => [...m, { id: `u${Date.now()}`, role: "user", text }]);
    setInput("");
    parseMut.mutate(text);
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-6 right-6 z-40 size-14 rounded-full shadow-xl grid place-items-center text-primary-foreground transition-transform hover:scale-105",
          "gradient-primary",
        )}
        aria-label="Assistente"
      >
        {open ? <X className="size-6" /> : <MessageSquare className="size-6" />}
      </button>

      <div
        className={cn(
          "fixed bottom-24 right-6 z-40 w-[min(380px,calc(100vw-2rem))] origin-bottom-right transition-all",
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0",
        )}
      >
        <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col h-[540px]">
          <div className="p-4 gradient-primary text-primary-foreground flex items-center gap-3">
            <div className="size-9 rounded-full bg-white/20 grid place-items-center">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="font-display font-semibold leading-tight">Assistente Agora Vai</p>
              <p className="text-xs opacity-90">Lance gastos em linguagem natural</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/50">
            {messages.map((m) => (
              <div key={m.id} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "bot" && (
                  <div className="size-7 rounded-full bg-accent text-accent-foreground grid place-items-center shrink-0">
                    <Bot className="size-4" />
                  </div>
                )}
                <div className={cn("max-w-[85%] space-y-2", m.role === "user" && "items-end")}>
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 text-sm",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm",
                    )}
                  >
                    {m.text}
                  </div>
                  {m.role === "bot" && m.parsed && (
                    <ParsedCard
                      parsed={m.parsed}
                      confirmed={m.confirmed}
                      onConfirm={() => confirmMut.mutate(m.parsed!)}
                      loading={confirmMut.isPending}
                    />
                  )}
                </div>
                {m.role === "user" && (
                  <div className="size-7 rounded-full bg-primary/15 text-primary grid place-items-center shrink-0">
                    <UserIcon className="size-4" />
                  </div>
                )}
              </div>
            ))}
            {parseMut.isPending && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pl-9">
                <span className="size-1.5 rounded-full bg-muted-foreground animate-pulse" />
                <span className="size-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:120ms]" />
                <span className="size-1.5 rounded-full bg-muted-foreground animate-pulse [animation-delay:240ms]" />
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] px-2 py-1 rounded-full bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition"
                >
                  {s}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite seu lançamento…"
                className="rounded-full"
              />
              <Button type="submit" size="icon" className="rounded-full shrink-0">
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

function ParsedCard({
  parsed,
  confirmed,
  loading,
  onConfirm,
}: {
  parsed: NlpParseResult;
  confirmed?: boolean;
  loading: boolean;
  onConfirm: () => void;
}) {
  const isIncome = parsed.type === "income";
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-3 space-y-2 transition",
        confirmed && "border-success/40 bg-success/5",
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
            isIncome ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive",
          )}
        >
          {isIncome ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {isIncome ? "Entrada" : "Saída"}
        </div>
        <span className="text-xs text-muted-foreground">{dateBR(parsed.date!)}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <p className="font-medium truncate">{parsed.description}</p>
        <p className={cn("font-display font-bold", isIncome && "text-success")}>
          {isIncome ? "+" : "-"} {brl(parsed.amount!)}
        </p>
      </div>
      <p className="text-xs text-muted-foreground">Categoria sugerida: {parsed.category}</p>
      <Button
        size="sm"
        disabled={confirmed || loading}
        onClick={onConfirm}
        className="w-full rounded-full"
        variant={confirmed ? "secondary" : "default"}
      >
        {confirmed ? (
          <>
            <Check className="size-4" /> Lançado
          </>
        ) : (
          "Confirmar lançamento"
        )}
      </Button>
    </div>
  );
}
