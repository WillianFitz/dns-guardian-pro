import { FormEvent, useState } from 'react';
import { Plus, Pencil, Trash2, Building2, Server, Palette, Lock, User as UserIcon, AlertCircle, Users } from 'lucide-react';
import { useCompanies, createCompanyApi, updateCompanyApi, deleteCompanyApi, useUsers, createUserApi, deleteUserApi, type CompanyData, type UserData, isApiConfigured } from '@/services/api';
import { useBranding } from '@/contexts/BrandingContext';
import { getAdminUser, getAdminSecret } from '@/lib/config';

const AdminPage = () => {
  const { setIsAdmin } = useBranding();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('dns_admin_logged') === '1';
  });
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const { data: companies = [], isLoading, error, refetch } = useCompanies();
  const [userFilterCompany, setUserFilterCompany] = useState<string>('');
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useUsers(userFilterCompany || undefined);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({ email: '', password: '', companySlug: '', name: '' });
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const [savingUser, setSavingUser] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [lastApiKey, setLastApiKey] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    systemName: '',
    dnsServers: '',
    logoUrl: '',
  });

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (loginUser !== getAdminUser() || loginPass !== getAdminSecret()) {
      setLoginError('Usuário ou senha inválidos.');
      return;
    }
    setLoginError(null);
    setIsAuthenticated(true);
    setIsAdmin(true);
    localStorage.setItem('dns_admin_logged', '1');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    localStorage.removeItem('dns_admin_logged');
  };

  const resetForm = () => {
    setForm({ name: '', slug: '', systemName: '', dnsServers: '', logoUrl: '' });
    setEditingId(null);
    setShowForm(false);
    setFormError(null);
  };

  const openNewForm = () => {
    setLastApiKey(null);
    setEditingId(null);
    setForm({ name: '', slug: '', systemName: '', dnsServers: '', logoUrl: '' });
    setShowForm(true);
  };

  const handleEdit = (company: CompanyData) => {
    setLastApiKey(null);
    setEditingId(company.id);
    setForm({
      name: company.name,
      slug: company.slug,
      systemName: company.systemName,
      dnsServers: company.dnsServers.join(', '),
      logoUrl: company.logoUrl || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug || !form.systemName) {
      setFormError('Preencha nome, slug e nome do sistema.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        systemName: form.systemName,
        logoUrl: form.logoUrl || null,
        dnsServers: form.dnsServers.split(',').map(s => s.trim()).filter(Boolean),
        active: true,
      };
      if (editingId) {
        await updateCompanyApi(editingId, payload);
        setLastApiKey(null);
      } else {
        const res = await createCompanyApi(payload);
        setLastApiKey(res.apiKey);
      }
      await refetch();
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar empresa.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;
    try {
      await deleteCompanyApi(id);
      await refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (company: CompanyData) => {
    try {
      await updateCompanyApi(company.id, { ...company, active: !company.active });
      await refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setUserFormError(null);
    if (!userForm.email.trim() || !userForm.password || !userForm.companySlug) {
      setUserFormError('Preencha e-mail, senha e empresa.');
      return;
    }
    setSavingUser(true);
    try {
      await createUserApi({
        email: userForm.email.trim().toLowerCase(),
        password: userForm.password,
        companySlug: userForm.companySlug,
        name: userForm.name.trim() || undefined,
      });
      setUserForm({ email: '', password: '', companySlug: '', name: '' });
      setShowUserForm(false);
      await refetchUsers();
    } catch (err: any) {
      setUserFormError(err.message || 'Erro ao criar usuário.');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Excluir este usuário? Ele não poderá mais acessar o painel.')) return;
    try {
      await deleteUserApi(id);
      await refetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-sm section-card space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Login do Painel Admin</h2>
            <p className="text-xs text-muted-foreground">
              Acesse com o usuário e senha configurados nas variáveis
              <code className="mx-1 bg-muted px-1 py-0.5 rounded text-[10px] font-mono">VITE_ADMIN_USER</code>
              e
              <code className="ml-1 bg-muted px-1 py-0.5 rounded text-[10px] font-mono">VITE_ADMIN_SECRET</code>.
            </p>
          </div>

          {!isApiConfigured() && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <div>
                <strong>API não configurada.</strong>
                <div>Defina a variável <code className="bg-muted px-1 rounded font-mono">VITE_API_URL</code> no arquivo <code className="bg-muted px-1 rounded font-mono">.env</code>.</div>
              </div>
            </div>
          )}

          {loginError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <UserIcon className="w-3.5 h-3.5" />
                Usuário
              </label>
              <input
                value={loginUser}
                onChange={e => setLoginUser(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="admin"
              />
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Lock className="w-3.5 h-3.5" />
                Senha
              </label>
              <input
                type="password"
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" />
          Painel Administrativo - Empresas
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={openNewForm}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Nova Empresa
          </button>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="section-card border-2 border-info/20 bg-info/5">
        <h3 className="text-sm font-semibold text-info mb-2">⚙️ Configuração da API</h3>
        <p className="text-xs text-muted-foreground mb-2">
          Configure a variável de ambiente <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">VITE_API_URL</code> no seu <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">.env</code> com a URL do seu Cloudflare Worker:
        </p>
        <code className="block bg-foreground/5 p-2 rounded text-xs font-mono mb-2">
          VITE_API_URL=https://dns-monitor-api.seu-dominio.workers.dev
        </code>
        <p className="text-xs text-muted-foreground">
          O acesso ao painel admin usa as variáveis{' '}
          <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">VITE_ADMIN_USER</code> e{' '}
          <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">VITE_ADMIN_SECRET</code>. Use a mesma senha também na
          variável <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">ADMIN_SECRET</code> do Worker.
        </p>
      </div>

      {showForm && (
        <div className="section-card border-2 border-primary/20 space-y-4">
          <h3 className="text-lg font-semibold">
            {editingId ? '✏️ Editar Empresa' : '➕ Cadastrar Nova Empresa'}
          </h3>

          {formError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">Nome da Empresa</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="Ex: Teleriza Telecom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">Slug (URL)</label>
              <input
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="Ex: teleriza"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground flex items-center gap-1">
                <Palette className="w-3.5 h-3.5" /> Nome do Sistema (White Label)
              </label>
              <input
                value={form.systemName}
                onChange={e => setForm(f => ({ ...f, systemName: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="Ex: Teleriza DNS Monitor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">URL da Logo</label>
              <input
                value={form.logoUrl}
                onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="https://exemplo.com/logo.png"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-muted-foreground flex items-center gap-1">
                <Server className="w-3.5 h-3.5" /> Servidores DNS (separados por vírgula)
              </label>
              <input
                value={form.dnsServers}
                onChange={e => setForm(f => ({ ...f, dnsServers: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="Ex: 170.245.94.203, 170.245.94.204"
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-2">
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary text-primary-foreground px-5 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Cadastrar'}
              </button>
              <button
                onClick={resetForm}
                type="button"
                className="px-5 py-2 rounded-lg font-medium bg-muted hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
            </div>
            {lastApiKey && (
              <div className="text-xs bg-muted rounded-md px-3 py-2 md:max-w-sm">
                <strong className="block mb-1">API Key gerada para o coletor:</strong>
                <code className="break-all font-mono">{lastApiKey}</code>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="section-card">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Carregando empresas...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span>Erro ao carregar empresas. Verifique a URL da API e o ADMIN_SECRET no Worker.</span>
          </div>
        ) : companies.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center">
              <Building2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma empresa cadastrada</p>
              <p className="text-xs mt-1 opacity-60">Clique em "Nova Empresa" para começar</p>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-semibold text-muted-foreground">Empresa</th>
                <th className="pb-3 font-semibold text-muted-foreground">Nome do Sistema</th>
                <th className="pb-3 font-semibold text-muted-foreground">Servidores DNS</th>
                <th className="pb-3 font-semibold text-muted-foreground">Status</th>
                <th className="pb-3 font-semibold text-muted-foreground">Criado em</th>
                <th className="pb-3 font-semibold text-muted-foreground text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(c => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {c.logoUrl && (
                        <img src={c.logoUrl} alt="" className="w-6 h-6 rounded object-contain" />
                      )}
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">/{c.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">{c.systemName}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.dnsServers.map(s => (
                        <span key={s} className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => toggleActive(c)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        c.active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {c.active ? '✅ Ativo' : '❌ Inativo'}
                    </button>
                  </td>
                  <td className="py-3 text-muted-foreground">{c.createdAt}</td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEdit(c)} className="p-1.5 rounded hover:bg-muted transition-colors">
                        <Pencil className="w-4 h-4 text-info" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded hover:bg-muted transition-colors">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Usuários por empresa */}
      <div className="section-card">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          Usuários por empresa
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Cada empresa pode ter um ou mais usuários. Eles acessam o painel em /login com e-mail e senha e veem apenas os dados da própria empresa.
        </p>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select
            value={userFilterCompany}
            onChange={e => setUserFilterCompany(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-background"
          >
            <option value="">Todas as empresas</option>
            {companies.map(c => (
              <option key={c.id} value={c.slug}>{c.name} ({c.slug})</option>
            ))}
          </select>
          <button
            onClick={() => { setShowUserForm(true); setUserFormError(null); setUserForm({ email: '', password: '', companySlug: userForm.companySlug || (companies[0]?.slug ?? ''), name: '' }); }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Novo usuário
          </button>
        </div>
        {showUserForm && (
          <form onSubmit={handleCreateUser} className="mb-4 p-4 border rounded-lg bg-muted/30 space-y-3">
            {userFormError && (
              <div className="text-sm text-destructive">{userFormError}</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="email"
                value={userForm.email}
                onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))}
                placeholder="E-mail"
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="password"
                value={userForm.password}
                onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Senha"
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <select
                value={userForm.companySlug}
                onChange={e => setUserForm(f => ({ ...f, companySlug: e.target.value }))}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Selecione a empresa</option>
                {companies.map(c => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
              <input
                value={userForm.name}
                onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nome (opcional)"
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={savingUser} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm disabled:opacity-60">
                {savingUser ? 'Salvando...' : 'Criar usuário'}
              </button>
              <button type="button" onClick={() => setShowUserForm(false)} className="px-4 py-2 rounded-lg text-sm bg-muted hover:bg-accent">
                Cancelar
              </button>
            </div>
          </form>
        )}
        {usersLoading ? (
          <p className="text-sm text-muted-foreground">Carregando usuários...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado. Crie um para a empresa acessar o painel com login.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-semibold text-muted-foreground">E-mail</th>
                <th className="pb-2 font-semibold text-muted-foreground">Nome</th>
                <th className="pb-2 font-semibold text-muted-foreground">Empresa</th>
                <th className="pb-2 font-semibold text-muted-foreground">Perfil</th>
                <th className="pb-2 font-semibold text-muted-foreground text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: UserData) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="py-2">{u.email}</td>
                  <td className="py-2">{u.name || '—'}</td>
                  <td className="py-2">{u.companySlug}</td>
                  <td className="py-2">{u.role}</td>
                  <td className="py-2 text-right">
                    <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 rounded hover:bg-muted text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
