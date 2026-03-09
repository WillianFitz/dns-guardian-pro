// DNS Monitor - Cloudflare Worker API
// Deploy: cd cloudflare && wrangler deploy

export interface Env {
  DB: D1Database;
  FRONTEND_URL: string;
  ADMIN_SECRET: string;
}

const corsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
});

function jsonResponse(data: any, status = 200, origin = '*') {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

function errorResponse(error: string, status = 400, origin = '*') {
  return new Response(JSON.stringify({ success: false, error }), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

// Valida API Key do coletor
async function validateApiKey(db: D1Database, key: string): Promise<string | null> {
  const row = await db.prepare('SELECT company_slug FROM api_keys WHERE key = ? AND active = 1').bind(key).first();
  return row ? (row as any).company_slug : null;
}

// Normaliza string (remove \r, \n, espaços extras - evita problema ao colar no dashboard)
function norm(s: string): string {
  return (s || '').replace(/\r\n?|\n/g, '').trim();
}

// Valida admin token
function validateAdmin(request: Request, env: Env): boolean {
  const auth = request.headers.get('Authorization')?.trim();
  const secret = norm(env.ADMIN_SECRET || '');
  if (!secret) return false;
  const expected = `Bearer ${secret}`;
  return norm(auth || '') === norm(expected);
}

// --- Auth: hash de senha (PBKDF2) ---
async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key,
    256
  );
  const hash = new Uint8Array(bits);
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(h => parseInt(h, 16)));
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key,
    256
  );
  const hash = new Uint8Array(bits);
  const expected = Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === expected;
}

