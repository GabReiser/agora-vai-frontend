import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus, Trash2, TrendingDown, TrendingUp, Upload, FileText, Sparkles,
  Coffee, Bus, UtensilsCrossed, Bike, Zap, Table as TableIcon, Loader2, Check, ListPlus,
} from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES, transactionsService, type TxType } from "@/services/transactions";
import { statementImportService, type ParsedStatementRow } from "@/services/statement-import";
import { quickActionsService, type QuickAction } from "@/services/quick-actions";
import { brl, dateBR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useGamification } from "@/components/gamification-provider";

export const Route = createFileRoute("/app/lancamentos")({ component: Lancamentos });

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Coffee, Bus, UtensilsCrossed, Bike, Zap,
};

function Lancamentos() {
  const qc = useQueryClient();
  const { triggerXpGain } = useGamification();
  const { data: txs = [] } = useQuery({ queryKey: ["transactions"], queryFn: () => transactionsService.list() });
  const { data: quickActions = [] } = useQuery({
    queryKey: ["quick-actions"],
    queryFn: () => quickActionsService.list(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => transactionsService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); toast.success("Lançamento removido."); },
  });

  const quickFire = useMutation({
    mutationFn: (qa: QuickAction) =>
      transactionsService.create({
        type: "expense",
        description: qa.description,
        category: qa.category,
        amount: qa.amount,
        date: new Date().toISOString().slice(0, 10),
      }),
    onSuccess: (_t, qa) => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(`+ ${brl(qa.amount)} em ${qa.category}`);
      triggerXpGain(5, { x: window.innerWidth / 2, y: 120 });
    },
  });

  const filtered = (kind: "all" | TxType) => kind === "all" ? txs : txs.filter((t) => t.type === kind);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Seus lançamentos</h2>
          <p className="text-sm text-muted-foreground mt-1">Registre entradas e saídas em segundos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BulkEntryDialog onDone={() => triggerXpGain(15, { x: window.innerWidth / 2, y: 200 })} />
          <SingleEntryDialog />
        </div>
      </div>

      {/* Quick actions */}
      <QuickActionsBar
        actions={quickActions}
        loading={quickFire.isPending}
        onFire={(qa) => quickFire.mutate(qa)}
      />

      {/* Import */}
      <StatementImportCard onImported={(n) => triggerXpGain(Math.min(50, n * 4), { x: window.innerWidth / 2, y: 320 })} />

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

/* ------------------------------ Quick Actions ----------------------------- */

