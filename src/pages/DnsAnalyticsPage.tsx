import { useState } from 'react';
import StatCard from '@/components/StatCard';
import { Search, CheckCircle, ShieldBan, ThumbsUp, XCircle, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const dnsActivityData = [
  { time: '-60min', accepted: 2000, denied: 10 },
  { time: '-55min', accepted: 2200, denied: 5 },
  { time: '-50min', accepted: 2100, denied: 8 },
  { time: '-45min', accepted: 3000, denied: 12 },
  { time: '-40min', accepted: 5000, denied: 15 },
  { time: '-35min', accepted: 8000, denied: 20 },
  { time: '-30min', accepted: 12000, denied: 18 },
  { time: '-25min', accepted: 18000, denied: 25 },
  { time: '-20min', accepted: 25000, denied: 30 },
  { time: '-15min', accepted: 35000, denied: 45 },
  { time: '-10min', accepted: 50000, denied: 60 },
  { time: 'Agora', accepted: 75000, denied: 80 },
];

const queryTypes = [
  { name: 'A', value: 45, color: 'hsl(210,100%,56%)' },
  { name: 'AAAA', value: 20, color: 'hsl(224,50%,32%)' },
  { name: 'HTTPS', value: 15, color: 'hsl(142,71%,45%)' },
  { name: 'PTR', value: 8, color: 'hsl(38,92%,50%)' },
  { name: 'SVCB', value: 4, color: 'hsl(262,83%,58%)' },
  { name: 'SRV', value: 3, color: 'hsl(330,81%,60%)' },
  { name: 'SOA', value: 2, color: 'hsl(174,72%,40%)' },
  { name: 'TXT', value: 2, color: 'hsl(0,84%,60%)' },
  { name: 'CNAME', value: 1, color: 'hsl(48,96%,53%)' },
];

const topDomains = [
  { rank: 1, domain: 'a.root-servers.net', queries: 23861 },
  { rank: 2, domain: 'www.google.com', queries: 3660 },
  { rank: 3, domain: 'dns.google', queries: 2890 },
  { rank: 4, domain: 'facebook.com', queries: 2100 },
  { rank: 5, domain: 'api.whatsapp.com', queries: 1850 },
];

const topClients = [
  { rank: 1, ip: '100.64.1.134', queries: 5740 },
  { rank: 2, ip: '100.64.1.48', queries: 2834 },
  { rank: 3, ip: '100.64.1.129', queries: 2344 },
  { rank: 4, ip: '100.64.1.150', queries: 1920 },
  { rank: 5, ip: '100.64.1.87', queries: 1455 },
];

const timeFilters = ['1h', '3h', '6h', '12h', '24h'];

const rankColors = ['bg-primary', 'bg-info', 'bg-success', 'bg-warning', 'bg-chart-purple'];

const DnsAnalyticsPage = () => {
  const [activeTimeFilter, setActiveTimeFilter] = useState('1h');

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={<Search className="w-8 h-8 text-info" />} value="156.778" label="Total Consultas" badge="Hoje" badgeColor="green" />
        <StatCard icon={<CheckCircle className="w-8 h-8 text-success" />} value="100%" label="Taxa Sucesso" badge="24h" badgeColor="green" />
        <StatCard icon={<ShieldBan className="w-8 h-8 text-warning" />} value="0.03%" label="Taxa Bloqueio" badge="Firewall" badgeColor="green" />
        <StatCard icon={<ThumbsUp className="w-8 h-8 text-success" />} value="156.778" label="Consultas OK" badge="Resolvidas" badgeColor="green" />
        <StatCard icon={<XCircle className="w-8 h-8 text-destructive" />} value="42" label="Consultas Negadas" badge="Bloqueadas" badgeColor="red" />
        <StatCard icon={<Clock className="w-8 h-8 text-info" />} value="6.532" label="Consultas/Hora" badge="Média" badgeColor="blue" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DNS Activity */}
        <div className="section-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">📈 Atividade DNS</h2>
            <div className="flex gap-1">
              {timeFilters.map(f => (
                <button
                  key={f}
                  onClick={() => setActiveTimeFilter(f)}
                  className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                    activeTimeFilter === f
                      ? 'bg-success text-success-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dnsActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="accepted" name="Consultas Aceitas" stroke="hsl(142,71%,45%)" fill="hsl(142,71%,45%,0.15)" strokeWidth={2} />
              <Area type="monotone" dataKey="denied" name="Consultas Negadas" stroke="hsl(0,84%,60%)" fill="hsl(0,84%,60%,0.15)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Query Types */}
        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">🔵 Tipos de Consulta</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={queryTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90}>
                {queryTypes.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {queryTypes.map(qt => (
              <span key={qt.name} className="flex items-center gap-1 text-xs">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: qt.color }} />
                {qt.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Top Domains & Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">🌐 Top Domínios</h2>
          <div className="space-y-3">
            {topDomains.map(d => (
              <div key={d.rank} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`rank-badge ${rankColors[d.rank - 1]}`}>#{d.rank}</span>
                  <span className="font-medium text-sm">{d.domain}</span>
                </div>
                <span className="text-sm text-muted-foreground">{d.queries.toLocaleString()} consultas</span>
              </div>
            ))}
          </div>
        </div>
        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">👥 Top Clientes</h2>
          <div className="space-y-3">
            {topClients.map(c => (
              <div key={c.rank} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`rank-badge ${rankColors[c.rank - 1]}`}>#{c.rank}</span>
                  <span className="font-medium text-sm">{c.ip}</span>
                </div>
                <span className="text-sm text-muted-foreground">{c.queries.toLocaleString()} consultas</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DnsAnalyticsPage;
