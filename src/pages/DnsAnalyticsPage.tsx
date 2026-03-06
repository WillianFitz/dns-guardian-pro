import { useState } from 'react';
import StatCard from '@/components/StatCard';
import { Search, CheckCircle, ShieldBan, ThumbsUp, XCircle, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const timeFilters = ['1h', '3h', '6h', '12h', '24h'];

const emptyChartColors = [
  'hsl(210,100%,56%)', 'hsl(224,50%,32%)', 'hsl(142,71%,45%)',
  'hsl(38,92%,50%)', 'hsl(262,83%,58%)', 'hsl(330,81%,60%)',
];

const DnsAnalyticsPage = () => {
  const [activeTimeFilter, setActiveTimeFilter] = useState('1h');

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={<Search className="w-8 h-8 text-info" />} value="0" label="Total Consultas" badge="Hoje" badgeColor="green" />
        <StatCard icon={<CheckCircle className="w-8 h-8 text-success" />} value="0%" label="Taxa Sucesso" badge="24h" badgeColor="green" />
        <StatCard icon={<ShieldBan className="w-8 h-8 text-warning" />} value="0%" label="Taxa Bloqueio" badge="Firewall" badgeColor="green" />
        <StatCard icon={<ThumbsUp className="w-8 h-8 text-success" />} value="0" label="Consultas OK" badge="Resolvidas" badgeColor="green" />
        <StatCard icon={<XCircle className="w-8 h-8 text-destructive" />} value="0" label="Consultas Negadas" badge="Bloqueadas" badgeColor="red" />
        <StatCard icon={<Clock className="w-8 h-8 text-info" />} value="0" label="Consultas/Hora" badge="Média" badgeColor="blue" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <Search className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aguardando dados do servidor DNS...</p>
              <p className="text-xs mt-1 opacity-60">Configure seu servidor para começar a monitorar</p>
            </div>
          </div>
        </div>

        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">🔵 Tipos de Consulta</h2>
          <div className="flex items-center justify-center h-[260px] text-muted-foreground">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-3 rounded-full border-4 border-dashed border-muted flex items-center justify-center">
                <span className="text-2xl opacity-30">0</span>
              </div>
              <p className="text-sm">Sem dados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Domains & Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">🌐 Top Domínios</h2>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p className="text-sm">Nenhum domínio registrado</p>
          </div>
        </div>
        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">👥 Top Clientes</h2>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p className="text-sm">Nenhum cliente registrado</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DnsAnalyticsPage;