// --- Token de login (empresa): payload assinado com HMAC ---
const TOKEN_EXP_DAYS = 7;
async function signToken(payload: { userId: number; companySlug: string }, secret: string): Promise<string> {
  const data = JSON.stringify({ ...payload, exp: Date.now() + TOKEN_EXP_DAYS * 86400000 });
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const b64 = btoa(unescape(encodeURIComponent(data)));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${b64}.${sigB64}`;
}
async function verifyToken(token: string, env: Env): Promise<{ userId: number; companySlug: string } | null> {
  try {
    const [b64, sigB64] = token.split('.');
    if (!b64 || !sigB64) return null;
    const data = JSON.parse(decodeURIComponent(escape(atob(b64))));
    if (!data.userId || !data.companySlug || !data.exp || data.exp < Date.now()) return null;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(env.ADMIN_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const payloadStr = decodeURIComponent(escape(atob(b64)));
    const sig = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify('HMAC', key, sig, enc.encode(payloadStr));
    if (!isValid) return null;
    const row = await env.DB.prepare('SELECT id, company_slug FROM users WHERE id = ?').bind(data.userId).first();
    if (!row || (row as any).company_slug !== data.companySlug) return null;
    return { userId: data.userId, companySlug: data.companySlug };
  } catch {
    return null;
  }
}

// Company do request: token de usuário (login empresa) ou query param (retrocompat)
async function getCompanySlugFromRequest(request: Request, url: URL, env: Env): Promise<string | null> {
  const auth = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (auth && auth !== env.ADMIN_SECRET) {
    const decoded = await verifyToken(auth, env);
    if (decoded) return decoded.companySlug;
  }
  return url.searchParams.get('company') || null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = request.headers.get('Origin') || '*';

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    try {
      // ==========================================
      // INGEST ENDPOINTS (chamados pelo coletor)
      // ==========================================

      // POST /ingest/dns - Recebe queries DNS em lote
      if (path === '/ingest/dns' && request.method === 'POST') {
        const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!apiKey) return errorResponse('API key required', 401, origin);
        const companySlug = await validateApiKey(env.DB, apiKey);
        if (!companySlug) return errorResponse('Invalid API key', 403, origin);

        const body: any = await request.json();
        const queries = body.queries || [];

        if (queries.length === 0) return errorResponse('No queries provided', 400, origin);

        // Insert em batch
        const stmt = env.DB.prepare(
          'INSERT INTO dns_queries (company_slug, domain, query_type, client_ip, status, response_time_ms, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        const batch = queries.map((q: any) =>
          stmt.bind(companySlug, q.domain, q.query_type || 'A', q.client_ip, q.status || 'accepted', q.response_time_ms || 0, q.timestamp || new Date().toISOString())
        );
        await env.DB.batch(batch);

        // Se houver bloqueios RPZ, registrar também
        const rpzBlocks = queries.filter((q: any) => q.status === 'denied' || q.rpz_blocked);
        if (rpzBlocks.length > 0) {
          const rpzStmt = env.DB.prepare(
            'INSERT INTO rpz_blocks (company_slug, domain, client_ip, category, created_at) VALUES (?, ?, ?, ?, ?)'
          );
          const rpzBatch = rpzBlocks.map((q: any) =>
            rpzStmt.bind(companySlug, q.domain, q.client_ip, q.category || 'Outros', q.timestamp || new Date().toISOString())
          );
          await env.DB.batch(rpzBatch);

          // Criar eventos de segurança para bloqueios
          const secStmt = env.DB.prepare(
            'INSERT INTO security_events (company_slug, description, source_ip, severity, event_type, created_at) VALUES (?, ?, ?, ?, ?, ?)'
          );
          const secBatch = rpzBlocks.map((q: any) =>
            secStmt.bind(
              companySlug,
              `Bloqueio RPZ - ${q.domain}`,
              q.client_ip,
              'alta',
              'rpz_block',
              q.timestamp || new Date().toISOString()
            )
          );
          await env.DB.batch(secBatch);
        }

        return jsonResponse({ inserted: queries.length, rpz_blocks: rpzBlocks.length }, 200, origin);
      }

      // POST /ingest/system - Recebe métricas do sistema
      if (path === '/ingest/system' && request.method === 'POST') {
        const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!apiKey) return errorResponse('API key required', 401, origin);
        const companySlug = await validateApiKey(env.DB, apiKey);
        if (!companySlug) return errorResponse('Invalid API key', 403, origin);

        const body: any = await request.json();

        await env.DB.prepare(
          'INSERT INTO system_metrics (company_slug, cpu, memory, disk, uptime, download_mbps, upload_mbps) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(companySlug, body.cpu || 0, body.memory || 0, body.disk || 0, body.uptime || '0d 0h 0m', body.download_mbps || 0, body.upload_mbps || 0).run();

        // Atualizar processos
        if (body.processes && body.processes.length > 0) {
          await env.DB.prepare('DELETE FROM system_processes WHERE company_slug = ?').bind(companySlug).run();
          const procStmt = env.DB.prepare(
            'INSERT INTO system_processes (company_slug, pid, name, cpu_percent, memory_percent) VALUES (?, ?, ?, ?, ?)'
          );
          const procBatch = body.processes.map((p: any) =>
            procStmt.bind(companySlug, p.pid, p.name, p.cpu_percent || 0, p.memory_percent || 0)
          );
          await env.DB.batch(procBatch);
        }

        // Atualizar firewall stats
        if (body.firewall) {
          await env.DB.prepare(
            `INSERT INTO firewall_stats (company_slug, jails_active, ips_banned, nft_rules, uptime)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(company_slug) DO UPDATE SET
             jails_active=excluded.jails_active, ips_banned=excluded.ips_banned,
             nft_rules=excluded.nft_rules, uptime=excluded.uptime, updated_at=CURRENT_TIMESTAMP`
          ).bind(companySlug, body.firewall.jails_active || 0, body.firewall.ips_banned || 0, body.firewall.nft_rules || 0, body.firewall.uptime || '0h 0m').run();
        }

        // Registrar um log simples de sistema a cada ingest
        await env.DB.prepare(
          'INSERT INTO firewall_logs (company_slug, log_type, message, source_ip) VALUES (?, ?, ?, ?)'
        ).bind(
          companySlug,
          'system',
          `Métricas: CPU=${body.cpu || 0}%, MEM=${body.memory || 0}%, DISK=${body.disk || 0}%`,
          null
        ).run();

        return jsonResponse({ ok: true }, 200, origin);
      }

      // POST /ingest/rpz-list - Atualiza lista RPZ
      if (path === '/ingest/rpz-list' && request.method === 'POST') {
        const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!apiKey) return errorResponse('API key required', 401, origin);
        const companySlug = await validateApiKey(env.DB, apiKey);
        if (!companySlug) return errorResponse('Invalid API key', 403, origin);

        const body: any = await request.json();

        // Atualizar status RPZ
        await env.DB.prepare(
          `INSERT INTO rpz_status (company_slug, zone_status, zone_serial, last_sync, list_size_bytes)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
           ON CONFLICT(company_slug) DO UPDATE SET
           zone_status=excluded.zone_status, zone_serial=excluded.zone_serial,
           last_sync=CURRENT_TIMESTAMP, list_size_bytes=excluded.list_size_bytes, updated_at=CURRENT_TIMESTAMP`
        ).bind(companySlug, body.zone_status || 'active', body.zone_serial || '', body.list_size_bytes || 0).run();

        // Atualizar domínios RPZ se fornecidos
        if (body.domains && body.domains.length > 0) {
          const domStmt = env.DB.prepare(
            'INSERT OR IGNORE INTO rpz_domains (domain, category) VALUES (?, ?)'
          );
          // Process in batches of 100
          for (let i = 0; i < body.domains.length; i += 100) {
            const batch = body.domains.slice(i, i + 100).map((d: any) =>
              domStmt.bind(d.domain, d.category || 'Outros')
            );
            await env.DB.batch(batch);
          }
        }

        return jsonResponse({ ok: true }, 200, origin);
      }

      // ==========================================
      // LOGIN (usuário da empresa)
      // ==========================================
      if (path === '/auth/login' && request.method === 'POST') {
        const body: any = await request.json();
        const email = (body.email || '').trim().toLowerCase();
        const password = body.password;
        if (!email || !password) return errorResponse('Email e senha obrigatórios', 400, origin);
        const user = await env.DB.prepare('SELECT id, password_hash, company_slug, name, role FROM users WHERE email = ?')
          .bind(email).first() as any;
        if (!user || !user.company_slug) return errorResponse('Credenciais inválidas', 401, origin);
        const ok = await verifyPassword(password, user.password_hash);
        if (!ok) return errorResponse('Credenciais inválidas', 401, origin);
        const token = await signToken({ userId: user.id, companySlug: user.company_slug }, env.ADMIN_SECRET);
        return jsonResponse({
          token,
          companySlug: user.company_slug,
          user: { name: user.name, email, role: user.role },
        }, 200, origin);
      }

      // ==========================================
      // ADMIN ENDPOINTS (antes do dashboard, senão /admin/* cai no "company=" e dá 401)
      // ==========================================
      if (path.startsWith('/admin/')) {
        if (!validateAdmin(request, env)) return errorResponse('Unauthorized', 401, origin);

        if (path === '/admin/companies' && request.method === 'GET') {
          const results = await env.DB.prepare('SELECT * FROM companies ORDER BY created_at DESC').all();
          return jsonResponse(results.results.map((c: any) => ({
            id: c.id.toString(),
            name: c.name,
            slug: c.slug,
            systemName: c.system_name,
            logoUrl: c.logo_url,
            dnsServers: JSON.parse(c.dns_servers || '[]'),
            active: c.active === 1,
            createdAt: c.created_at,
          })), 200, origin);
        }

        if (path === '/admin/companies' && request.method === 'POST') {
          const body: any = await request.json();
          const result = await env.DB.prepare(
            'INSERT INTO companies (name, slug, system_name, logo_url, dns_servers) VALUES (?, ?, ?, ?, ?)'
          ).bind(body.name, body.slug, body.systemName, body.logoUrl || null, JSON.stringify(body.dnsServers || [])).run();
          const apiKey = crypto.randomUUID();
          await env.DB.prepare(
            'INSERT INTO api_keys (key, company_slug, description) VALUES (?, ?, ?)'
          ).bind(apiKey, body.slug, `Auto-generated for ${body.name}`).run();
          return jsonResponse({ id: result.meta.last_row_id, apiKey }, 201, origin);
        }

        const companyMatch = path.match(/^\/admin\/companies\/(\d+)$/);
        if (companyMatch && request.method === 'PUT') {
          const id = companyMatch[1];
          const body: any = await request.json();
          await env.DB.prepare(
            'UPDATE companies SET name=?, slug=?, system_name=?, logo_url=?, dns_servers=?, active=? WHERE id=?'
          ).bind(body.name, body.slug, body.systemName, body.logoUrl || null, JSON.stringify(body.dnsServers || []), body.active ? 1 : 0, id).run();
          return jsonResponse({ ok: true }, 200, origin);
        }
        if (companyMatch && request.method === 'DELETE') {
          await env.DB.prepare('DELETE FROM companies WHERE id = ?').bind(companyMatch[1]).run();
          return jsonResponse({ ok: true }, 200, origin);
        }

        if (path === '/admin/api-keys' && request.method === 'GET') {
          const results = await env.DB.prepare('SELECT * FROM api_keys ORDER BY created_at DESC').all();
          return jsonResponse(results.results, 200, origin);
        }

        if (path === '/admin/users' && request.method === 'GET') {
          const byCompany = url.searchParams.get('company');
          let results;
          if (byCompany) {
            results = await env.DB.prepare('SELECT id, email, name, role, company_slug, created_at FROM users WHERE company_slug = ? ORDER BY created_at DESC')
              .bind(byCompany).all();
          } else {
            results = await env.DB.prepare('SELECT id, email, name, role, company_slug, created_at FROM users ORDER BY company_slug, created_at DESC').all();
          }
          return jsonResponse(results.results.map((u: any) => ({
            id: u.id.toString(),
            email: u.email,
            name: u.name,
            role: u.role,
            companySlug: u.company_slug,
            createdAt: u.created_at,
          })), 200, origin);
        }

        if (path === '/admin/users' && request.method === 'POST') {
          const body: any = await request.json();
          const email = (body.email || '').trim().toLowerCase();
          const password = body.password;
          const companySlug = (body.companySlug || body.company_slug || '').trim();
          const name = (body.name || '').trim() || null;
          const role = body.role || 'viewer';
          if (!email || !password || !companySlug) return errorResponse('email, password e companySlug obrigatórios', 400, origin);
          const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
          if (existing) return errorResponse('Email já cadastrado', 400, origin);
          const company = await env.DB.prepare('SELECT id FROM companies WHERE slug = ?').bind(companySlug).first();
          if (!company) return errorResponse('Empresa não encontrada', 400, origin);
          const passwordHash = await hashPassword(password);
          await env.DB.prepare(
            'INSERT INTO users (email, password_hash, name, role, company_slug) VALUES (?, ?, ?, ?, ?)'
          ).bind(email, passwordHash, name, role, companySlug).run();
          return jsonResponse({ ok: true, message: 'Usuário criado' }, 201, origin);
        }

        const userMatch = path.match(/^\/admin\/users\/(\d+)$/);
        if (userMatch && request.method === 'DELETE') {
          await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userMatch[1]).run();
          return jsonResponse({ ok: true }, 200, origin);
        }
      }

      // ==========================================
      // DASHBOARD ENDPOINTS (chamados pelo frontend)
      // ==========================================
      const companySlug = await getCompanySlugFromRequest(request, url, env);
      if (!companySlug) {
        return errorResponse('Faça login ou informe company=', 401, origin);
      }

      // GET /dns/stats
      if (path === '/dns/stats' && request.method === 'GET') {
        const period = url.searchParams.get('period') || '24h';
        const hours = { '1h': 1, '3h': 3, '6h': 6, '12h': 12, '24h': 24 }[period] || 24;
        const since = new Date(Date.now() - hours * 3600000).toISOString();

        const total = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM dns_queries WHERE company_slug = ? AND created_at >= ?'
        ).bind(companySlug, since).first();

        const accepted = await env.DB.prepare(
          "SELECT COUNT(*) as count FROM dns_queries WHERE company_slug = ? AND created_at >= ? AND status = 'accepted'"
        ).bind(companySlug, since).first();

        const denied = await env.DB.prepare(
          "SELECT COUNT(*) as count FROM dns_queries WHERE company_slug = ? AND created_at >= ? AND status = 'denied'"
        ).bind(companySlug, since).first();

        const totalCount = (total as any)?.count || 0;
        const acceptedCount = (accepted as any)?.count || 0;
        const deniedCount = (denied as any)?.count || 0;

        return jsonResponse({
          totalQueries: totalCount,
          successRate: totalCount > 0 ? ((acceptedCount / totalCount) * 100).toFixed(2) : 0,
          blockRate: totalCount > 0 ? ((deniedCount / totalCount) * 100).toFixed(2) : 0,
          queriesOk: acceptedCount,
          queriesDenied: deniedCount,
          queriesPerHour: hours > 0 ? Math.round(totalCount / hours) : 0,
        }, 200, origin);
      }

      // GET /dns/activity
      if (path === '/dns/activity' && request.method === 'GET') {
        const period = url.searchParams.get('period') || '1h';
        const hours = { '1h': 1, '3h': 3, '6h': 6, '12h': 12, '24h': 24 }[period] || 1;
        const since = new Date(Date.now() - hours * 3600000).toISOString();
        const intervalMin = Math.max(1, Math.round((hours * 60) / 12));

        const results = await env.DB.prepare(`
          SELECT
            strftime('%Y-%m-%d %H:', created_at) || printf('%02d', (CAST(strftime('%M', created_at) AS INTEGER) / ${intervalMin}) * ${intervalMin}) as time_bucket,
            SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
            SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END) as denied
          FROM dns_queries
          WHERE company_slug = ? AND created_at >= ?
          GROUP BY time_bucket
          ORDER BY time_bucket ASC
        `).bind(companySlug, since).all();

        return jsonResponse(results.results.map((r: any) => ({
          time: r.time_bucket,
          accepted: r.accepted,
          denied: r.denied,
        })), 200, origin);
      }

      // GET /dns/query-types
      if (path === '/dns/query-types' && request.method === 'GET') {
        const results = await env.DB.prepare(`
          SELECT query_type as name, COUNT(*) as value
          FROM dns_queries WHERE company_slug = ? AND created_at >= datetime('now', '-24 hours')
          GROUP BY query_type ORDER BY value DESC LIMIT 10
        `).bind(companySlug).all();
        return jsonResponse(results.results, 200, origin);
      }

      // GET /dns/top-domains
      if (path === '/dns/top-domains' && request.method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '5');
        const results = await env.DB.prepare(`
          SELECT domain as label, COUNT(*) as value
          FROM dns_queries WHERE company_slug = ? AND created_at >= datetime('now', '-24 hours')
          GROUP BY domain ORDER BY value DESC LIMIT ?
        `).bind(companySlug, limit).all();
        return jsonResponse(results.results.map((r: any, i: number) => ({ rank: i + 1, ...r })), 200, origin);
      }

      // GET /dns/top-clients
      if (path === '/dns/top-clients' && request.method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '5');
        const results = await env.DB.prepare(`
          SELECT client_ip as label, COUNT(*) as value
          FROM dns_queries WHERE company_slug = ? AND created_at >= datetime('now', '-24 hours')
          GROUP BY client_ip ORDER BY value DESC LIMIT ?
        `).bind(companySlug, limit).all();
        return jsonResponse(results.results.map((r: any, i: number) => ({ rank: i + 1, ...r })), 200, origin);
      }

      // GET /rpz/stats
      if (path === '/rpz/stats' && request.method === 'GET') {
        const domainCount = await env.DB.prepare('SELECT COUNT(*) as count FROM rpz_domains').first();
        const blockedCount = await env.DB.prepare(
          "SELECT COUNT(*) as count FROM rpz_blocks WHERE company_slug = ? AND created_at >= datetime('now', '-24 hours')"
        ).bind(companySlug).first();
        const status = await env.DB.prepare('SELECT * FROM rpz_status WHERE company_slug = ?').bind(companySlug).first();

        return jsonResponse({
          blockedDomains: (domainCount as any)?.count || 0,
          blockedAttempts: (blockedCount as any)?.count || 0,
          lastUpdate: (status as any)?.last_sync || '--',
          listSize: formatBytes((status as any)?.list_size_bytes || 0),
        }, 200, origin);
      }

      // GET /rpz/status
      if (path === '/rpz/status' && request.method === 'GET') {
        const status = await env.DB.prepare('SELECT * FROM rpz_status WHERE company_slug = ?').bind(companySlug).first();
        return jsonResponse({
          zoneStatus: (status as any)?.zone_status || 'inactive',
          zoneSerial: (status as any)?.zone_serial || '--',
          lastSync: (status as any)?.last_sync || '--',
        }, 200, origin);
      }

      // GET /rpz/activity
      if (path === '/rpz/activity' && request.method === 'GET') {
        const period = url.searchParams.get('period') || '1h';
        const hours = { '1h': 1, '3h': 3, '6h': 6, '12h': 12, '24h': 24 }[period] || 1;
        const since = new Date(Date.now() - hours * 3600000).toISOString();
        const intervalMin = Math.max(1, Math.round((hours * 60) / 12));

        const results = await env.DB.prepare(`
          SELECT
            strftime('%Y-%m-%d %H:', created_at) || printf('%02d', (CAST(strftime('%M', created_at) AS INTEGER) / ${intervalMin}) * ${intervalMin}) as time_bucket,
            COUNT(*) as blocked
          FROM rpz_blocks
          WHERE company_slug = ? AND created_at >= ?
          GROUP BY time_bucket ORDER BY time_bucket ASC
        `).bind(companySlug, since).all();

        return jsonResponse(results.results.map((r: any) => ({ time: r.time_bucket, blocked: r.blocked })), 200, origin);
      }

      // GET /rpz/categories
      if (path === '/rpz/categories' && request.method === 'GET') {
        const results = await env.DB.prepare(`
          SELECT category as name, COUNT(*) as value
          FROM rpz_blocks WHERE company_slug = ? AND created_at >= datetime('now', '-24 hours')
          GROUP BY category ORDER BY value DESC
        `).bind(companySlug).all();
        return jsonResponse(results.results, 200, origin);
      }

      // GET /rpz/recent
      if (path === '/rpz/recent' && request.method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const results = await env.DB.prepare(`
          SELECT domain, client_ip, category,
            CAST((strftime('%s','now') - strftime('%s', created_at)) / 60 AS INTEGER) as minutes_ago
          FROM rpz_blocks WHERE company_slug = ? ORDER BY created_at DESC LIMIT ?
        `).bind(companySlug, limit).all();
        return jsonResponse(results.results.map((r: any) => ({
          domain: r.domain,
          time: r.minutes_ago < 60 ? `${r.minutes_ago} min atrás` : `${Math.round(r.minutes_ago / 60)}h atrás`,
          category: r.category,
          clientIp: r.client_ip,
        })), 200, origin);
      }

      // GET /security/stats
      if (path === '/security/stats' && request.method === 'GET') {
        const events = await env.DB.prepare(
          "SELECT COUNT(*) as count FROM security_events WHERE company_slug = ? AND created_at >= datetime('now', '-24 hours')"
        ).bind(companySlug).first();
        const blocked = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM blocked_ips WHERE company_slug = ?'
        ).bind(companySlug).first();

        return jsonResponse({
          securityEvents: (events as any)?.count || 0,
          blockedIps: (blocked as any)?.count || 0,
          monitoringStatus: 'Ativo',
          securityLevel: (events as any)?.count > 10 ? 'Crítico' : (events as any)?.count > 0 ? 'Alto' : 'Normal',
        }, 200, origin);
      }

      // GET /security/events
      if (path === '/security/events' && request.method === 'GET') {
        const results = await env.DB.prepare(`
          SELECT description, source_ip as ip, severity,
            CAST((strftime('%s','now') - strftime('%s', created_at)) / 60 AS INTEGER) as minutes_ago
          FROM security_events WHERE company_slug = ? ORDER BY created_at DESC LIMIT 20
        `).bind(companySlug).all();
        return jsonResponse(results.results.map((r: any) => ({
          description: r.description,
          ip: r.ip || 'Cliente DNS',
          time: r.minutes_ago < 60 ? `${r.minutes_ago} min atrás` : `${Math.round(r.minutes_ago / 60)}h atrás`,
          severity: r.severity === 'alta' ? 'Alta' : r.severity === 'media' ? 'Média' : 'Baixa',
        })), 200, origin);
      }

      // GET /security/blocked-ips
      if (path === '/security/blocked-ips' && request.method === 'GET') {
        const results = await env.DB.prepare(`
          SELECT ip, attempts,
            CAST((strftime('%s','now') - strftime('%s', last_activity)) / 60 AS INTEGER) as minutes_ago
          FROM blocked_ips WHERE company_slug = ? ORDER BY attempts DESC LIMIT 10
        `).bind(companySlug).all();
        return jsonResponse(results.results.map((r: any, i: number) => ({
          rank: i + 1,
          ip: r.ip,
          attempts: r.attempts,
          lastActivity: r.minutes_ago < 60 ? `${r.minutes_ago} min atrás` : `${Math.round(r.minutes_ago / 60)}h atrás`,
        })), 200, origin);
      }

      // GET /security/firewall
      if (path === '/security/firewall' && request.method === 'GET') {
        const stats = await env.DB.prepare('SELECT * FROM firewall_stats WHERE company_slug = ?').bind(companySlug).first();
        return jsonResponse({
          jailsActive: (stats as any)?.jails_active || 0,
          ipsBanned: (stats as any)?.ips_banned || 0,
          nftRules: (stats as any)?.nft_rules || 0,
          uptime: (stats as any)?.uptime || '--',
        }, 200, origin);
      }

      // GET /system/resources
      if (path === '/system/resources' && request.method === 'GET') {
        const latest = await env.DB.prepare(
          'SELECT * FROM system_metrics WHERE company_slug = ? ORDER BY created_at DESC LIMIT 1'
        ).bind(companySlug).first();
        return jsonResponse({
          cpu: (latest as any)?.cpu || 0,
          memory: (latest as any)?.memory || 0,
          disk: (latest as any)?.disk || 0,
          uptime: (latest as any)?.uptime || '--',
        }, 200, origin);
      }

      // GET /system/cpu-memory
      if (path === '/system/cpu-memory' && request.method === 'GET') {
        const results = await env.DB.prepare(`
          SELECT strftime('%H:%M', created_at) as time, cpu, memory
          FROM system_metrics WHERE company_slug = ?
          ORDER BY created_at DESC LIMIT 20
        `).bind(companySlug).all();
        return jsonResponse(results.results.reverse(), 200, origin);
      }

      // GET /system/network
      if (path === '/system/network' && request.method === 'GET') {
        const results = await env.DB.prepare(`
          SELECT strftime('%H:%M', created_at) as time, download_mbps as download, upload_mbps as upload
          FROM system_metrics WHERE company_slug = ?
          ORDER BY created_at DESC LIMIT 20
        `).bind(companySlug).all();
        return jsonResponse(results.results.reverse(), 200, origin);
      }

      // GET /system/processes
      if (path === '/system/processes' && request.method === 'GET') {
        const results = await env.DB.prepare(
          'SELECT pid, name, cpu_percent as cpu, memory_percent as memory FROM system_processes WHERE company_slug = ? ORDER BY memory_percent DESC'
        ).bind(companySlug).all();
        return jsonResponse(results.results, 200, origin);
      }

      // GET /system/logs
      if (path === '/system/logs' && request.method === 'GET') {
        const results = await env.DB.prepare(
          `SELECT log_type, message, source_ip, created_at
           FROM firewall_logs
           WHERE company_slug = ? AND (log_type = 'system' OR log_type IS NULL)
           ORDER BY created_at DESC
           LIMIT 50`
        ).bind(companySlug).all();
        return jsonResponse(results.results.map((r: any) => ({
          type: r.log_type || 'system',
          message: r.message,
          sourceIp: r.source_ip || null,
          createdAt: r.created_at,
        })), 200, origin);
      }

      return errorResponse('Not found', 404, origin);
    } catch (err: any) {
      console.error('Error:', err);
      return errorResponse(err.message || 'Internal error', 500, origin);
    }
  },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
