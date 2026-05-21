import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES, transactionsService, type TxType } from "@/services/transactions";
import { brl, dateBR } from "@/lib/format";

export const Route = createFileRoute("/app/lancamentos")({ component: Lancamentos });

function Lancamentos() {
  const qc = useQueryClient();
  const { data: txs = [] } = useQuery({ queryKey: ["transactions"], queryFn: () => transactionsService.list() });

  const remove = useMutation({
    mutationFn: (id: string) => transactionsService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); toast.success("Lançamento removido."); },
  });

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TxType>("expense");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const create = useMutation({
    mutationFn: () => transactionsService.create({ type, description, category, amount: Number(amount), date }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(type === "income" ? "Entrada registrada!" : "Saída registrada!");
      setOpen(false); setDescription(""); setAmount(""); setCategory(CATEGORIES[0]);
    },
  });

  const filtered = (kind: "all" | TxType) => kind === "all" ? txs : txs.filter((t) => t.type === kind);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Seus lançamentos</h2>
          <p className="text-sm text-muted-foreground mt-1">Registre entradas e saídas em segundos.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full"><Plus className="size-4" /> Novo lançamento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo lançamento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={type === "expense" ? "default" : "outline"} onClick={() => setType("expense")} className="rounded-full">
                  <TrendingDown className="size-4" /> Saída
                </Button>
                <Button type="button" variant={type === "income" ? "default" : "outline"} onClick={() => setType("income")} className="rounded-full">
                  <TrendingUp className="size-4" /> Entrada
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Mercado da semana" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => create.mutate()} disabled={!description || !amount || create.isPending}>
                {create.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="income">Entradas</TabsTrigger>
          <TabsTrigger value="expense">Saídas</TabsTrigger>
        </TabsList>
        {(["all", "income", "expense"] as const).map((k) => (
          <TabsContent key={k} value={k} className="mt-4">
            <div className="rounded-2xl border border-border bg-card divide-y divide-border">
              {filtered(k).length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">Nada por aqui ainda.</div>
              ) : filtered(k).map((t) => (
                <div key={t.id} className="flex items-center gap-4 p-4">
                  <div className={`size-10 rounded-xl grid place-items-center ${t.type === "income" ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}`}>
                    {t.type === "income" ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{t.category} · {dateBR(t.date)}</p>
                  </div>
                  <p className={`font-semibold ${t.type === "income" ? "text-success" : ""}`}>
                    {t.type === "income" ? "+" : "-"} {brl(t.amount)}
                  </p>
                  <Button size="icon" variant="ghost" onClick={() => remove.mutate(t.id)}>
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
