import { Cpu, HardDrive, Clock, MemoryStick } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DataState from '@/components/DataState';
import { useSystemResources, useCpuMemory, useNetworkTraffic, useProcesses } from '@/services/api';

const SystemPage = () => {
  const resources = useSystemResources();
  const cpuMem = useCpuMemory();
  const network = useNetworkTraffic();
  const processes = useProcesses();

  const r = resources.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-primary rounded-lg p-4 text-primary-foreground">
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-5 h-5" /><span className="text-sm font-medium">CPU</span>
          </div>
          <p className="text-2xl font-bold">{r ? `${r.cpu}%` : '--'}</p>
        </div>
        <div className="bg-success rounded-lg p-4 text-success-foreground">
          <div className="flex items-center gap-2 mb-1">
            <MemoryStick className="w-5 h-5" /><span className="text-sm font-medium">Memória</span>
          </div>
          <p className="text-2xl font-bold">{r ? `${r.memory}%` : '--'}</p>
        </div>
        <div className="bg-warning rounded-lg p-4 text-warning-foreground">
          <div className="flex items-center gap-2 mb-1">
            <HardDrive className="w-5 h-5" /><span className="text-sm font-medium">Disco</span>
          </div>
          <p className="text-2xl font-bold">{r ? `${r.disk}%` : '--'}</p>
        </div>
        <div className="bg-info rounded-lg p-4 text-info-foreground">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5" /><span className="text-sm font-medium">Uptime</span>
          </div>
          <p className="text-2xl font-bold">{r?.uptime || '--'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4">📈 CPU e Memória</h2>
          <DataState isLoading={cpuMem.isLoading} isError={cpuMem.isError} isEmpty={!cpuMem.data?.length}
            icon={<Cpu className="w-12 h-12" />} emptyMessage="Aguardando métricas do servidor...">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cpuMem.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                <Tooltip /><Legend />
                <Line type="monotone" dataKey="cpu" name="CPU %" stroke="hsl(210,100%,56%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="memory" name="Memória %" stroke="hsl(142,71%,45%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </DataState>
        </div>

        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4">🌐 Tráfego de Rede</h2>
          <DataState isLoading={network.isLoading} isError={network.isError} isEmpty={!network.data?.length}
            icon={<HardDrive className="w-12 h-12" />} emptyMessage="Aguardando dados de rede...">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={network.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip /><Legend />
                <Line type="monotone" dataKey="download" name="Download (Mbps)" stroke="hsl(210,100%,56%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="upload" name="Upload (Mbps)" stroke="hsl(25,95%,53%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </DataState>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4">📋 Processos do Sistema</h2>
          <DataState isLoading={processes.isLoading} isError={processes.isError} isEmpty={!processes.data?.length}
            icon={<Cpu className="w-12 h-12" />} emptyMessage="Nenhum processo encontrado" height="h-48">
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
                {processes.data?.map(p => (
                  <tr key={p.pid} className="border-b last:border-0">
                    <td className="py-2">{p.pid}</td>
                    <td className="py-2 font-medium">{p.name}</td>
                    <td className="py-2">{p.cpu}%</td>
                    <td className="py-2">{p.memory}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataState>
        </div>

        <div className="section-card">
          <h2 className="text-lg font-semibold">📄 Logs do Sistema</h2>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p>📁 Nenhum log encontrado</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemPage;
