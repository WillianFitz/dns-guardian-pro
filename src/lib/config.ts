/**
 * Configuração para produção: ordem de prioridade
 * 1) window.__APP_CONFIG__ (index.html)
 * 2) config.json
 * 3) variáveis de build (VITE_*)
 * 4) valores padrão abaixo
 */

const DEFAULT_API_URL = 'https://dns-monitor-api.willian-fitzbr.workers.dev';
const DEFAULT_ADMIN_SECRET = 'Sudo@0412';

export interface RuntimeConfig {
  VITE_API_URL: string;
  VITE_ADMIN_USER: string;
  VITE_ADMIN_SECRET: string;
}

let runtime: Partial<RuntimeConfig> = {
  VITE_API_URL: import.meta.env.VITE_API_URL || DEFAULT_API_URL,
  VITE_ADMIN_USER: import.meta.env.VITE_ADMIN_USER || 'admin',
  VITE_ADMIN_SECRET: import.meta.env.VITE_ADMIN_SECRET || DEFAULT_ADMIN_SECRET,
};

let loaded = false;

declare global {
  interface Window {
    __APP_CONFIG__?: { VITE_API_URL?: string; VITE_ADMIN_USER?: string; VITE_ADMIN_SECRET?: string };
  }
}

export async function loadRuntimeConfig(): Promise<void> {
  if (loaded) return;
  // 1) Usar config injetada no index.html (sempre disponível)
  const win = typeof window !== 'undefined' ? window : undefined;
  if (win?.__APP_CONFIG__) {
    const c = win.__APP_CONFIG__;
    if (c.VITE_API_URL) runtime.VITE_API_URL = c.VITE_API_URL;
    if (c.VITE_ADMIN_USER) runtime.VITE_ADMIN_USER = c.VITE_ADMIN_USER;
    if (c.VITE_ADMIN_SECRET) runtime.VITE_ADMIN_SECRET = c.VITE_ADMIN_SECRET;
  }
  // 2) Sobrescrever com config.json se existir
  try {
    const res = await fetch('/config.json');
    if (res.ok) {
      const data = await res.json();
      if (data.VITE_API_URL) runtime.VITE_API_URL = data.VITE_API_URL;
      if (data.VITE_ADMIN_USER) runtime.VITE_ADMIN_USER = data.VITE_ADMIN_USER;
      if (data.VITE_ADMIN_SECRET) runtime.VITE_ADMIN_SECRET = data.VITE_ADMIN_SECRET;
    }
  } catch {
    // ignore
  }
  // 3) Garantir que nunca fique vazio em produção
  if (!runtime.VITE_API_URL) runtime.VITE_API_URL = DEFAULT_API_URL;
  if (!runtime.VITE_ADMIN_SECRET) runtime.VITE_ADMIN_SECRET = DEFAULT_ADMIN_SECRET;
  loaded = true;
}

export function getApiUrl(): string {
  return runtime.VITE_API_URL || DEFAULT_API_URL;
}

export function getAdminUser(): string {
  return runtime.VITE_ADMIN_USER || 'admin';
}

export function getAdminSecret(): string {
  return runtime.VITE_ADMIN_SECRET || DEFAULT_ADMIN_SECRET;
}
