import { baseUrl, loadTestEnv } from "./env";

export type ApiResponse<T = unknown> = {
  status: number;
  ok: boolean;
  data: T;
  text: string;
  url: string;
};

export type RequestOpts = {
  token?: string | null;
  headers?: Record<string, string>;
  body?: unknown;
};

async function request<T = unknown>(
  method: string,
  path: string,
  opts: RequestOpts = {}
): Promise<ApiResponse<T>> {
  loadTestEnv();
  const url = path.startsWith("http") ? path : `${baseUrl()}${path}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...opts.headers,
  };
  if (opts.token) {
    headers.Authorization = `Bearer ${opts.token}`;
  }
  let body: string | undefined;
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, { method, headers, body });
  const text = await res.text();
  let data: T = undefined as T;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = text as unknown as T;
    }
  }
  return { status: res.status, ok: res.ok, data, text, url };
}

export function apiGet<T = unknown>(path: string, opts?: RequestOpts) {
  return request<T>("GET", path, opts);
}

export function apiPost<T = unknown>(path: string, body?: unknown, opts?: RequestOpts) {
  return request<T>("POST", path, { ...opts, body });
}

export function apiPut<T = unknown>(path: string, body?: unknown, opts?: RequestOpts) {
  return request<T>("PUT", path, { ...opts, body });
}

export function apiPatch<T = unknown>(path: string, body?: unknown, opts?: RequestOpts) {
  return request<T>("PATCH", path, { ...opts, body });
}

export function apiDelete<T = unknown>(path: string, opts?: RequestOpts) {
  return request<T>("DELETE", path, opts);
}

/** Fail fast if the Next.js server is not reachable. */
export async function assertServerUp() {
  const url = baseUrl();
  const attempts = 8;
  let lastError = "";
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(`${url}/api/health`, {
        signal: AbortSignal.timeout(30_000),
      });
      if (res.status < 500) return;
      lastError = `Server at ${url} returned ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    if (i < attempts) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error(
    `Cannot reach ${url}. Start the app with \`npm run dev\` (or \`npm start\`) first.\n${lastError}`
  );
}
