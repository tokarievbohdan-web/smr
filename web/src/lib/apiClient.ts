"use client";
// Клієнтський виклик API з Bearer-токеном. Повертає data або кидає {code,message}.
export async function apiFetch<T = unknown>(path: string, opts: { method?: string; body?: unknown; token?: string | null } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  const res = await fetch(path, { method: opts.method ?? "GET", headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.ok === false) {
    throw (json && json.error) || { code: "server_error", message: `HTTP ${res.status}` };
  }
  return json.data as T;
}
