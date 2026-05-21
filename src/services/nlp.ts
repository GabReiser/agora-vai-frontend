import { request } from "./api";
import { CATEGORIES, type TxType } from "./transactions";

export interface NlpParseResult {
  ok: boolean;
  amount?: number;
  type?: TxType;
  category?: string;
  description?: string;
  date?: string;
  reason?: string;
}

const CATEGORY_KEYWORDS: Array<[string, string, TxType]> = [
  ["farm", "Saúde", "expense"],
  ["drogaria", "Saúde", "expense"],
  ["mercado", "Alimentação", "expense"],
  ["padaria", "Alimentação", "expense"],
  ["restaurante", "Alimentação", "expense"],
  ["almoço", "Alimentação", "expense"],
  ["almoco", "Alimentação", "expense"],
  ["jantar", "Alimentação", "expense"],
  ["café", "Alimentação", "expense"],
  ["cafe", "Alimentação", "expense"],
  ["ifood", "Delivery", "expense"],
  ["rappi", "Delivery", "expense"],
  ["uber", "Transporte", "expense"],
  ["99", "Transporte", "expense"],
  ["taxi", "Transporte", "expense"],
  ["combust", "Transporte", "expense"],
  ["gasolina", "Transporte", "expense"],
  ["aluguel", "Moradia", "expense"],
  ["luz", "Moradia", "expense"],
  ["internet", "Moradia", "expense"],
  ["netflix", "Streaming", "expense"],
  ["spotify", "Streaming", "expense"],
  ["cinema", "Lazer", "expense"],
  ["bar", "Lazer", "expense"],
  ["curso", "Educação", "expense"],
  ["faculdade", "Educação", "expense"],
  ["salário", "Salário", "income"],
  ["salario", "Salário", "income"],
  ["freela", "Freelance", "income"],
  ["freelance", "Freelance", "income"],
];

const INCOME_VERBS = /(recebi|ganhei|entrou|caiu|me pagaram|pagaram)/i;
const EXPENSE_VERBS = /(gastei|paguei|comprei|torrei|saiu|investi)/i;

function parseDate(text: string): string {
  const today = new Date();
  const t = text.toLowerCase();
  if (/ontem/.test(t)) today.setDate(today.getDate() - 1);
  else if (/anteontem/.test(t)) today.setDate(today.getDate() - 2);
  return today.toISOString().slice(0, 10);
}

function parseAmount(text: string): number | undefined {
  // captura "45", "45,90", "R$ 1.250,00", "150 reais"
  const m = text
    .replace(/r\$\s?/gi, "")
    .match(/(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/);
  if (!m) return undefined;
  const num = m[1].replace(/\./g, "").replace(",", ".");
  const v = Number(num);
  return Number.isFinite(v) ? v : undefined;
}

function parseLocal(text: string): NlpParseResult {
  const amount = parseAmount(text);
  if (!amount || amount <= 0) {
    return { ok: false, reason: "Não consegui identificar o valor. Tente: \"gastei 45 reais na farmácia\"." };
  }
  const lower = text.toLowerCase();
  let type: TxType = EXPENSE_VERBS.test(lower) ? "expense" : INCOME_VERBS.test(lower) ? "income" : "expense";
  let category = "Outros";
  for (const [kw, cat, t] of CATEGORY_KEYWORDS) {
    if (lower.includes(kw)) {
      category = cat;
      type = t;
      break;
    }
  }
  // descrição: tenta extrair "na X", "no X", "de X"
  const descMatch = lower.match(/\b(?:na|no|em|de|com|para)\s+([a-zà-ú0-9 ]{2,30})/);
  const description = descMatch
    ? descMatch[1].trim().replace(/\b(hoje|ontem|anteontem)\b/g, "").trim() || category
    : category;
  return {
    ok: true,
    amount,
    type,
    category: CATEGORIES.includes(category) ? category : "Outros",
    description: description.charAt(0).toUpperCase() + description.slice(1),
    date: parseDate(lower),
  };
}

export const nlpService = {
  async parse(text: string): Promise<NlpParseResult> {
    const result = parseLocal(text);
    return request("POST", "/nlp/parse", result, 500);
  },
};
