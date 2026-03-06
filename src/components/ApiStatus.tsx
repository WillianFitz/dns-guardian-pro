import { isApiConfigured } from '@/services/api';
import { AlertTriangle, Wifi } from 'lucide-react';

const ApiStatus = () => {
  const configured = isApiConfigured();

  if (configured) return null;

  return (
    <div className="section-card border-2 border-warning/30 bg-warning/5 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-sm mb-1">API não configurada</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Para começar a receber dados do seu servidor DNS, configure a variável de ambiente com a URL do seu Cloudflare Worker.
          </p>
          <div className="bg-foreground/5 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold">1. Crie o arquivo <code className="bg-muted px-1 py-0.5 rounded">.env</code> na raiz do projeto:</p>
            <code className="block bg-muted px-3 py-1.5 rounded text-xs font-mono">
              VITE_API_URL=https://dns-monitor-api.seudominio.workers.dev
            </code>
            <code className="block bg-muted px-3 py-1.5 rounded text-xs font-mono">
              VITE_ADMIN_SECRET=sua-senha-admin
            </code>
            <p className="text-xs font-semibold mt-2">2. Deploy o Worker na Cloudflare:</p>
            <code className="block bg-muted px-3 py-1.5 rounded text-xs font-mono">
              cd cloudflare && wrangler d1 create dns-monitor && wrangler d1 execute dns-monitor --file=schema.sql && wrangler deploy
            </code>
            <p className="text-xs font-semibold mt-2">3. Instale o coletor no servidor DNS:</p>
            <code className="block bg-muted px-3 py-1.5 rounded text-xs font-mono">
              sudo bash /opt/dns-monitor/install.sh
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiStatus;
