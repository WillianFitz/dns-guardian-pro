// Auth do usuário da empresa (login por empresa)
const TOKEN_KEY = 'dns_monitor_token';
const COMPANY_KEY = 'dns_monitor_company';
const USER_KEY = 'dns_monitor_user';

export interface LoggedUser {
  name: string | null;
  email: string;
  role: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getCompanySlug(): string | null {
  return localStorage.getItem(COMPANY_KEY);
}

export function getLoggedUser(): LoggedUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuth(token: string, companySlug: string, user: LoggedUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(COMPANY_KEY, companySlug);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(COMPANY_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
