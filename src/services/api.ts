// Mock HTTP client — simulates RESTful calls. Replace with real fetch later.
export async function request<T>(method: string, path: string, body?: unknown, delay = 400): Promise<T> {
  // eslint-disable-next-line no-console
  console.debug(`[mock-api] ${method} ${path}`, body ?? "");
  await new Promise((r) => setTimeout(r, delay));
  return Promise.resolve(body as T);
}
