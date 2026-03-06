# DNS Monitor - Guia Completo de Deploy e Configuração

## 📋 Arquitetura

```
┌──────────────────┐     ┌─────────────────────┐     ┌──────────────┐
│  Servidor DNS    │     │  Cloudflare Worker   │     │  Frontend    │
│  (BIND9)         │────▶│  (API + D1 Database) │◀────│  (Pages)     │
│                  │     │                      │     │              │
│ • Query logs     │     │ • /ingest/dns        │     │ • Dashboard  │
│ • RPZ zone       │     │ • /ingest/system     │     │ • Admin      │
│ • System metrics │     │ • /ingest/rpz-list   │     │ • Block page │
│                  │     │ • /dns/*             │     │              │
│ Coletores (cron) │     │ • /rpz/*             │     │              │
│ a cada 1 minuto  │     │ • /security/*        │     │              │
└──────────────────┘     │ • /system/*          │     └──────────────┘
                         │ • /admin/*           │
                         └─────────────────────┘
```

## 🚀 Passo 1: Deploy do Backend (Cloudflare Worker + D1)

### 1.1 Instalar Wrangler CLI
```bash
npm install -g wrangler
wrangler login
```

### 1.2 Criar o banco D1
```bash
cd cloudflare
wrangler d1 create dns-monitor
```

Copie o `database_id` que aparecerá e cole no `wrangler.toml`.

### 1.3 Criar as tabelas
```bash
wrangler d1 execute dns-monitor --file=schema.sql
```

### 1.4 Configurar o Worker
Edite o `wrangler.toml`:
```toml
[vars]
FRONTEND_URL = "https://seudominio.pages.dev"
ADMIN_SECRET = "senha-forte-para-admin"

[[d1_databases]]
database_id = "SEU_ID_AQUI"
```

### 1.5 Deploy do Worker
```bash
wrangler deploy
```

Anote a URL do Worker (ex: `https://dns-monitor-api.seudominio.workers.dev`)

## 🌐 Passo 2: Deploy do Frontend (Cloudflare Pages)

### 2.1 Configurar variáveis de ambiente
Crie o arquivo `.env` na raiz do projeto frontend:
```env
VITE_API_URL=https://dns-monitor-api.seudominio.workers.dev
VITE_ADMIN_SECRET=sua-senha-admin
```

### 2.2 Build e Deploy
```bash
npm run build
wrangler pages deploy dist --project-name=dns-monitor
```

Ou conecte o repositório GitHub ao Cloudflare Pages para deploy automático.

## 🖥️ Passo 3: Configurar o Servidor DNS

### 3.1 Habilitar query logging no BIND9
Adicione ao `/etc/bind/named.conf.options`:
```
logging {
    channel query_log {
        file "/var/log/named/queries.log" versions 5 size 100m;
        severity info;
        print-time yes;
        print-category yes;
    };
    category queries { query_log; };
};
```

Reinicie o BIND:
```bash
sudo mkdir -p /var/log/named
sudo chown bind:bind /var/log/named
sudo systemctl restart named
```

### 3.2 Configurar a zona RPZ (bloqueio ANATEL)
Adicione ao `named.conf.options`:
```
options {
    // ... configurações existentes ...
    response-policy {
        zone "rpz.zone" policy nxdomain;
    };
};

zone "rpz.zone" {
    type master;
    file "/etc/bind/zones/db.rpz.zone";
    allow-query { none; };
};
```

Crie o arquivo `/etc/bind/zones/db.rpz.zone`:
```
$TTL 60
@ IN SOA localhost. admin.localhost. (
    2026030601 ; serial
    3600       ; refresh
    900        ; retry
    604800     ; expire
    60         ; minimum
)
@ IN NS localhost.

; Domínios bloqueados - Apostas
bet365.com          CNAME . ; categoria: Apostas
sportingbet.com     CNAME . ; categoria: Apostas

; Domínios bloqueados - Pirataria
pirateflix.io       CNAME . ; categoria: Streaming/Pirataria
```

### 3.3 Instalar os coletores
Copie a pasta `cloudflare/collector/` para o servidor DNS:
```bash
scp -r cloudflare/collector/ root@seu-servidor:/opt/dns-monitor/
```

Execute o instalador:
```bash
ssh root@seu-servidor
cd /opt/dns-monitor
sudo bash install.sh
```

O instalador vai pedir:
- **URL da API**: `https://dns-monitor-api.seudominio.workers.dev`
- **API Key**: Gerada automaticamente ao cadastrar a empresa no painel admin
- **Caminho do query log**: `/var/log/named/queries.log`
- **Caminho da zona RPZ**: `/etc/bind/zones/db.rpz.zone`

### 3.4 Cadastrar a empresa no Admin
1. Acesse `https://seudominio.pages.dev/admin`
2. Clique em "Nova Empresa"
3. Preencha os dados
4. A API retornará uma **API Key** - use ela no coletor

## 🔄 Como os dados são coletados

### Fluxo de Coleta de Queries DNS
```
BIND9 → queries.log → collect-dns.sh (cron 1min) → parse-queries.py → POST /ingest/dns → D1
```

1. **BIND9** registra cada consulta DNS no arquivo `queries.log`
2. **collect-dns.sh** roda a cada minuto via cron
3. Lê apenas as linhas novas do log (controle por byte offset)
4. **parse-queries.py** parseia as linhas e identifica:
   - Consultas normais (status: `accepted`)
   - Bloqueios RPZ (status: `denied`, com categoria)
5. Envia em batch para a API via POST
6. A API grava no D1 e cria eventos de segurança para bloqueios

### Fluxo de Métricas do Sistema
```
top/free/df/ifstat → collect-system.sh (cron 1min) → POST /ingest/system → D1
```

### Fluxo da Lista RPZ
```
db.rpz.zone → collect-rpz.sh (cron 6h) → POST /ingest/rpz-list → D1
```

## 📱 Página de Bloqueio

Quando um usuário tenta acessar um domínio bloqueado, o BIND retorna NXDOMAIN.
Para redirecionar para a página de bloqueio, configure no BIND para retornar o IP do seu servidor web:

```
; Em vez de CNAME ., usar o IP do servidor com a página de bloqueio:
bet365.com    A    SEU_IP_DO_PAGES
```

E configure o Cloudflare Pages para servir `/blocked` como página padrão.

## 🏢 White Label

Cada empresa recebe:
- Slug único (ex: `teleriza`)
- Nome personalizado do sistema
- Logo própria
- API Key própria para o coletor

O frontend usa `?company=slug` na URL para filtrar os dados por empresa.
Cada cliente acessa: `https://monitor.teleriza.com.br/?company=teleriza`

Configure um CNAME no DNS do cliente apontando para seu Cloudflare Pages.
