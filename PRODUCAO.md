# DNS Guardian – Modo Produção (passo a passo)

Siga **na ordem**. Se algo falhar, pare e confira o passo.

---

## 1. Worker (API) no ar

No servidor ou no PC onde você faz deploy:

```bash
cd ~/dns-guardian-pro/cloudflare
cat wrangler.toml
```

Confirme que está assim (ajuste se o domínio for outro):

- `FRONTEND_URL` = URL do seu front (ex: `https://dns-monitor-frontend.pages.dev`)
- `ADMIN_SECRET` = `Sudo@0412` (ou a senha que você usa no admin)
- `database_id` = o ID do seu banco D1

Deploy do Worker:

```bash
cd ~/dns-guardian-pro
npm run deploy:worker
```

Até aparecer algo como: `Deployed dns-monitor-api` e a URL do Worker.

Teste a API no navegador:

- Abra: `https://dns-monitor-api.willian-fitzbr.workers.dev/`
- Não precisa retornar página bonita; o importante é **não** dar erro de conexão.

---

## 2. Banco D1 com tabelas

Se ainda não rodou o schema:

```bash
cd ~/dns-guardian-pro/cloudflare
wrangler d1 execute dns-monitor --file=schema.sql --remote
```

Se der erro de “table already exists”, pode ignorar (tabelas já existem).

---

## 3. Frontend (Pages) em produção

### Opção A – Deploy manual (recomendado para “nada funciona”)

No **mesmo projeto** (raiz do repositório):

```bash
cd ~/dns-guardian-pro
npm install
npm run build
npm run deploy:pages
```

Use o **mesmo** projeto Pages que você já usa (ex: `dns-monitor-frontend`). O comando acima envia a pasta `dist/` para esse projeto.

### Opção B – Deploy pelo Git

```bash
cd ~/dns-guardian-pro
git add .
git status
git commit -m "Producao: config padrao e build"
git push origin main
```

Depois, no Cloudflare: **Workers & Pages** → **dns-monitor-frontend** → **Deployments** e espere o deploy do branch `main` terminar.

---

## 4. Conferir depois do deploy

1. **Página inicial**
   - Abra: `https://dns-monitor-frontend.pages.dev/` (ou seu domínio).
   - Deve abrir a tela de **login** (e-mail/senha da empresa), não erro nem tela em branco.

2. **Admin**
   - Abra: `https://dns-monitor-frontend.pages.dev/admin`
   - Login: usuário **admin**, senha **Sudo@0412** (ou a que está no Worker).
   - Depois do login deve aparecer **Painel Administrativo – Empresas** e **não** “Erro ao carregar empresas”.

3. **Se ainda der “Erro ao carregar empresas”**
   - Abra **F12** → aba **Rede (Network)**.
   - Recarregue a página do admin.
   - Clique na requisição que vai para `dns-monitor-api.../admin/companies`:
     - **Status 401** → senha diferente entre front e Worker: no `wrangler.toml` a variável `ADMIN_SECRET` tem que ser **exatamente** a mesma usada no login do admin (hoje no código está `Sudo@0412`).
     - **Status 0 / CORS / falha** → Worker fora do ar ou URL errada; confira a URL no Worker e no código (ver passo 5).

---

## 5. Onde a URL e a senha estão no frontend

Para funcionar em **produção sem variáveis de ambiente**, o projeto está assim:

- **URL da API e senha do admin** vêm (nesta ordem):
  1. `window.__APP_CONFIG__` no **index.html**
  2. Arquivo **public/config.json**
  3. Variáveis de build **VITE_API_URL** e **VITE_ADMIN_SECRET**
  4. **Valores padrão no código** em `src/lib/config.ts` (URL do Worker e `Sudo@0412`)

Ou seja: mesmo que o build do Pages não tenha variáveis de ambiente, a API e o admin devem funcionar com esses padrões.

Se você **mudar** a URL do Worker ou a senha do admin:

- Ajuste no **Worker**: `cloudflare/wrangler.toml` → `ADMIN_SECRET` e depois `npm run deploy:worker`.
- Ajuste no **front**: em `src/lib/config.ts` altere `DEFAULT_API_URL` e `DEFAULT_ADMIN_SECRET` (e, se quiser, o objeto no `index.html` e o `config.json`), faça **novo build** e **novo deploy** do Pages.

---

## 6. Resumo rápido

| O quê              | Onde / Comando |
|--------------------|----------------|
| Subir API          | `npm run deploy:worker` (na raiz do projeto) |
| Criar tabelas D1   | `wrangler d1 execute dns-monitor --file=schema.sql --remote` (em `cloudflare/`) |
| Subir front        | `npm run build` e `npm run deploy:pages` (na raiz) |
| Login admin        | `/admin` → usuário **admin**, senha igual a `ADMIN_SECRET` do Worker |
| Login empresa      | `/login` → e-mail/senha criados no admin para cada empresa |

Se seguir esses passos e ainda “nada funcionar”, diga em qual passo parou e qual mensagem de erro aparece (na tela ou no F12 → Rede/Console).
