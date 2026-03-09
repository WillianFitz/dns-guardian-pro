import { useQuery } from '@tanstack/react-query';
import { getToken, getCompanySlug as getAuthCompany } from '@/lib/auth';
import { getApiUrl, getAdminSecret } from '@/lib/config';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    throw new Error('VITE_API_URL não configurada');
  }
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${apiUrl}${endpoint}`, {
    headers,
    ...options,
  });
  if (!res.ok) throw new Error(`Erro na API: ${res.status}`);
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.error || 'Erro desconhecido');
  return json.data;
}

async function fetchAdminApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const secret = (getAdminSecret() || '').trim();
  return fetchApi<T>(endpoint, {
    ...options,
    headers: { Authorization: `Bearer ${secret}`, ...options?.headers },
  });
}

// Company slug: do login (auth) ou query ?company=
export function getCompanySlug(): string {
  const params = new URLSearchParams(window.location.search);
  return getAuthCompany() || params.get('company') || 'default';
}

function withCompany(endpoint: string, extraParams = ''): string {
  const slug = getCompanySlug();
  const sep = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${sep}company=${slug}${extraParams ? '&' + extraParams : ''}`;
}

// === Hooks DNS Analytics ===
export interface DnsStats {
  totalQueries: number;
  successRate: number;
  blockRate: number;
  queriesOk: number;
  queriesDenied: number;
  queriesPerHour: number;
}

export function useDnsStats(period: string) {
  return useQuery({
    queryKey: ['dns-stats', period, getCompanySlug()],
    queryFn: () => fetchApi<DnsStats>(withCompany('/dns/stats', `period=${period}`)),
    refetchInterval: 60000,
    retry: 1,
  });
}

export interface DnsActivityPoint {
  time: string;
  accepted: number;
  denied: number;
}

export function useDnsActivity(period: string) {
  return useQuery({
    queryKey: ['dns-activity', period, getCompanySlug()],
    queryFn: () => fetchApi<DnsActivityPoint[]>(withCompany('/dns/activity', `period=${period}`)),
    refetchInterval: 60000,
    retry: 1,
  });
}

export interface QueryType {
  name: string;
  value: number;
}

export function useQueryTypes() {
  return useQuery({
    queryKey: ['query-types', getCompanySlug()],
    queryFn: () => fetchApi<QueryType[]>(withCompany('/dns/query-types')),
    refetchInterval: 60000,
    retry: 1,
  });
}

export interface RankedItem {
  rank: number;
  label: string;
  value: number;
}

export function useTopDomains(limit = 5) {
  return useQuery({
    queryKey: ['top-domains', limit, getCompanySlug()],
    queryFn: () => fetchApi<RankedItem[]>(withCompany('/dns/top-domains', `limit=${limit}`)),
    refetchInterval: 60000,
    retry: 1,
  });
}

export function useTopClients(limit = 5) {
  return useQuery({
    queryKey: ['top-clients', limit, getCompanySlug()],
    queryFn: () => fetchApi<RankedItem[]>(withCompany('/dns/top-clients', `limit=${limit}`)),
    refetchInterval: 60000,
    retry: 1,
  });
}

// === Hooks RPZ ===
export interface RpzStats {
  blockedDomains: number;
  blockedAttempts: number;
  lastUpdate: string;
  listSize: string;
}

export function useRpzStats() {
  return useQuery({
    queryKey: ['rpz-stats', getCompanySlug()],
    queryFn: () => fetchApi<RpzStats>(withCompany('/rpz/stats')),
    refetchInterval: 60000,
    retry: 1,
  });
}

export interface RpzStatus {
  zoneStatus: string;
  zoneSerial: string;
  lastSync: string;
}

export function useRpzStatus() {
  return useQuery({
    queryKey: ['rpz-status', getCompanySlug()],
    queryFn: () => fetchApi<RpzStatus>(withCompany('/rpz/status')),
    refetchInterval: 60000,
    retry: 1,
  });
}

export interface BlockedActivityPoint {
  time: string;
  blocked: number;
}

export function useBlockedActivity(period: string) {
  return useQuery({
    queryKey: ['blocked-activity', period, getCompanySlug()],
    queryFn: () => fetchApi<BlockedActivityPoint[]>(withCompany('/rpz/activity', `period=${period}`)),
    refetchInterval: 60000,
    retry: 1,
  });
}

export interface BlockedCategory {
  name: string;
  value: number;
}

export function useBlockedCategories() {
  return useQuery({
    queryKey: ['blocked-categories', getCompanySlug()],
    queryFn: () => fetchApi<BlockedCategory[]>(withCompany('/rpz/categories')),
    refetchInterval: 60000,
    retry: 1,
  });
}

export interface BlockedDomain {
  domain: string;
  time: string;
  category: string;
  clientIp: string;
}

export function useRecentBlocked(limit = 10) {
  return useQuery({
    queryKey: ['recent-blocked', limit, getCompanySlug()],
    queryFn: () => fetchApi<BlockedDomain[]>(withCompany('/rpz/recent', `limit=${limit}`)),
    refetchInterval: 60000,
    retry: 1,
  });
}

