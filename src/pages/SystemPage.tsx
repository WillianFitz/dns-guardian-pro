import { Cpu, HardDrive, Clock, MemoryStick } from 'lucide-react';

const SystemPage = () => {
  return (
    <div className="space-y-6">
      {/* Resource Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-primary rounded-lg p-4 text-primary-foreground">
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-5 h-5" />
            <span className="text-sm font-medium">CPU</span>
          </div>
          <p className="text-2xl font-bold">--</p>
        </div>
        <div className="bg-success rounded-lg p-4 text-success-foreground">
          <div className="flex items-center gap-2 mb-1">
            <MemoryStick className="w-5 h-5" />
            <span className="text-sm font-medium">Memória</span>
          </div>
          <p className="text-2xl font-bold">--</p>
        </div>
        <div className="bg-warning rounded-lg p-4 text-warning-foreground">
          <div className="flex items-center gap-2 mb-1">
            <HardDrive className="w-5 h-5" />
            <span className="text-sm font-medium">Disco</span>
          </div>
          <p className="text-2xl font-bold">--</p>
        </div>
        <div className="bg-info rounded-lg p-4 text-info-foreground">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Uptime</span>
          </div>
          <p className="text-2xl font-bold">--</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4">📈 CPU e Memória</h2>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <Cpu className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aguardando métricas do servidor...</p>
            </div>
          </div>
        </div>

        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4">🌐 Tráfego de Rede</h2>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <HardDrive className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aguardando dados de rede...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Processes & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4">📋 Processos do Sistema</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-semibold text-muted-foreground">PID</th>
                <th className="pb-2 font-semibold text-muted-foreground">Nome</th>
                <th className="pb-2 font-semibold text-muted-foreground">CPU%</th>
                <th className="pb-2 font-semibold text-muted-foreground">Memória%</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground">
                  Nenhum processo encontrado
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="section-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">📄 Logs do Sistema</h2>
            <div className="flex gap-1">
              {['Todos', 'DNS', 'Firewall', 'Erros'].map((f, i) => (
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
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p>📁 Nenhum log encontrado</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemPage;
