-- =============================================================
-- DNS Monitor - Cloudflare D1 Schema
-- Execute com: wrangler d1 execute dns-monitor --file=schema.sql
-- =============================================================

-- Empresas cadastradas (white-label)
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  system_name TEXT NOT NULL DEFAULT 'DNS Monitor',
  logo_url TEXT,
  dns_servers TEXT DEFAULT '[]',
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Consultas DNS (cada query registrada)
CREATE TABLE IF NOT EXISTS dns_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_slug TEXT NOT NULL,
  domain TEXT NOT NULL,
  query_type TEXT NOT NULL DEFAULT 'A',
  client_ip TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'accepted',
  response_time_ms REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_dns_queries_company ON dns_queries(company_slug, created_at);
CREATE INDEX IF NOT EXISTS idx_dns_queries_domain ON dns_queries(domain, created_at);
CREATE INDEX IF NOT EXISTS idx_dns_queries_client ON dns_queries(client_ip, created_at);
CREATE INDEX IF NOT EXISTS idx_dns_queries_status ON dns_queries(status, created_at);

-- Bloqueios RPZ (domínios bloqueados pela ANATEL)
CREATE TABLE IF NOT EXISTS rpz_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_slug TEXT NOT NULL,
  domain TEXT NOT NULL,
  client_ip TEXT NOT NULL,
  category TEXT DEFAULT 'Outros',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rpz_blocks_company ON rpz_blocks(company_slug, created_at);

-- Lista de domínios RPZ (a lista da ANATEL)
CREATE TABLE IF NOT EXISTS rpz_domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT UNIQUE NOT NULL,
  category TEXT DEFAULT 'Outros',
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Status do sistema RPZ
CREATE TABLE IF NOT EXISTS rpz_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_slug TEXT UNIQUE NOT NULL,
  zone_status TEXT DEFAULT 'inactive',
  zone_serial TEXT DEFAULT '',
  last_sync DATETIME,
  list_size_bytes INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Eventos de segurança
CREATE TABLE IF NOT EXISTS security_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_slug TEXT NOT NULL,
  description TEXT NOT NULL,
  source_ip TEXT,
  severity TEXT DEFAULT 'media',
  event_type TEXT DEFAULT 'rpz_block',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_security_events_company ON security_events(company_slug, created_at);

-- IPs bloqueados pelo firewall
CREATE TABLE IF NOT EXISTS blocked_ips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_slug TEXT NOT NULL,
  ip TEXT NOT NULL,
  reason TEXT,
  attempts INTEGER DEFAULT 1,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Métricas do sistema (CPU, RAM, disco)
CREATE TABLE IF NOT EXISTS system_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_slug TEXT NOT NULL,
  cpu REAL DEFAULT 0,
  memory REAL DEFAULT 0,
  disk REAL DEFAULT 0,
  uptime TEXT DEFAULT '0d 0h 0m',
  download_mbps REAL DEFAULT 0,
  upload_mbps REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_metrics_company ON system_metrics(company_slug, created_at);

-- Processos do sistema
CREATE TABLE IF NOT EXISTS system_processes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_slug TEXT NOT NULL,
  pid INTEGER NOT NULL,
  name TEXT NOT NULL,
  cpu_percent REAL DEFAULT 0,
  memory_percent REAL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Logs do firewall
CREATE TABLE IF NOT EXISTS firewall_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_slug TEXT NOT NULL,
  log_type TEXT DEFAULT 'general',
  message TEXT NOT NULL,
  source_ip TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Stats do firewall
CREATE TABLE IF NOT EXISTS firewall_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_slug TEXT UNIQUE NOT NULL,
  jails_active INTEGER DEFAULT 0,
  ips_banned INTEGER DEFAULT 0,
  nft_rules INTEGER DEFAULT 0,
  uptime TEXT DEFAULT '0h 0m',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Usuários admin
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'viewer',
  company_slug TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- API Keys para autenticação dos coletores
CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  company_slug TEXT NOT NULL,
  description TEXT,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
