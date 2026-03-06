import StatCard from '@/components/StatCard';
import { AlertTriangle, ShieldBan, Eye, ShieldCheck } from 'lucide-react';

const securityEvents = [
  { description: '4 bloqueio(s) RPZ - 001game3.one', ip: 'Cliente DNS', time: '1 min atrás', severity: 'Alta' },
  { description: '5 bloqueio(s) RPZ - mqtt.szbboys.com', ip: 'Cliente DNS', time: '3 min atrás', severity: 'Alta' },
  { description: '12 bloqueio(s) RPZ - 0001444.com', ip: 'Cliente DNS', time: '5 min atrás', severity: 'Alta' },
  { description: '2 bloqueio(s) RPZ - betfake.org', ip: 'Cliente DNS', time: '7 min atrás', severity: 'Alta' },
  { description: '8 bloqueio(s) RPZ - piratestream.tv', ip: 'Cliente DNS', time: '15 min atrás', severity: 'Média' },
];

const topBlockedIps = [
  { rank: 1, ip: '100.64.1.134', attempts: 5740, lastActivity: '5 min atrás' },
  { rank: 2, ip: '100.64.1.48', attempts: 2834, lastActivity: '22 min atrás' },
  { rank: 3, ip: '100.64.1.129', attempts: 2344, lastActivity: '8 min atrás' },
  { rank: 4, ip: '100.64.1.150', attempts: 1920, lastActivity: '30 min atrás' },
];

const rankColors = ['bg-destructive', 'bg-warning', 'bg-info', 'bg-chart-purple'];

const SecurityPage = () => {
  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<AlertTriangle className="w-8 h-8 text-warning" />} value="9" label="Eventos de Segurança" badge="Últimas 24h" badgeColor="green" />
        <StatCard icon={<ShieldBan className="w-8 h-8 text-destructive" />} value="10" label="IPs Bloqueados" badge="Ativos" badgeColor="green" />
        <StatCard icon={<Eye className="w-8 h-8 text-info" />} value="Ativo" label="Monitoramento" badge="Tempo real" badgeColor="green" />
        <StatCard icon={<ShieldCheck className="w-8 h-8 text-success" />} value="Alto" label="Nível de Segurança" badge="Protegido" badgeColor="green" />
      </div>

      {/* Events & Top IPs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">⚠️ Eventos de Segurança</h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {securityEvents.map((e, i) => (
              <div key={i} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm flex items-center gap-1">⚠️ Evento de Segurança</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{e.time}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">{e.severity}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{e.description}</p>
                <p className="text-xs text-info mt-1">IP: {e.ip}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">🚫 Top IPs Bloqueados</h2>
          <div className="space-y-4">
            {topBlockedIps.map(ip => (
              <div key={ip.rank} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-destructive">🚫</span>
                    <span className="font-medium text-sm text-destructive">{ip.ip}</span>
                  </div>
                  <span className={`rank-badge ${rankColors[ip.rank - 1]}`}>#{ip.rank}</span>
                </div>
                <p className="text-xs text-muted-foreground">Consultas DNS realizadas (dados reais)</p>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="font-semibold">Tentativas: {ip.attempts.toLocaleString()}</span>
                  <span className="text-muted-foreground">Última atividade: {ip.lastActivity}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                  <div className="bg-destructive h-1.5 rounded-full" style={{ width: `${(ip.attempts / 5740) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Firewall Logs */}
      <div className="section-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            🔥 Logs do Firewall
            <span className="bg-success/10 text-success text-xs px-2 py-0.5 rounded-full">0</span>
          </h2>
          <div className="flex gap-1">
            {['Todos', 'Fail2Ban', 'NFTables', 'Status'].map((f, i) => (
              <button
                key={f}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                  i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center py-3">
            <p className="text-lg font-bold text-info">2</p>
            <p className="text-xs text-muted-foreground">Jails Ativos</p>
          </div>
          <div className="text-center py-3">
            <p className="text-lg font-bold text-success">0</p>
            <p className="text-xs text-muted-foreground">IPs Banidos</p>
          </div>
          <div className="text-center py-3">
            <p className="text-lg font-bold text-foreground">3</p>
            <p className="text-xs text-muted-foreground">Regras NFT</p>
          </div>
          <div className="text-center py-3">
            <p className="text-lg font-bold text-success">2h 15m</p>
            <p className="text-xs text-muted-foreground">Uptime</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;
