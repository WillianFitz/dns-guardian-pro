# Como atualizar o DNS Guardian (Worker + Pages)

Configuração atual:
- **API (Worker):** https://dns-monitor-api.willian-fitzbr.workers.dev
- **Frontend (Pages):** https://1886d93a.dns-monitor-frontend.pages.dev
- **Admin:** usuário `admin` / senha configurada no `.env`

---

## Atualizar só o Worker (API)

Quando você alterar arquivos em `cloudflare/` (ex: `cloudflare/src/index.ts`):

```bash
npm run deploy:worker
```

Ou manualmente:

```bash
cd cloudflare
wrangler deploy
cd ..
```

---

## Atualizar só o Frontend (Pages)

Quando você alterar arquivos em `src/` (React, páginas, componentes):

```bash
npm run deploy:pages
```

Isso faz o build e envia a pasta `dist/` para o projeto **dns-monitor-frontend** no Cloudflare Pages.

---

## Atualizar os dois (Worker + Pages)

Depois de mudar backend e frontend:

```bash
npm run deploy:all
```

---

## Pré-requisito

- **Wrangler** instalado e logado: `npm install -g wrangler` e `wrangler login`
- Na pasta do projeto: `npm install` já executado

## Login no Admin

1. Acesse: https://1886d93a.dns-monitor-frontend.pages.dev/admin
2. Usuário: **admin**
3. Senha: a definida em `VITE_ADMIN_SECRET` no `.env` (atualmente **Sudo@0412**)
