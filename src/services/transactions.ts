import { request } from "./api";

export type TxType = "income" | "expense";
export interface Transaction {
  id: string;
  type: TxType;
  description: string;
  category: string;
  amount: number;
  date: string; // ISO
}

export const CATEGORIES = [
  "Alimentação", "Moradia", "Transporte", "Lazer", "Saúde",
  "Educação", "Delivery", "Streaming", "Compras", "Salário", "Freelance", "Outros",
];

const seed: Transaction[] = [
  { id: "t1", type: "income", description: "Salário", category: "Salário", amount: 6500, date: "2025-05-05" },
  { id: "t2", type: "income", description: "Freela design", category: "Freelance", amount: 1200, date: "2025-05-12" },
  { id: "t3", type: "expense", description: "Aluguel", category: "Moradia", amount: 1800, date: "2025-05-05" },
  { id: "t4", type: "expense", description: "Mercado", category: "Alimentação", amount: 720, date: "2025-05-09" },
  { id: "t5", type: "expense", description: "iFood", category: "Delivery", amount: 340, date: "2025-05-14" },
  { id: "t6", type: "expense", description: "Uber", category: "Transporte", amount: 180, date: "2025-05-15" },
  { id: "t7", type: "expense", description: "Netflix", category: "Streaming", amount: 55, date: "2025-05-10" },
  { id: "t8", type: "expense", description: "Cinema", category: "Lazer", amount: 90, date: "2025-05-18" },
];

let store: Transaction[] = [...seed];

export const transactionsService = {
  async list(): Promise<Transaction[]> {
    return request("GET", "/transactions", [...store].sort((a, b) => b.date.localeCompare(a.date)), 200);
  },
  async create(input: Omit<Transaction, "id">): Promise<Transaction> {
    const tx = { ...input, id: `t${Date.now()}` };
    store = [tx, ...store];
    return request("POST", "/transactions", tx);
  },
  async createMany(inputs: Array<Omit<Transaction, "id">>): Promise<Transaction[]> {
    const created = inputs.map((input, i) => ({ ...input, id: `t${Date.now()}_${i}` }));
    store = [...created, ...store];
    return request("POST", "/transactions/bulk", created, 350);
  },
  async remove(id: string): Promise<void> {
    store = store.filter((t) => t.id !== id);
    await request("DELETE", `/transactions/${id}`, null, 150);
  },
};
