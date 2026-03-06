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

export async function loadRuntimeConfig(): Promise<void> {
  if (loaded) return;
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