function QuickActionsBar({
  actions, loading, onFire,
}: { actions: QuickAction[]; loading: boolean; onFire: (qa: QuickAction) => void }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="size-4 text-primary" />
        <h3 className="font-display font-semibold text-sm">Atalhos rápidos</h3>
        <span className="text-xs text-muted-foreground">um clique = lançamento na hora</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((qa) => {
          const Icon = ICONS[qa.icon] ?? Zap;
          return (
            <button
              key={qa.id}
              disabled={loading}
              onClick={() => onFire(qa)}
              className={cn(
                "group flex items-center gap-2 px-3 py-2 rounded-full border border-border bg-background",
                "hover:border-primary hover:bg-primary/5 hover:shadow-sm transition disabled:opacity-50",
              )}
            >
              <span className="size-7 rounded-full bg-primary/10 text-primary grid place-items-center group-hover:bg-primary group-hover:text-primary-foreground transition">
                <Icon className="size-4" />
              </span>
              <span className="text-sm font-medium">{qa.label}</span>
              <span className="text-xs text-muted-foreground">+ {brl(qa.amount)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------- Statement Import --------------------------- */

function StatementImportCard({ onImported }: { onImported: (count: number) => void }) {
  const qc = useQueryClient();
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedStatementRow[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const parseMut = useMutation({
    mutationFn: (file: File) => statementImportService.parse(file),
    onSuccess: (res) => {
      setRows(res.rows);
      toast.success(`Encontrei ${res.rows.length} transações no extrato.`);
    },
    onError: () => toast.error("Não consegui ler esse arquivo. Tente OFX, CSV ou PDF."),
  });

  const confirmMut = useMutation({
    mutationFn: (list: ParsedStatementRow[]) =>
      transactionsService.createMany(
        list.map((r) => ({
          type: r.type, description: r.description, category: r.category, amount: r.amount, date: r.date,
        })),
      ),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(`${created.length} lançamentos importados!`);
      onImported(created.length);
      setRows(null); setFileName(null);
    },
  });

  const handleFile = (file: File) => {
    setFileName(file.name);
    setRows(null);
    parseMut.mutate(file);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Upload className="size-4 text-primary" />
        <h3 className="font-display font-semibold">Importar extrato bancário</h3>
        <span className="text-xs text-muted-foreground">OFX · CSV · PDF</span>
      </div>

      {!rows && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-accent/30",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".ofx,.csv,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <div className="mx-auto size-12 rounded-2xl gradient-primary text-primary-foreground grid place-items-center mb-3">
            {parseMut.isPending ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
          </div>
          {parseMut.isPending ? (
            <p className="text-sm">Processando <strong>{fileName}</strong>…</p>
          ) : (
            <>
              <p className="font-medium">Arraste seu extrato aqui</p>
              <p className="text-xs text-muted-foreground mt-1">
                ou clique para escolher um arquivo (.ofx, .csv, .pdf)
              </p>
            </>
          )}
        </div>
      )}

      {rows && (
        <ReconciliationTable
          rows={rows}
          fileName={fileName}
          onChange={setRows}
          onCancel={() => { setRows(null); setFileName(null); }}
          onConfirm={() => confirmMut.mutate(rows)}
          confirming={confirmMut.isPending}
        />
      )}
    </div>
  );
}

function ReconciliationTable({
  rows, fileName, onChange, onConfirm, onCancel, confirming,
}: {
  rows: ParsedStatementRow[];
  fileName: string | null;
  onChange: (r: ParsedStatementRow[]) => void;
  onConfirm: () => void;
  onCancel: () => void;
  confirming: boolean;
}) {
  const updateRow = (id: string, patch: Partial<ParsedStatementRow>) =>
    onChange(rows.map((r) => (r.tempId === id ? { ...r, ...patch } : r)));
  const removeRow = (id: string) => onChange(rows.filter((r) => r.tempId !== id));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <FileText className="size-4 text-muted-foreground" />
        <span className="font-medium">{fileName}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{rows.length} transações encontradas</span>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-[110px_1fr_180px_120px_40px] gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
          <span>Data</span><span>Descrição</span><span>Categoria</span><span className="text-right">Valor</span><span></span>
        </div>
        <div className="divide-y divide-border max-h-[360px] overflow-y-auto">
          {rows.map((r) => (
            <div key={r.tempId} className="grid grid-cols-[110px_1fr_180px_120px_40px] gap-2 px-3 py-2 items-center">
              <Input type="date" value={r.date} onChange={(e) => updateRow(r.tempId, { date: e.target.value })} className="h-8" />
              <Input value={r.description} onChange={(e) => updateRow(r.tempId, { description: e.target.value })} className="h-8" />
              <Select value={r.category} onValueChange={(v) => updateRow(r.tempId, { category: v })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => updateRow(r.tempId, { type: r.type === "income" ? "expense" : "income" })}
                  className={cn(
                    "size-6 rounded-md grid place-items-center",
                    r.type === "income" ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive",
                  )}
                  title="Alternar tipo"
                >
                  {r.type === "income" ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                </button>
                <span className={cn("font-medium text-sm tabular-nums", r.type === "income" && "text-success")}>
                  {brl(r.amount)}
                </span>
              </div>
              <Button size="icon" variant="ghost" className="size-7" onClick={() => removeRow(r.tempId)}>
                <Trash2 className="size-3.5 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={confirming}>Cancelar</Button>
        <Button onClick={onConfirm} disabled={confirming || rows.length === 0} className="rounded-full">
          {confirming ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Confirmar tudo ({rows.length})
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------- Bulk Entry ------------------------------- */

interface BulkRow {
  id: string;
  description: string;
  category: string;
  amount: string;
  type: TxType;
  date: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const newBulkRow = (): BulkRow => ({
  id: `r${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  description: "", category: CATEGORIES[0], amount: "", type: "expense", date: today(),
});

function BulkEntryDialog({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<BulkRow[]>([newBulkRow()]);
  const firstInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (open) setRows([newBulkRow()]);
  }, [open]);

  const update = (id: string, patch: Partial<BulkRow>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeRow = (id: string) => setRows((rs) => (rs.length === 1 ? rs : rs.filter((r) => r.id !== id)));

  const addRow = () => {
    const r = newBulkRow();
    setRows((rs) => [...rs, r]);
    setTimeout(() => firstInputRefs.current[r.id]?.focus(), 30);
  };

  const save = useMutation({
    mutationFn: () => {
      const valid = rows
        .filter((r) => r.description.trim() && Number(r.amount) > 0)
        .map((r) => ({
          type: r.type,
          description: r.description.trim(),
          category: r.category,
          amount: Number(r.amount),
          date: r.date,
        }));
      if (valid.length === 0) return Promise.reject(new Error("Preencha pelo menos uma linha completa."));
      return transactionsService.createMany(valid);
    },
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(`${created.length} lançamentos salvos!`);
      onDone();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full">
          <TableIcon className="size-4" /> Entrada em massa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TableIcon className="size-4 text-primary" /> Modo planilha
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            <kbd className="px-1.5 py-0.5 rounded bg-muted">Tab</kbd> para próximo campo ·{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-muted">Enter</kbd> para nova linha
          </p>
        </DialogHeader>

        <div className="rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-[110px_1fr_160px_120px_80px_40px] gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
            <span>Data</span><span>Descrição</span><span>Categoria</span><span className="text-right">Valor</span><span>Tipo</span><span></span>
          </div>
          <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
            {rows.map((r, idx) => (
              <div key={r.id} className="grid grid-cols-[110px_1fr_160px_120px_80px_40px] gap-2 px-3 py-2 items-center">
                <Input type="date" value={r.date} onChange={(e) => update(r.id, { date: e.target.value })} className="h-8" />
                <Input
                  ref={(el) => { firstInputRefs.current[r.id] = el; }}
                  value={r.description}
                  onChange={(e) => update(r.id, { description: e.target.value })}
                  placeholder="Descrição"
                  className="h-8"
                  autoFocus={idx === rows.length - 1}
                />
                <Select value={r.category} onValueChange={(v) => update(r.id, { category: v })}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  type="number" step="0.01" value={r.amount} placeholder="0,00"
                  onChange={(e) => update(r.id, { amount: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addRow(); }
                  }}
                  className="h-8 text-right"
                />
                <button
                  onClick={() => update(r.id, { type: r.type === "income" ? "expense" : "income" })}
                  className={cn(
                    "h-8 rounded-md text-xs font-medium flex items-center justify-center gap-1",
                    r.type === "income" ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive",
                  )}
                >
                  {r.type === "income" ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {r.type === "income" ? "in" : "out"}
                </button>
                <Button size="icon" variant="ghost" className="size-7" onClick={() => removeRow(r.id)}>
                  <Trash2 className="size-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
          <button
            onClick={addRow}
            className="w-full py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 transition flex items-center justify-center gap-1"
          >
            <ListPlus className="size-3.5" /> Adicionar linha (Enter)
          </button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending} className="rounded-full">
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Salvar tudo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------- Single Entry Dialog -------------------------- */

function SingleEntryDialog() {
  const qc = useQueryClient();
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full"><Plus className="size-4" /> Novo lançamento</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="size-4 text-primary" /> Novo lançamento</DialogTitle>
        </DialogHeader>
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
  );
}
