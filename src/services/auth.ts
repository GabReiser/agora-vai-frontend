import { request } from "./api";

export type Plan = "free" | "pro";
export interface User {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  isAdmin?: boolean;
}

const KEY = "agoravai:user";

export const authService = {
  async login(email: string, _password: string): Promise<User> {
    await request("POST", "/auth/login", { email });
    const user: User = {
      id: "u_1",
      name: email.split("@")[0] || "Você",
      email,
      plan: "free",
      isAdmin: email.startsWith("admin"),
    };
    localStorage.setItem(KEY, JSON.stringify(user));
    return user;
  },
  async signup(name: string, email: string, _password: string): Promise<User> {
    await request("POST", "/auth/signup", { name, email });
    const user: User = { id: "u_1", name, email, plan: "free" };
    localStorage.setItem(KEY, JSON.stringify(user));
    return user;
  },
  async logout(): Promise<void> {
    await request("POST", "/auth/logout");
    localStorage.removeItem(KEY);
  },
  current(): User | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  },
  setPlan(plan: Plan) {
    const u = this.current();
    if (!u) return;
    const next = { ...u, plan };
    localStorage.setItem(KEY, JSON.stringify(next));
  },
};
