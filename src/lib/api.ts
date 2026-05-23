import { auth } from "@/config/firebase";

const API_BASE_URL = "http://localhost:8080/api";

// Função genérica para fazer requisições sempre enviando o Token JWT
export const fetchWithAuth = async <TResponse = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<TResponse> => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Usuário não autenticado no Firebase");
  }

  // Pega o token atualizado (se estiver vencido, o Firebase renova sozinho aqui)
  const token = await user.getIdToken();

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  // Evita forçar JSON em uploads multipart/form-data
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Erro na API Back-end: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
};