// === Hooks Security ===
export interface SecurityStats {
  securityEvents: number;
  blockedIps: number;
  monitoringStatus: string;
  securityLevel: string;
}

export function useSecurityStats() {
  return useQuery({
    queryKey: ['security-stats', getCompanySlug()],
    queryFn: () => fetchApi<SecurityStats>(withCompany('/security/stats')),
    refetchInterval: 60000,
    retry: 1,
  });
}

export interface SecurityEvent {
  description: string;
  ip: string;
  time: string;
  severity: string;
}

export function useSecurityEvents() {
  return useQuery({
    queryKey: ['security-events', getCompanySlug()],
    queryFn: () => fetchApi<SecurityEvent[]>(withCompany('/security/events')),
    refetchInterval: 60000,
    retry: 1,
  });
}

export interface BlockedIp {
  rank: number;
  ip: string;
  attempts: number;
  lastActivity: string;
}

export function useBlockedIps() {
  return useQuery({
    queryKey: ['blocked-ips', getCompanySlug()],
    queryFn: () => fetchApi<BlockedIp[]>(withCompany('/security/blocked-ips')),
    refetchInterval: 60000,
    retry: 1,
  });
}

export interface FirewallStats {
  jailsActive: number;
  ipsBanned: number;
  nftRules: number;
  uptime: string;
}

export function useFirewallStats() {
  return useQuery({
    queryKey: ['firewall-stats', getCompanySlug()],
    queryFn: () => fetchApi<FirewallStats>(withCompany('/security/firewall')),
    refetchInterval: 60000,
    retry: 1,
  });
}

// === Hooks System ===
export interface SystemResources {
  cpu: number;
  memory: number;
  disk: number;
  uptime: string;
}

export function useSystemResources() {
  return useQuery({
    queryKey: ['system-resources', getCompanySlug()],
    queryFn: () => fetchApi<SystemResources>(withCompany('/system/resources')),
    refetchInterval: 15000,
    retry: 1,
  });
}

export interface SystemMetricPoint {
  time: string;
  cpu: number;
  memory: number;
}

export function useCpuMemory() {
  return useQuery({
    queryKey: ['cpu-memory', getCompanySlug()],
    queryFn: () => fetchApi<SystemMetricPoint[]>(withCompany('/system/cpu-memory')),
    refetchInterval: 60000,
    retry: 1,
  });
}

export interface NetworkPoint {
  time: string;
  download: number;
  upload: number;
}

export function useNetworkTraffic() {
  return useQuery({
    queryKey: ['network-traffic', getCompanySlug()],
    queryFn: () => fetchApi<NetworkPoint[]>(withCompany('/system/network')),
    refetchInterval: 60000,
    retry: 1,
  });
}

export interface SystemProcess {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
}

export function useProcesses() {
  return useQuery({
    queryKey: ['processes', getCompanySlug()],
    queryFn: () => fetchApi<SystemProcess[]>(withCompany('/system/processes')),
    refetchInterval: 60000,
    retry: 1,
  });
}

export interface SystemLog {
  type: string;
  message: string;
  sourceIp: string | null;
  createdAt: string;
}

export function useSystemLogs() {
  return useQuery({
    queryKey: ['system-logs', getCompanySlug()],
    queryFn: () => fetchApi<SystemLog[]>(withCompany('/system/logs')),
    refetchInterval: 60000,
    retry: 1,
  });
}

// === Admin ===
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

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: () => fetchAdminApi<CompanyData[]>('/admin/companies'),
    retry: 1,
  });
}

export async function createCompanyApi(data: Omit<CompanyData, 'id' | 'createdAt'>) {
  return fetchAdminApi<{ id: number; apiKey: string }>('/admin/companies', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCompanyApi(id: string, data: Partial<CompanyData>) {
  return fetchAdminApi<{ ok: boolean }>(`/admin/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCompanyApi(id: string) {
  return fetchAdminApi<{ ok: boolean }>(`/admin/companies/${id}`, { method: 'DELETE' });
}

// Check if API is configured
export function isApiConfigured(): boolean {
  return !!getApiUrl();
}

// Login (usuário da empresa)
export interface LoginResponse {
  token: string;
  companySlug: string;
  user: { name: string | null; email: string; role: string };
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  const apiUrl = getApiUrl();
  const res = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Login falhou');
  return json.data;
}

// Admin: usuários por empresa
export interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  companySlug: string;
  createdAt: string;
}

export function useUsers(companySlug?: string) {
  const query = companySlug ? `?company=${encodeURIComponent(companySlug)}` : '';
  return useQuery({
    queryKey: ['admin-users', companySlug],
    queryFn: () => fetchAdminApi<UserData[]>(`/admin/users${query}`),
    retry: 1,
  });
}

export async function createUserApi(data: { email: string; password: string; companySlug: string; name?: string; role?: string }) {
  return fetchAdminApi<{ ok: boolean }>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteUserApi(id: string) {
  return fetchAdminApi<{ ok: boolean }>(`/admin/users/${id}`, { method: 'DELETE' });
}

