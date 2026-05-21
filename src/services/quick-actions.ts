import { request } from "./api";

export interface QuickAction {
  id: string;
  label: string;
  icon: string; // lucide icon name
  amount: number;
  category: string;
  description: string;
}

const seed: QuickAction[] = [
  { id: "qa1", label: "Café", icon: "Coffee", amount: 6, category: "Alimentação", description: "Café" },
  { id: "qa2", label: "Transporte", icon: "Bus", amount: 20, category: "Transporte", description: "Transporte público" },
  { id: "qa3", label: "Almoço", icon: "UtensilsCrossed", amount: 35, category: "Alimentação", description: "Almoço" },
  { id: "qa4", label: "iFood", icon: "Bike", amount: 45, category: "Delivery", description: "Delivery" },
];

let store: QuickAction[] = [...seed];

export const quickActionsService = {
  async list(): Promise<QuickAction[]> {
    return request("GET", "/quick-actions", [...store], 120);
  },
  async create(input: Omit<QuickAction, "id">): Promise<QuickAction> {
    const qa = { ...input, id: `qa${Date.now()}` };
    store = [...store, qa];
    return request("POST", "/quick-actions", qa);
  },
  async remove(id: string): Promise<void> {
    store = store.filter((q) => q.id !== id);
    await request("DELETE", `/quick-actions/${id}`, null, 100);
  },
};
