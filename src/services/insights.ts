import { request } from "./api";

export type InsightTone = "warning" | "info" | "success";
export interface Insight {
  id: string;
  title: string;
  description: string;
  tone: InsightTone;
  metric?: string;
}

const data: Insight[] = [
  { id: "i1", tone: "warning", metric: "+15%", title: "Aumento nos gastos com delivery", description: "Comparado ao mês passado, você gastou 15% a mais com aplicativos de comida. Que tal definir um teto semanal?" },
  { id: "i2", tone: "info", metric: "2 ativas", title: "Assinaturas pouco utilizadas", description: "Detectamos 2 serviços de streaming usados menos de 3x neste mês. Avalie pausar uma delas." },
  { id: "i3", tone: "success", metric: "R$ 3.900", title: "Reserva de emergência sugerida", description: "Com base nas suas entradas médias, sugerimos manter cerca de 6 meses de gastos como reserva." },
  { id: "i4", tone: "info", metric: "32%", title: "Sua taxa de poupança está saudável", description: "Você guardou 32% das suas entradas este mês. Continue assim e antecipe metas." },
  { id: "i5", tone: "warning", metric: "R$ 220", title: "Gasto recorrente não categorizado", description: "Identificamos um débito mensal de R$ 220 sem categoria. Vamos organizar?" },
];

export const insightsService = {
  async list() { return request<Insight[]>("GET", "/insights", data, 350); },
};
