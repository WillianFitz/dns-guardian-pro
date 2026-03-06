import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface DataStateProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  icon: ReactNode;
  emptyMessage: string;
  emptySubMessage?: string;
  children: ReactNode;
  height?: string;
}

const DataState = ({ isLoading, isError, isEmpty, icon, emptyMessage, emptySubMessage, children, height = 'h-[300px]' }: DataStateProps) => {
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${height} text-muted-foreground`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-50" />
          <p className="text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`flex items-center justify-center ${height} text-muted-foreground`}>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 opacity-30">{icon}</div>
          <p className="text-sm text-destructive">Erro ao carregar dados</p>
          <p className="text-xs mt-1 opacity-60">Verifique a conexão com a API</p>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={`flex items-center justify-center ${height} text-muted-foreground`}>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 opacity-30">{icon}</div>
          <p className="text-sm">{emptyMessage}</p>
          {emptySubMessage && <p className="text-xs mt-1 opacity-60">{emptySubMessage}</p>}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default DataState;
