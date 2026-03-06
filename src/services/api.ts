// API service layer for DNS Monitor
// Configure your Cloudflare Worker API URL here
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('API_URL não configurada. Defina VITE_API_URL no .env');
  }
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`Erro na API: ${res.status}`);
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.error || 'Erro desconhecido');
  return json.data;
}

// === DNS Analytics ===
export interface DnsStats {
  totalQueries: number;
  successRate: number;
  blockRate: number;
  queriesOk: number;
  queriesDenied: number;
  queriesPerHour: number;
}

export interface DnsActivityPoint {
  time: string;
  accepted: number;
  denied: number;
}

export interface QueryType {
  name: string;
  value: number;
}

export interface RankedItem {
  rank: number;
  label: string;
  value: number;
}

export const fetchDnsStats = (period: string) =>
  fetchApi<DnsStats>(`/dns/stats?period=${period}`);

export const fetchDnsActivity = (period: string) =>
  fetchApi<DnsActivityPoint[]>(`/dns/activity?period=${period}`);

export const fetchQueryTypes = () =>
  fetchApi<QueryType[]>('/dns/query-types');

export const fetchTopDomains = (limit = 5) =>
  fetchApi<RankedItem[]>(`/dns/top-domains?limit=${limit}`);

export const fetchTopClients = (limit = 5) =>
  fetchApi<RankedItem[]>(`/dns/top-clients?limit=${limit}`);

// === RPZ ANATEL ===
export interface RpzStats {
  blockedDomains: number;
  blockedAttempts: number;
  lastUpdate: string;
  listSize: string;
}

export interface RpzStatus {
  zoneStatus: string;
  zoneSerial: string;
  lastSync: string;
}

export interface BlockedCategory {
  name: string;
  value: number;
}

export interface BlockedDomain {
  domain: string;
  time: string;
  category: string;
}

export const fetchRpzStats = () =>
  fetchApi<RpzStats>('/rpz/stats');

export const fetchRpzStatus = () =>
  fetchApi<RpzStatus>('/rpz/status');

export const fetchBlockedActivity = (period: string) =>
  fetchApi<DnsActivityPoint[]>(`/rpz/activity?period=${period}`);

export const fetchBlockedCategories = () =>
  fetchApi<BlockedCategory[]>('/rpz/categories');

export const fetchRecentBlocked = (limit = 5) =>
  fetchApi<BlockedDomain[]>(`/rpz/recent?limit=${limit}`);

export const triggerRpzUpdate = () =>
  fetchApi<{ success: boolean }>('/rpz/update', { method: 'POST' });

// === Security ===
export interface SecurityStats {
  securityEvents: number;
  blockedIps: number;
  monitoringStatus: string;
  securityLevel: string;
}

export interface SecurityEvent {
  description: string;
  ip: string;
  time: string;
  severity: string;
}

export interface BlockedIp {
  rank: number;
  ip: string;
  attempts: number;
  lastActivity: string;
}

export interface FirewallStats {
  jailsActive: number;
  ipsBanned: number;
  nftRules: number;
  uptime: string;
}

export const fetchSecurityStats = () =>
  fetchApi<SecurityStats>('/security/stats');

export const fetchSecurityEvents = () =>
  fetchApi<SecurityEvent[]>('/security/events');

export const fetchBlockedIps = () =>
  fetchApi<BlockedIp[]>('/security/blocked-ips');

export const fetchFirewallStats = () =>
  fetchApi<FirewallStats>('/security/firewall');

// === System ===
export interface SystemResources {
  cpu: number;
  memory: number;
  disk: number;
  uptime: string;
}

export interface SystemMetricPoint {
  time: string;
  cpu: number;
  memory: number;
}

export interface NetworkPoint {
  time: string;
  download: number;
  upload: number;
}

export interface SystemProcess {
  pid: number;
  name: string;
  cpu: string;
  memory: string;
}

export const fetchSystemResources = () =>
  fetchApi<SystemResources>('/system/resources');

export const fetchCpuMemory = () =>
  fetchApi<SystemMetricPoint[]>('/system/cpu-memory');

export const fetchNetworkTraffic = () =>
  fetchApi<NetworkPoint[]>('/system/network');

export const fetchProcesses = () =>
  fetchApi<SystemProcess[]>('/system/processes');

// === Admin / Companies ===
export interface CompanyData {
  id: string;
  name: string;
  slug: string;
  systemName: string;
  logoUrl: string | null;
  dnsServers: string[];
  active: boolean;
  createdAt: string;
}

export const fetchCompanies = () =>
  fetchApi<CompanyData[]>('/admin/companies');

export const createCompany = (data: Omit<CompanyData, 'id' | 'createdAt'>) =>
  fetchApi<CompanyData>('/admin/companies', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateCompany = (id: string, data: Partial<CompanyData>) =>
  fetchApi<CompanyData>(`/admin/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteCompany = (id: string) =>
  fetchApi<void>(`/admin/companies/${id}`, { method: 'DELETE' });
