import StatCard from '@/components/StatCard';
import { AlertTriangle, ShieldBan, Eye, ShieldCheck } from 'lucide-react';

const SecurityPage = () => {
  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<AlertTriangle className="w-8 h-8 text-warning" />} value="0" label="Eventos de Segurança" badge="Últimas 24h" badgeColor="green" />
        <StatCard icon={<ShieldBan className="w-8 h-8 text-destructive" />} value="0" label="IPs Bloqueados" badge="Ativos" badgeColor="green" />
        <StatCard icon={<Eye className="w-8 h-8 text-info" />} value="Aguardando" label="Monitoramento" badge="Offline" badgeColor="yellow" />
        <StatCard icon={<ShieldCheck className="w-8 h-8 text-success" />} value="--" label="Nível de Segurança" badge="Sem dados" badgeColor="blue" />
      </div>

      {/* Events & Top IPs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">⚠️ Eventos de Segurança</h2>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum evento registrado</p>
              <p className="text-xs mt-1 opacity-60">Eventos aparecerão aqui quando o DNS estiver configurado</p>
            </div>
          </div>
        </div>

        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">🚫 Top IPs Bloqueados</h2>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <ShieldBan className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum IP bloqueado</p>
            </div>
          </div>
        </div>
      </div>

      {/* Firewall Logs */}
      <div className="section-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            🔥 Logs do Firewall
            <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">0</span>
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
            <p className="text-lg font-bold text-muted-foreground">0</p>
            <p className="text-xs text-muted-foreground">Jails Ativos</p>
          </div>
          <div className="text-center py-3">
            <p className="text-lg font-bold text-muted-foreground">0</p>
            <p className="text-xs text-muted-foreground">IPs Banidos</p>
          </div>
          <div className="text-center py-3">
            <p className="text-lg font-bold text-muted-foreground">0</p>
            <p className="text-xs text-muted-foreground">Regras NFT</p>
          </div>
          <div className="text-center py-3">
            <p className="text-lg font-bold text-muted-foreground">--</p>
            <p className="text-xs text-muted-foreground">Uptime</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;
