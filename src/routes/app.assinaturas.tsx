import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Repeat, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { subscriptionsService } from "@/services/subscriptions";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/app/assinaturas")({ component: Assinaturas });

function Assinaturas() {
  const qc = useQueryClient();
  const { data: subs = [] } = useQuery({ queryKey: ["subscriptions"], queryFn: () => subscriptionsService.list() });
  const total = subs.filter((s) => s.active).reduce((sum, s) => sum + s.amount, 0);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Streaming");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("10");

  const create = useMutation({
    mutationFn: () => subscriptionsService.create({ name, category, amount: Number(amount), billingDay: Number(day), active: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success("Assinatura adicionada!");
      setOpen(false); setName(""); setAmount("");
    },
  });
  const toggle = useMutation({
    mutationFn: (id: string) => subscriptionsService.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions"] }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => subscriptionsService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subscriptions"] }); toast.success("Removida."); },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Assinaturas</h2>
          <p className="text-sm text-muted-foreground mt-1">Veja o que pesa todo mês e mantenha só o que faz sentido.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="rounded-full"><Plus className="size-4" /> Nova assinatura</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova assinatura</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Netflix" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Valor mensal</Label><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
                <div className="space-y-2"><Label>Dia da cobrança</Label><Input type="number" min={1} max={31} value={day} onChange={(e) => setDay(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Categoria</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} /></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => create.mutate()} disabled={!name || !amount}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl border border-border gradient-hero p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Você gasta por mês</p>
          <p className="font-display text-4xl font-bold mt-1">{brl(total)}</p>
          <p className="text-xs text-muted-foreground mt-1">{subs.filter((s) => s.active).length} assinaturas ativas</p>
        </div>
        <div className="size-14 rounded-2xl gradient-primary grid place-items-center text-primary-foreground">
          <Repeat className="size-6" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subs.map((s) => (
          <div key={s.id} className={`rounded-2xl border border-border bg-card p-5 transition ${!s.active ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display font-semibold">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.category}</p>
              </div>
              <Switch checked={s.active} onCheckedChange={() => toggle.mutate(s.id)} />
            </div>
            <p className="mt-4 font-display text-2xl font-bold">{brl(s.amount)}</p>
            <p className="text-xs text-muted-foreground">Cobrança dia {s.billingDay}</p>
            <Button variant="ghost" size="sm" className="mt-3 text-muted-foreground" onClick={() => remove.mutate(s.id)}>
              <Trash2 className="size-3.5" /> Remover
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
