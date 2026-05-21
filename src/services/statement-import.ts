import { request } from "./api";
import { CATEGORIES, type TxType } from "./transactions";

export type StatementFormat = "ofx" | "csv" | "pdf";

export interface ParsedStatementRow {
  tempId: string;
  date: string;
  description: string;
  amount: number;
  type: TxType;
  category: string;
}

const detectFormat = (filename: string): StatementFormat => {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "ofx") return "ofx";
  if (ext === "pdf") return "pdf";
  return "csv";
};

// Heurística simples baseada na descrição para sugerir categoria/tipo
const guessCategory = (desc: string): { category: string; type: TxType } => {
  const d = desc.toLowerCase();
  if (/(salário|salario|pagamento receb|pix receb|crédito|deposito|depósito)/.test(d))
    return { category: "Salário", type: "income" };
  if (/(freela|honorário|honorario)/.test(d)) return { category: "Freelance", type: "income" };
  if (/(ifood|rappi|delivery)/.test(d)) return { category: "Delivery", type: "expense" };
  if (/(uber|99|taxi|metr[oô]|combust|posto)/.test(d)) return { category: "Transporte", type: "expense" };
  if (/(netflix|spotify|prime|disney|hbo|globo)/.test(d)) return { category: "Streaming", type: "expense" };
  if (/(mercado|super|padaria|hortifruti|carrefour|pão)/.test(d)) return { category: "Alimentação", type: "expense" };
  if (/(aluguel|condom[ií]nio|luz|energia|água|agua|internet)/.test(d)) return { category: "Moradia", type: "expense" };
  if (/(farm[áa]cia|drogaria|consulta|hospital)/.test(d)) return { category: "Saúde", type: "expense" };
  if (/(cinema|bar|show|ingresso|lazer)/.test(d)) return { category: "Lazer", type: "expense" };
  if (/(curso|udemy|faculdade|escola)/.test(d)) return { category: "Educação", type: "expense" };
  return { category: "Outros", type: "expense" };
};

// Mock parser. No real-world, esse parsing aconteceria no backend (OFX/PDF/CSV).
const MOCK_DESCRIPTIONS = [
  "PIX RECEB JOAO", "IFOOD *RESTAURANTE", "UBER TRIP", "SUPERMERCADO BH",
  "NETFLIX.COM", "FARMACIA SAO JOAO", "POSTO SHELL", "SALARIO EMPRESA XYZ",
  "TRANSF PIX ALUGUEL", "PADARIA CENTRAL", "SPOTIFY", "FREELA DESIGN",
];

function generateMockRows(format: StatementFormat, fileName: string): ParsedStatementRow[] {
  const seed = fileName.length + format.length;
  const count = 6 + (seed % 5);
  const today = new Date();
  return Array.from({ length: count }).map((_, i) => {
    const desc = MOCK_DESCRIPTIONS[(seed + i) % MOCK_DESCRIPTIONS.length];
    const { category, type } = guessCategory(desc);
    const amount = Math.round(((seed * (i + 3)) % 480 + 12) * 100) / 100;
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    return {
      tempId: `imp_${Date.now()}_${i}`,
      date: d.toISOString().slice(0, 10),
      description: desc,
      amount: type === "income" ? amount * 6 : amount,
      type,
      category,
    };
  });
}

export const statementImportService = {
  availableCategories: CATEGORIES,
  async parse(file: File): Promise<{ format: StatementFormat; rows: ParsedStatementRow[] }> {
    const format = detectFormat(file.name);
    const rows = generateMockRows(format, file.name);
    return request("POST", "/statements/parse", { format, rows }, 900);
  },
};
