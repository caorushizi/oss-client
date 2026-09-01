import { invoke } from "@tauri-apps/api/core";
import { fetch } from "@tauri-apps/plugin-http";

export interface BackendSession {
  baseUrl: string;
  protocolVersion: number;
  token: string;
}

interface ApiErrorPayload {
  code: string;
  message: string;
  requestId?: string;
}

interface ApiEnvelope<T> {
  data: T;
  error?: ApiErrorPayload | null;
}

export class ApiError extends Error {
  readonly code: string;
  readonly requestId?: string;
  readonly status: number;

  constructor(status: number, payload?: ApiErrorPayload) {
    super(payload?.message ?? `HTTP ${status}`);
    this.name = "ApiError";
    this.code = payload?.code ?? "HTTP_ERROR";
    this.requestId = payload?.requestId;
    this.status = status;
  }
}

let sessionPromise: Promise<BackendSession> | undefined;

export function getBackendSession() {
  sessionPromise ??= invoke<BackendSession>("backend_session");
  return sessionPromise;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const session = await getBackendSession();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${session.token}`);
  headers.set("Accept", "application/json");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${session.baseUrl}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || payload.error) {
    throw new ApiError(response.status, payload.error ?? undefined);
  }

  return payload.data;
}
