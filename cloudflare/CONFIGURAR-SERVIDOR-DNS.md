# Como configurar o servidor DNS para enviar dados ao sistema

O sistema recebe dados dos seus servidores DNS através de **coletores** que rodam no próprio servidor e enviam as informações para a API (Cloudflare Worker). Segue o passo a passo.

---

## Visão geral

1. **No painel (admin)** você cadastra uma **empresa** e recebe uma **API Key**.
2. **No servidor DNS** você instala os scripts coletores e configura essa **API Key** e a **URL da API**.
3. Os coletores rodam em intervalos (cron) e enviam:
   - **Queries DNS** (consultas) → para o dashboard
   - **Métricas do sistema** (CPU, RAM, disco) → para a página Sistema
   - **Lista de bloqueio RPZ/ANATEL** → para a página RPZ

Sem o coletor instalado e configurado, o dashboard não terá dados.

---

## Passo 1: Cadastrar a empresa e obter a API Key

1. Acesse o **painel admin**: `https://seu-frontend.pages.dev/admin`
2. Faça login com o usuário/senha de **admin** (não é o login da empresa).
3. Clique em **Nova Empresa** e preencha:
   - Nome da empresa
   - Slug (ex: `minhaempresa`)
   - Nome do sistema (white label)
   - Servidores DNS (IPs dos seus servidores, separados por vírgula)
4. Ao salvar, a API devolve uma **API Key** (um UUID). **Copie e guarde** — é ela que você vai usar no servidor DNS.
5. (Opcional) Em **Usuários por empresa**, crie um usuário (e-mail + senha) para essa empresa acessar o painel em `/login` e ver só os dados dela.

---

## Passo 2: Escolher o tipo de servidor DNS

O projeto inclui coletores para **Unbound**. Se você usa **BIND9**, o fluxo é o mesmo (URL + API Key), mas o script de parsing de log pode precisar ser adaptado para o formato do BIND (ou use um log no formato esperado).

### Unbound (recomendado pelo instalador)

- Log de queries: ex. `/var/log/unbound/unbound.log`
- Lista de bloqueio: ex. `/etc/unbound/anablock.conf` (formato `local-zone: "dominio.com" redirect`)

### BIND9

- Log de queries: ex. `/var/log/named/queries.log`
- Zona RPZ: ex. `/etc/bind/zones/db.rpz.zone`

Se você usa BIND9, após instalar os scripts, edite o coletor de DNS para apontar para o log do BIND e, se necessário, use ou crie um parser para o formato do seu log (o `parse-unbound.py` é para Unbound).

---

## Passo 3: Instalar os coletores no servidor DNS

No **servidor onde está o DNS** (Linux), com acesso root:

### 3.1 Copiar os arquivos para o servidor

Na sua máquina (onde está o projeto):

```bash
scp -r cloudflare/collector root@IP_DO_SERVIDOR_DNS:/opt/dns-monitor/
```

Ou clone o repositório no servidor e use a pasta `cloudflare/collector/`.

### 3.2 Rodar o instalador

No servidor:

```bash
ssh root@IP_DO_SERVIDOR_DNS
cd /opt/dns-monitor
sudo bash install.sh
```

O instalador vai perguntar:

| Pergunta | Exemplo |
|----------|---------|
| **URL da API** | `https://dns-monitor-api.willian-fitzbr.workers.dev` |
| **API Key** | A chave que você copiou ao cadastrar a empresa no admin |
| **Caminho do log do Unbound** | `/var/log/unbound/unbound.log` |
| **Caminho do anablock.conf** | `/etc/unbound/anablock.conf` |

Ele vai:

- Instalar dependências (python3, curl, etc.)
- Copiar os scripts para `/opt/dns-monitor/`
- Configurar **API_URL** e **API_KEY** nos scripts
- Configurar o **cron**:
  - `collect-dns.sh` → a cada 1 minuto
  - `collect-system.sh` → a cada 1 minuto
  - `collect-rpz.sh` → a cada 6 horas

---

## Passo 4: Habilitar log de queries no Unbound

Para o coletor de DNS funcionar, o Unbound precisa gravar as consultas em um arquivo.

Edite `/etc/unbound/unbound.conf` (ou o arquivo de config que você usa) e adicione/ajuste:

```yaml
server:
  verbosity: 1
  log-queries: yes
  logfile: "/var/log/unbound/unbound.log"
  use-syslog: no
```

Crie o diretório e ajuste permissões:

```bash
sudo mkdir -p /var/log/unbound
sudo chown unbound:unbound /var/log/unbound   # ou o usuário do unbound
sudo systemctl restart unbound
```

---

## Passo 5: Testar manualmente

No servidor:

```bash
# Testar envio de queries DNS
/opt/dns-monitor/collect-dns.sh

# Testar métricas do sistema
/opt/dns-monitor/collect-system.sh

# Testar lista RPZ
/opt/dns-monitor/collect-rpz.sh
```

Veja se há erros. Log do coletor:

```bash
cat /opt/dns-monitor/collector.log
```

Se aparecer "Enviado com sucesso (HTTP 200)", os dados estão chegando na API.

---

## Passo 6: Acessar o painel por empresa

1. O **admin** cria um **usuário** para a empresa (e-mail + senha) em Admin → Usuários por empresa.
2. O usuário acessa: `https://seu-frontend.pages.dev/login`
3. Entra com **e-mail** e **senha** cadastrados.
4. Depois do login, vê apenas os dados da **empresa** daquele usuário (queries, RPZ, sistema, etc.).

Cada empresa tem seus próprios usuários e seus próprios dados; o admin gerencia empresas e usuários.

---

## Resumo do fluxo dos dados

```
Servidor DNS (Unbound/BIND)
    → log de queries + anablock/zone RPZ
    → collect-dns.sh / collect-rpz.sh (cron)
    → POST /ingest/dns e /ingest/rpz-list (com API Key)
    → Cloudflare Worker (API) → D1
    → Frontend (Pages) → dashboard por empresa (login por empresa)
```

**Métricas de sistema:**

```
Servidor DNS (CPU, RAM, disco, etc.)
    → collect-system.sh (cron)
    → POST /ingest/system (com API Key)
    → Worker → D1
    → Página Sistema no frontend
```

Se algo não aparecer no dashboard, confira: API Key correta, URL da API correta, cron rodando e log do coletor (`collector.log`).
