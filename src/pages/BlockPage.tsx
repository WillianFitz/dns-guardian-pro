import { useSearchParams } from 'react-router-dom';
import { ShieldBan, ExternalLink } from 'lucide-react';
import { useBranding } from '@/contexts/BrandingContext';

const BlockPage = () => {
  const [searchParams] = useSearchParams();
  const { currentBranding } = useBranding();
  const domain = searchParams.get('domain') || searchParams.get('d') || window.location.hostname;
  const providerName = searchParams.get('provider') || currentBranding.systemName;

  return (
    <div className="min-h-screen flex flex-col" style={{
      background: 'linear-gradient(180deg, hsl(250, 30%, 15%) 0%, hsl(230, 25%, 12%) 50%, hsl(220, 20%, 10%) 100%)'
    }}>
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-start pt-12 px-4 pb-8">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{
          background: 'linear-gradient(135deg, hsl(15, 80%, 50%), hsl(0, 70%, 45%))'
        }}>
          <ShieldBan className="w-8 h-8" style={{ color: 'hsl(0, 0%, 100%)' }} />
        </div>

        <h1 className="text-3xl font-extrabold mb-2" style={{ color: 'hsl(0, 0%, 95%)' }}>
          Acesso Bloqueado
        </h1>
        <p className="text-base mb-6" style={{ color: 'hsl(0, 0%, 65%)' }}>
          Este conteúdo não está disponível
        </p>

        {/* Domain badge */}
        <div className="px-6 py-2.5 rounded-full mb-10" style={{
          background: 'hsl(230, 20%, 18%)',
          border: '1px solid hsl(230, 15%, 25%)'
        }}>
          <code className="text-sm font-mono font-semibold" style={{ color: 'hsl(0, 0%, 90%)' }}>
            {domain}
          </code>
        </div>

        {/* Info Cards */}
        <div className="w-full max-w-lg space-y-4">
          {/* Aviso Importante */}
          <div className="rounded-xl p-5" style={{
            background: 'linear-gradient(135deg, hsl(45, 90%, 94%), hsl(40, 85%, 90%))',
            borderLeft: '4px solid hsl(38, 92%, 50%)'
          }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⚠️</span>
              <h3 className="font-bold" style={{ color: 'hsl(30, 50%, 15%)' }}>Aviso Importante</h3>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(30, 30%, 25%)' }}>
              O site que você está tentando acessar foi <strong>bloqueado por determinação da ANATEL</strong> (Agência Nacional de Telecomunicações).
            </p>
          </div>

          {/* Sobre o bloqueio */}
          <div className="rounded-xl p-5" style={{
            background: 'linear-gradient(135deg, hsl(210, 80%, 95%), hsl(200, 70%, 92%))',
            borderLeft: '4px solid hsl(210, 80%, 55%)'
          }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📋</span>
              <h3 className="font-bold" style={{ color: 'hsl(210, 50%, 15%)' }}>Sobre o bloqueio da ANATEL</h3>
            </div>
            <p className="text-sm leading-relaxed mb-3" style={{ color: 'hsl(210, 30%, 25%)' }}>
              A Agência Nacional de Telecomunicações (ANATEL) é responsável por regulamentar e fiscalizar os serviços de telecomunicações no Brasil. Este domínio consta na lista oficial de sites que devem ser bloqueados pelos provedores de internet.
            </p>
            <a
              href="https://www.gov.br/anatel/pt-br"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: 'hsl(38, 92%, 50%)', color: 'hsl(30, 50%, 10%)' }}
            >
              🔗 Saiba mais sobre a ANATEL
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Por que bloqueado */}
          <div className="rounded-xl p-5" style={{
            background: 'linear-gradient(135deg, hsl(270, 60%, 95%), hsl(260, 50%, 92%))',
            borderLeft: '4px solid hsl(270, 60%, 60%)'
          }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">❓</span>
              <h3 className="font-bold" style={{ color: 'hsl(270, 40%, 20%)' }}>Por que este site está bloqueado?</h3>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(270, 20%, 30%)' }}>
              Este domínio consta na lista de sites que devem ser bloqueados pelos provedores de internet brasileiros, em conformidade com as normas e determinações da ANATEL.
            </p>
          </div>

          {/* O que fazer */}
          <div className="rounded-xl p-5" style={{
            background: 'linear-gradient(135deg, hsl(142, 50%, 94%), hsl(140, 40%, 90%))',
            borderLeft: '4px solid hsl(142, 60%, 45%)'
          }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💡</span>
              <h3 className="font-bold" style={{ color: 'hsl(142, 40%, 15%)' }}>O que fazer?</h3>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(142, 20%, 25%)' }}>
              Se você acredita que este bloqueio foi feito por engano, entre em contato com seu provedor de internet ou consulte a ANATEL para mais informações sobre o bloqueio.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center pb-6 px-4">
        <p className="text-xs mb-3" style={{ color: 'hsl(0, 0%, 50%)' }}>
          Este bloqueio é aplicado automaticamente pelo seu provedor de internet em cumprimento às normas da ANATEL.
        </p>
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold" style={{
          background: 'hsl(230, 20%, 18%)',
          border: '1px solid hsl(230, 15%, 25%)',
          color: 'hsl(0, 0%, 80%)'
        }}>
          🛡️ Bloqueio RPZ ANATEL
        </div>
        <p className="text-xs mt-3" style={{ color: 'hsl(0, 0%, 40%)' }}>
          Provedor: {providerName}
        </p>
      </footer>
    </div>
  );
};

export default BlockPage;
