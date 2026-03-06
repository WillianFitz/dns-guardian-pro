import { useState } from 'react';
import StatCard from '@/components/StatCard';
import { Ban, AlertTriangle, RefreshCw, Database } from 'lucide-react';

const timeFilters = ['1h', '3h', '6h', '12h', '24h'];

const RpzAnatelPage = () => {
  const [activeTimeFilter, setActiveTimeFilter] = useState('1h');

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Ban className="w-8 h-8 text-destructive" />} value="0" label="Domínios Bloqueados" badge="Lista Ativa" badgeColor="blue" />
        <StatCard icon={<AlertTriangle className="w-8 h-8 text-warning" />} value="0" label="Tentativas Bloqueadas" badge="Últimas 24h" badgeColor="green" />
        <StatCard icon={<RefreshCw className="w-8 h-8 text-info" />} value="--" label="Última Atualização" badge="Auto-Update" badgeColor="green" />
        <StatCard icon={<Database className="w-8 h-8 text-success" />} value="0 MB" label="Tamanho da Lista" badge="db.rpz.zone" badgeColor="green" />
      </div>

      {/* RPZ Status */}
      <div className="bg-primary rounded-lg overflow-hidden">
        <div className="px-6 py-3 flex items-center gap-2">
          <span className="text-primary-foreground font-semibold">⏳ Status do Sistema RPZ</span>
        </div>
        <div className="bg-card grid grid-cols-2 lg:grid-cols-4 gap-4 p-6">
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-semibold mb-1">⏳ Aguardando</span>
            <p className="text-xs text-muted-foreground">Status da Zona</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground font-semibold">--</p>
            <p className="text-xs text-muted-foreground">Serial da Zona</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground font-semibold">--</p>
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
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <Ban className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aguardando dados RPZ...</p>
              <p className="text-xs mt-1 opacity-60">Configure a zona RPZ no servidor DNS</p>
            </div>
          </div>
        </div>

        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4">🔵 Categorias Bloqueadas</h2>
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

      {/* Recent Blocked */}
      <div className="section-card">
        <h2 className="text-lg font-semibold mb-4">🌐 Domínios Bloqueados Recentes</h2>
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          <p className="text-sm">Nenhum domínio bloqueado registrado</p>
        </div>
      </div>
    </div>
  );
};

export default RpzAnatelPage;
