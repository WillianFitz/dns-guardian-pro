import StatCard from '@/components/StatCard';
import DataState from '@/components/DataState';
import { AlertTriangle, ShieldBan, Eye, ShieldCheck } from 'lucide-react';
import { useSecurityStats, useSecurityEvents, useBlockedIps, useFirewallStats } from '@/services/api';

const rankColors = ['bg-destructive', 'bg-warning', 'bg-info', 'bg-chart-purple', 'bg-chart-teal'];

const SecurityPage = () => {
  const stats = useSecurityStats();
  const events = useSecurityEvents();
  const blockedIps = useBlockedIps();
  const firewall = useFirewallStats();

  const s = stats.data;
  const fw = firewall.data;
  const maxAttempts = blockedIps.data?.[0]?.attempts || 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<AlertTriangle className="w-8 h-8 text-warning" />} value={s?.securityEvents || 0} label="Eventos de Segurança" badge="Últimas 24h" badgeColor="green" />
        <StatCard icon={<ShieldBan className="w-8 h-8 text-destructive" />} value={s?.blockedIps || 0} label="IPs Bloqueados" badge="Ativos" badgeColor="green" />
        <StatCard icon={<Eye className="w-8 h-8 text-info" />} value={s?.monitoringStatus || 'Aguardando'} label="Monitoramento" badge={s?.monitoringStatus === 'Ativo' ? 'Tempo real' : 'Offline'} badgeColor={s?.monitoringStatus === 'Ativo' ? 'green' : 'yellow'} />
        <StatCard icon={<ShieldCheck className="w-8 h-8 text-success" />} value={s?.securityLevel || '--'} label="Nível de Segurança" badge={s?.securityLevel === 'Normal' ? 'OK' : 'Alerta'} badgeColor={s?.securityLevel === 'Normal' ? 'green' : 'yellow'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">⚠️ Eventos de Segurança</h2>
          <DataState isLoading={events.isLoading} isError={events.isError} isEmpty={!events.data?.length}
            icon={<AlertTriangle className="w-12 h-12" />} emptyMessage="Nenhum evento registrado"
            emptySubMessage="Eventos aparecerão quando o DNS estiver configurado">
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {events.data?.map((e, i) => (
                <div key={i} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm flex items-center gap-1">⚠️ Evento de Segurança</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{e.time}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        e.severity === 'Alta' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                      }`}>{e.severity}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{e.description}</p>
                  <p className="text-xs text-info mt-1">IP: {e.ip}</p>
                </div>
              ))}
            </div>
          </DataState>
        </div>

        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">🚫 Top IPs Bloqueados</h2>
          <DataState isLoading={blockedIps.isLoading} isError={blockedIps.isError} isEmpty={!blockedIps.data?.length}
            icon={<ShieldBan className="w-12 h-12" />} emptyMessage="Nenhum IP bloqueado">
            <div className="space-y-4">
              {blockedIps.data?.map(ip => (
                <div key={ip.rank} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-destructive">🚫</span>
                      <span className="font-medium text-sm text-destructive">{ip.ip}</span>
                    </div>
                    <span className={`rank-badge ${rankColors[(ip.rank - 1) % rankColors.length]}`}>#{ip.rank}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Consultas DNS realizadas</p>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="font-semibold">Tentativas: {ip.attempts.toLocaleString()}</span>
                    <span className="text-muted-foreground">Última: {ip.lastActivity}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                    <div className="bg-destructive h-1.5 rounded-full" style={{ width: `${(ip.attempts / maxAttempts) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </DataState>
        </div>
      </div>

      <div className="section-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            🔥 Logs do Firewall
            <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">{fw?.ipsBanned || 0}</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center py-3">
            <p className="text-lg font-bold text-info">{fw?.jailsActive || 0}</p>
            <p className="text-xs text-muted-foreground">Jails Ativos</p>
          </div>
          <div className="text-center py-3">
            <p className="text-lg font-bold text-success">{fw?.ipsBanned || 0}</p>
            <p className="text-xs text-muted-foreground">IPs Banidos</p>
          </div>
          <div className="text-center py-3">
            <p className="text-lg font-bold text-foreground">{fw?.nftRules || 0}</p>
            <p className="text-xs text-muted-foreground">Regras NFT</p>
          </div>
          <div className="text-center py-3">
            <p className="text-lg font-bold text-success">{fw?.uptime || '--'}</p>
            <p className="text-xs text-muted-foreground">Uptime</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;
