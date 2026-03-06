import { Cpu, HardDrive, Clock, MemoryStick } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const cpuMemData = Array.from({ length: 20 }, (_, i) => ({
  time: `${i + 1}min`,
  cpu: 10 + Math.random() * 15,
  memory: 20 + Math.random() * 10,
}));

const networkData = Array.from({ length: 20 }, (_, i) => ({
  time: `${17 * 60 + 42 + i}`,
  download: Math.random() * 0.02,
  upload: i > 17 ? Math.random() * 0.04 : Math.random() * 0.005,
}));

const processes = [
  { pid: 17, name: 'gunicorn', cpu: '0.0%', memory: '1.3%' },
  { pid: 18, name: 'gunicorn', cpu: '0.0%', memory: '1.2%' },
  { pid: 1, name: 'gunicorn', cpu: '0.0%', memory: '0.7%' },
  { pid: 11, name: 'nginx', cpu: '0.0%', memory: '0.1%' },
  { pid: 12, name: 'nginx', cpu: '0.0%', memory: '0.1%' },
  { pid: 14, name: 'cron-metrics.sh', cpu: '0.0%', memory: '0.1%' },
  { pid: 10, name: 'nginx', cpu: '0.0%', memory: '0.0%' },
  { pid: 332, name: 'sleep', cpu: '0.0%', memory: '0.0%' },
];

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
          <p className="text-2xl font-bold">12%</p>
        </div>
        <div className="bg-success rounded-lg p-4 text-success-foreground">
          <div className="flex items-center gap-2 mb-1">
            <MemoryStick className="w-5 h-5" />
            <span className="text-sm font-medium">Memória</span>
          </div>
          <p className="text-2xl font-bold">25%</p>
        </div>
        <div className="bg-warning rounded-lg p-4 text-warning-foreground">
          <div className="flex items-center gap-2 mb-1">
            <HardDrive className="w-5 h-5" />
            <span className="text-sm font-medium">Disco</span>
          </div>
          <p className="text-2xl font-bold">4%</p>
        </div>
        <div className="bg-info rounded-lg p-4 text-info-foreground">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">Uptime</span>
          </div>
          <p className="text-2xl font-bold">0d 2h 22m</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4">📈 CPU e Memória</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cpuMemData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="cpu" name="CPU %" stroke="hsl(210,100%,56%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="memory" name="Memória %" stroke="hsl(142,71%,45%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="section-card">
          <h2 className="text-lg font-semibold mb-4">🌐 Tráfego de Rede</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={networkData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="download" name="Download (Mbps)" stroke="hsl(210,100%,56%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="upload" name="Upload (Mbps)" stroke="hsl(25,95%,53%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
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
              {processes.map(p => (
                <tr key={p.pid} className="border-b last:border-0">
                  <td className="py-2">{p.pid}</td>
                  <td className="py-2 font-medium">{p.name}</td>
                  <td className="py-2">{p.cpu}</td>
                  <td className="py-2">{p.memory}</td>
                </tr>
              ))}
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
