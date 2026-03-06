/**
 * Configuração: usa variáveis de build (VITE_*) e opcionalmente
 * public/config.json para permitir configurar sem novo build.
 */

export interface RuntimeConfig {
  VITE_API_URL: string;
  VITE_ADMIN_USER: string;
  VITE_ADMIN_SECRET: string;
}

let runtime: Partial<RuntimeConfig> = {
  VITE_API_URL: import.meta.env.VITE_API_URL || '',
  VITE_ADMIN_USER: import.meta.env.VITE_ADMIN_USER || 'admin',
  VITE_ADMIN_SECRET: import.meta.env.VITE_ADMIN_SECRET || '',
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
  loaded = true;
}

export function getApiUrl(): string {
  return runtime.VITE_API_URL || '';
}

export function getAdminUser(): string {
  return runtime.VITE_ADMIN_USER || 'admin';
}

export function getAdminSecret(): string {
  return runtime.VITE_ADMIN_SECRET || '';
}
