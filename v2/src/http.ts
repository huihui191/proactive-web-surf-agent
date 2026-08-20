export async function fetchJson<T>(url: string, init: RequestInit, timeoutMs: number): Promise<T> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`HTTP ${response.status} from ${new URL(url).host}: ${detail}`);
  }
  return response.json() as Promise<T>;
}
