import { useState } from 'react';
import StatCard from '@/components/StatCard';
import DataState from '@/components/DataState';
import { Ban, AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useRpzStats, useRpzStatus, useBlockedActivity, useBlockedCategories, useRecentBlocked } from '@/services/api';

const timeFilters = ['1h', '3h', '6h', '12h', '24h'];
const catColors = ['hsl(0,84%,60%)', 'hsl(25,95%,53%)', 'hsl(48,96%,53%)', 'hsl(220,14%,80%)', 'hsl(262,83%,58%)'];

function formatUtcToLocal(dateStr?: string) {
  if (!dateStr) return '--';
  const iso = dateStr.replace(' ', 'T') + 'Z';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

const RpzAnatelPage = () => {
  const [period, setPeriod] = useState('1h');
  const stats = useRpzStats();
  const status = useRpzStatus();
  const activity = useBlockedActivity(period);
  const categories = useBlockedCategories();
  const recent = useRecentBlocked();

  const s = stats.data;
  const st = status.data;

  // Ajustar exibição de horário para o fuso local do navegador
  const activityData = activity.data?.map(p => {
    const iso = p.time.replace(' ', 'T') + 'Z';
    const d = new Date(iso);
    const label = isNaN(d.getTime())
      ? p.time
      : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return { ...p, timeLabel: label };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Ban className="w-8 h-8 text-destructive" />} value={s?.blockedDomains?.toLocaleString() || '0'} label="Domínios Bloqueados" badge="Lista Ativa" badgeColor="blue" />
        <StatCard icon={<AlertTriangle className="w-8 h-8 text-warning" />} value={s?.blockedAttempts?.toLocaleString() || '0'} label="Tentativas Bloqueadas" badge="Últimas 24h" badgeColor="green" />
        <StatCard icon={<RefreshCw className="w-8 h-8 text-info" />} value={formatUtcToLocal(s?.lastUpdate)} label="Última Atualização" badge="Auto-Update" badgeColor="green" />
        <StatCard icon={<Database className="w-8 h-8 text-success" />} value={s?.listSize || '0 MB'} label="Tamanho da Lista" badge="db.rpz.zone" badgeColor="green" />
      </div>

      <div className="bg-primary rounded-lg overflow-hidden">
        <div className="px-6 py-3 flex items-center gap-2">
          <span className="text-primary-foreground font-semibold">
            {st?.zoneStatus === 'active' ? '✅' : '⏳'} Status do Sistema RPZ
          </span>
        </div>
        <div className="bg-card grid grid-cols-2 lg:grid-cols-4 gap-4 p-6">
          <div className="text-center">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-1 ${
              st?.zoneStatus === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
            }`}>
              {st?.zoneStatus === 'active' ? '✅ Ativo' : '⏳ Aguardando'}
            </span>
            <p className="text-xs text-muted-foreground">Status da Zona</p>
          </div>
          <div className="text-center">
            <p className="text-info font-semibold">{st?.zoneSerial || '--'}</p>
            <p className="text-xs text-muted-foreground">Serial da Zona</p>
          </div>
          <div className="text-center">
            <p className="text-info font-semibold">{formatUtcToLocal(st?.lastSync)}</p>
            <p className="text-xs text-muted-foreground">Última Sync</p>
          </div>
          <div className="text-center">
            <button className="px-4 py-1.5 border rounded-md text-sm font-medium hover:bg-muted transition-colors">
              🔄 Atualizar Agora
            </button>
            <p className="text-xs text-muted-foreground mt-1">Forçar Update</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="section-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">📈 Tentativas de Acesso Bloqueadas</h2>
            <div className="flex gap-1">
              {timeFilters.map(f => (
                <button key={f} onClick={() => setPeriod(f)}
                  className={`px-3 py-1 text-xs rounded font-medium transition-colors ${period === f ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <DataState isLoading={activity.isLoading} isError={activity.isError} isEmpty={!activity.data?.length}
            icon={<Ban className="w-12 h-12" />} emptyMessage="Aguardando dados RPZ..." emptySubMessage="Configure a zona RPZ no servidor DNS">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="timeLabel" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip /><Legend />
                <Area type="monotone" dataKey="blocked" name="Tentativas Bloqueadas" stroke="hsl(0,84%,60%)" fill="hsl(0,84%,60%,0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </DataState>
        </div>

        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4">🔵 Categorias Bloqueadas</h2>
          <DataState isLoading={categories.isLoading} isError={categories.isError} isEmpty={!categories.data?.length}
            icon={<Ban className="w-12 h-12" />} emptyMessage="Sem dados" height="h-[260px]">
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categories.data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90}>
                    {categories.data?.map((_, i) => <Cell key={i} fill={catColors[i % catColors.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {categories.data?.map((c, i) => (
                  <span key={c.name} className="flex items-center gap-1 text-xs">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: catColors[i % catColors.length] }} />{c.name}
                  </span>
                ))}
              </div>
            </>
          </DataState>
        </div>
      </div>

      <div className="section-card">
        <h2 className="text-lg font-semibold mb-4">🌐 Domínios Bloqueados Recentes</h2>
        <DataState isLoading={recent.isLoading} isError={recent.isError} isEmpty={!recent.data?.length}
          icon={<Ban className="w-12 h-12" />} emptyMessage="Nenhum domínio bloqueado registrado" height="h-32">
          <div className="space-y-3">
            {recent.data?.map((d, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <span className="rank-badge bg-destructive">#{i + 1}</span>
                  <div>
                    <span className="font-medium text-sm">{d.domain}</span>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning">{d.category}</span>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{d.time}</span>
              </div>
            ))}
          </div>
        </DataState>
      </div>
    </div>
  );
};

export default RpzAnatelPage;
