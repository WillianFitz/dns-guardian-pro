import { ShieldAlert } from 'lucide-react';

const BlockPage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <div className="bg-card rounded-2xl shadow-lg border p-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Bloqueado</h1>
          <p className="text-muted-foreground mb-6">
            O domínio que você está tentando acessar foi bloqueado por determinação da{' '}
            <strong className="text-foreground">ANATEL</strong>, conforme regulamentação vigente para proteção dos usuários.
          </p>
          <div className="bg-muted rounded-lg p-4 text-sm text-left space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Domínio:</span>
              <span className="font-medium text-destructive">exemplo-bloqueado.com</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Categoria:</span>
              <span className="font-medium">Apostas Irregulares</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Motivo:</span>
              <span className="font-medium">Resolução ANATEL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data:</span>
              <span className="font-medium">{new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Este bloqueio é realizado em conformidade com as determinações regulatórias da Agência Nacional de Telecomunicações (ANATEL).
            Se você acredita que este bloqueio é um erro, entre em contato com seu provedor de internet.
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-4 opacity-60">
          DNS Monitor • Sistema de Proteção
        </p>
      </div>
    </div>
  );
};

export default BlockPage;
