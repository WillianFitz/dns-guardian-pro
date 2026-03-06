import { useState } from 'react';
import { useBranding, type Company } from '@/contexts/BrandingContext';
import { Plus, Pencil, Trash2, Building2, Server, Palette } from 'lucide-react';

const AdminPage = () => {
  const { companies, setCompanies } = useBranding();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    systemName: '',
    dnsServers: '',
  });

  const handleAdd = () => {
    const newCompany: Company = {
      id: Date.now().toString(),
      name: form.name,
      slug: form.slug,
      branding: { systemName: form.systemName, logoUrl: null },
      dnsServers: form.dnsServers.split(',').map(s => s.trim()),
      active: true,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCompanies(prev => [...prev, newCompany]);
    resetForm();
  };

  const handleEdit = (company: Company) => {
    setEditingId(company.id);
    setForm({
      name: company.name,
      slug: company.slug,
      systemName: company.branding.systemName,
      dnsServers: company.dnsServers.join(', '),
    });
    setShowForm(true);
  };

  const handleUpdate = () => {
    setCompanies(prev =>
      prev.map(c =>
        c.id === editingId
          ? {
              ...c,
              name: form.name,
              slug: form.slug,
              branding: { ...c.branding, systemName: form.systemName },
              dnsServers: form.dnsServers.split(',').map(s => s.trim()),
            }
          : c
      )
    );
    resetForm();
  };

  const handleDelete = (id: string) => {
    setCompanies(prev => prev.filter(c => c.id !== id));
  };

  const toggleActive = (id: string) => {
    setCompanies(prev => prev.map(c => (c.id === id ? { ...c, active: !c.active } : c)));
  };

  const resetForm = () => {
    setForm({ name: '', slug: '', systemName: '', dnsServers: '' });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" />
          Painel Administrativo - Empresas
        </h2>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', slug: '', systemName: '', dnsServers: '' }); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Nova Empresa
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="section-card border-2 border-primary/20">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? '✏️ Editar Empresa' : '➕ Cadastrar Nova Empresa'}
          </h3>
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
          <div className="flex gap-2 mt-4">
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              className="bg-primary text-primary-foreground px-5 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              {editingId ? 'Atualizar' : 'Cadastrar'}
            </button>
            <button onClick={resetForm} className="px-5 py-2 rounded-lg font-medium bg-muted hover:bg-accent transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Companies List */}
      <div className="section-card">
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
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">/{c.slug}</p>
                  </div>
                </td>
                <td className="py-3">{c.branding.systemName}</td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {c.dnsServers.map(s => (
                      <span key={s} className="text-xs bg-muted px-2 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                </td>
                <td className="py-3">
                  <button
                    onClick={() => toggleActive(c.id)}
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
      </div>
    </div>
  );
};

export default AdminPage;
