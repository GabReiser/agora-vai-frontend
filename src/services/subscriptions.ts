import { request } from "./api";

export interface Subscription {
  id: string;
  name: string;
  category: string;
  amount: number;
  billingDay: number;
  active: boolean;
}

let store: Subscription[] = [
  { id: "s1", name: "Netflix", category: "Streaming", amount: 55.9, billingDay: 10, active: true },
  { id: "s2", name: "Spotify", category: "Streaming", amount: 21.9, billingDay: 15, active: true },
  { id: "s3", name: "Smart Fit", category: "Saúde", amount: 109.9, billingDay: 5, active: true },
  { id: "s4", name: "iCloud 200GB", category: "Software", amount: 12.9, billingDay: 22, active: true },
];

export const subscriptionsService = {
  async list() { return request<Subscription[]>("GET", "/subscriptions", [...store], 200); },
  async create(input: Omit<Subscription, "id">) {
    const s = { ...input, id: `s${Date.now()}` };
    store = [s, ...store];
    return request("POST", "/subscriptions", s);
  },
  async toggle(id: string) {
    store = store.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
    return request("PATCH", `/subscriptions/${id}`, store.find((s) => s.id === id));
  },
  async remove(id: string) {
    store = store.filter((s) => s.id !== id);
    return request("DELETE", `/subscriptions/${id}`, null, 150);
  },
};
