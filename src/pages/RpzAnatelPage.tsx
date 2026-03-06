import { useState } from 'react';
import StatCard from '@/components/StatCard';
import { Ban, AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const blockedData = [
  { time: '-60min', blocked: 0 },
  { time: '-55min', blocked: 1 },
  { time: '-50min', blocked: 0 },
  { time: '-45min', blocked: 2 },
  { time: '-40min', blocked: 9 },
  { time: '-35min', blocked: 5 },
  { time: '-30min', blocked: 4 },
  { time: '-25min', blocked: 3 },
  { time: '-20min', blocked: 2 },
  { time: '-15min', blocked: 1 },
  { time: '-10min', blocked: 5 },
  { time: 'Agora', blocked: 21 },
];

const categories = [
  { name: 'Apostas', value: 40, color: 'hsl(0,84%,60%)' },
  { name: 'Streaming/Pirataria', value: 30, color: 'hsl(25,95%,53%)' },
  { name: 'Malware/Tracking', value: 20, color: 'hsl(48,96%,53%)' },
  { name: 'Outros', value: 10, color: 'hsl(220,14%,80%)' },
];

const recentBlocked = [
  { domain: '001game3.one', time: '1 min atrás', category: 'Apostas' },
  { domain: 'mqtt.szbboys.com', time: '3 min atrás', category: 'Malware' },
  { domain: '0001444.com', time: '5 min atrás', category: 'Apostas' },
  { domain: 'bet365clone.xyz', time: '7 min atrás', category: 'Apostas' },
  { domain: 'pirateflix.io', time: '12 min atrás', category: 'Pirataria' },
];

const timeFilters = ['1h', '3h', '6h', '12h', '24h'];

const RpzAnatelPage = () => {
  const [activeTimeFilter, setActiveTimeFilter] = useState('1h');

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Ban className="w-8 h-8 text-destructive" />} value="86.686" label="Domínios Bloqueados" badge="Lista Ativa" badgeColor="blue" />
        <StatCard icon={<AlertTriangle className="w-8 h-8 text-warning" />} value="18" label="Tentativas Bloqueadas" badge="Últimas 24h" badgeColor="green" />
        <StatCard icon={<RefreshCw className="w-8 h-8 text-info" />} value="15/02/2026 16:40" label="Última Atualização" badge="Auto-Update" badgeColor="green" />
        <StatCard icon={<Database className="w-8 h-8 text-success" />} value="2.15 MB" label="Tamanho da Lista" badge="db.rpz.zone" badgeColor="green" />
      </div>

      {/* RPZ Status */}
      <div className="bg-primary rounded-lg overflow-hidden">
        <div className="px-6 py-3 flex items-center gap-2">
          <span className="text-primary-foreground font-semibold">✅ Status do Sistema RPZ</span>
        </div>
        <div className="bg-card grid grid-cols-2 lg:grid-cols-4 gap-4 p-6">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-success/10 text-success rounded-full text-sm font-semibold mb-1">✅ Ativo</span>
            <p className="text-xs text-muted-foreground">Status da Zona</p>
          </div>
          <div className="text-center">
            <p className="text-info font-semibold">2026021501</p>
            <p className="text-xs text-muted-foreground">Serial da Zona</p>
          </div>
          <div className="text-center">
            <p className="text-info font-semibold">15/02/2026 16:40:13</p>
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="section-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">📈 Tentativas de Acesso Bloqueadas</h2>
            <div className="flex gap-1">
              {timeFilters.map(f => (
                <button
                  key={f}
                  onClick={() => setActiveTimeFilter(f)}
                  className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                    activeTimeFilter === f ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={blockedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="blocked" name="Tentativas Bloqueadas" stroke="hsl(0,84%,60%)" fill="hsl(0,84%,60%,0.15)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4">🔵 Categorias Bloqueadas</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categories} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90}>
                {categories.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {categories.map(c => (
              <span key={c.name} className="flex items-center gap-1 text-xs">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c.color }} />
                {c.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Blocked */}
      <div className="section-card">
        <h2 className="text-lg font-semibold mb-4">🌐 Domínios Bloqueados Recentes</h2>
        <div className="space-y-3">
          {recentBlocked.map((d, i) => (
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
      </div>
    </div>
  );
};

export default RpzAnatelPage;
