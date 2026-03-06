import { useState } from 'react';
import StatCard from '@/components/StatCard';
import DataState from '@/components/DataState';
import ApiStatus from '@/components/ApiStatus';
import { Search, CheckCircle, ShieldBan, ThumbsUp, XCircle, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useDnsStats, useDnsActivity, useQueryTypes, useTopDomains, useTopClients, isApiConfigured } from '@/services/api';

const timeFilters = ['1h', '3h', '6h', '12h', '24h'];
const pieColors = ['hsl(210,100%,56%)', 'hsl(224,50%,32%)', 'hsl(142,71%,45%)', 'hsl(38,92%,50%)', 'hsl(262,83%,58%)', 'hsl(330,81%,60%)', 'hsl(174,72%,40%)', 'hsl(0,84%,60%)', 'hsl(48,96%,53%)'];
const rankColors = ['bg-primary', 'bg-info', 'bg-success', 'bg-warning', 'bg-chart-purple'];

const DnsAnalyticsPage = () => {
  const [period, setPeriod] = useState('1h');
  const apiReady = isApiConfigured();

  const stats = useDnsStats(period);
  const activity = useDnsActivity(period);
  const queryTypes = useQueryTypes();
  const topDomains = useTopDomains();
  const topClients = useTopClients();

  const s = stats.data;

  return (
    <div className="space-y-6">
      <ApiStatus />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={<Search className="w-8 h-8 text-info" />} value={s?.totalQueries?.toLocaleString() || '0'} label="Total Consultas" badge="Hoje" badgeColor="green" />
        <StatCard icon={<CheckCircle className="w-8 h-8 text-success" />} value={s ? `${s.successRate}%` : '0%'} label="Taxa Sucesso" badge="24h" badgeColor="green" />
        <StatCard icon={<ShieldBan className="w-8 h-8 text-warning" />} value={s ? `${s.blockRate}%` : '0%'} label="Taxa Bloqueio" badge="Firewall" badgeColor="green" />
        <StatCard icon={<ThumbsUp className="w-8 h-8 text-success" />} value={s?.queriesOk?.toLocaleString() || '0'} label="Consultas OK" badge="Resolvidas" badgeColor="green" />
        <StatCard icon={<XCircle className="w-8 h-8 text-destructive" />} value={s?.queriesDenied?.toLocaleString() || '0'} label="Consultas Negadas" badge="Bloqueadas" badgeColor="red" />
        <StatCard icon={<Clock className="w-8 h-8 text-info" />} value={s?.queriesPerHour?.toLocaleString() || '0'} label="Consultas/Hora" badge="Média" badgeColor="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="section-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">📈 Atividade DNS</h2>
            <div className="flex gap-1">
              {timeFilters.map(f => (
                <button key={f} onClick={() => setPeriod(f)}
                  className={`px-3 py-1 text-xs rounded font-medium transition-colors ${period === f ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <DataState isLoading={activity.isLoading} isError={activity.isError} isEmpty={!activity.data?.length}
            icon={<Search className="w-12 h-12" />} emptyMessage="Aguardando dados do servidor DNS..."
            emptySubMessage="Configure seu servidor para começar a monitorar">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={activity.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="accepted" name="Consultas Aceitas" stroke="hsl(142,71%,45%)" fill="hsl(142,71%,45%,0.15)" strokeWidth={2} />
                <Area type="monotone" dataKey="denied" name="Consultas Negadas" stroke="hsl(0,84%,60%)" fill="hsl(0,84%,60%,0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </DataState>
        </div>

        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">🔵 Tipos de Consulta</h2>
          <DataState isLoading={queryTypes.isLoading} isError={queryTypes.isError} isEmpty={!queryTypes.data?.length}
            icon={<Search className="w-12 h-12" />} emptyMessage="Sem dados" height="h-[260px]">
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={queryTypes.data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90}>
                    {queryTypes.data?.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {queryTypes.data?.map((qt, i) => (
                  <span key={qt.name} className="flex items-center gap-1 text-xs">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                    {qt.name}
                  </span>
                ))}
              </div>
            </>
          </DataState>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">🌐 Top Domínios</h2>
          <DataState isLoading={topDomains.isLoading} isError={topDomains.isError} isEmpty={!topDomains.data?.length}
            icon={<Search className="w-12 h-12" />} emptyMessage="Nenhum domínio registrado" height="h-32">
            <div className="space-y-3">
              {topDomains.data?.map(d => (
                <div key={d.rank} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`rank-badge ${rankColors[(d.rank - 1) % rankColors.length]}`}>#{d.rank}</span>
                    <span className="font-medium text-sm">{d.label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{d.value.toLocaleString()} consultas</span>
                </div>
              ))}
            </div>
          </DataState>
        </div>
        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">👥 Top Clientes</h2>
          <DataState isLoading={topClients.isLoading} isError={topClients.isError} isEmpty={!topClients.data?.length}
            icon={<Search className="w-12 h-12" />} emptyMessage="Nenhum cliente registrado" height="h-32">
            <div className="space-y-3">
              {topClients.data?.map(c => (
                <div key={c.rank} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`rank-badge ${rankColors[(c.rank - 1) % rankColors.length]}`}>#{c.rank}</span>
                    <span className="font-medium text-sm">{c.label}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{c.value.toLocaleString()} consultas</span>
                </div>
              ))}
            </div>
          </DataState>
        </div>
      </div>
    </div>
  );
};

export default DnsAnalyticsPage;
