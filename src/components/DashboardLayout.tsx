import { ReactNode } from 'react';
import { useBranding } from '@/contexts/BrandingContext';
import { Monitor, User, LogOut, Shield } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  children: ReactNode;
}

const tabs = [
  { id: 'dns', label: 'DNS Analytics', icon: '🏠', path: '/' },
  { id: 'rpz', label: 'RPZ ANATEL', icon: '🚫', path: '/rpz' },
  { id: 'security', label: 'Segurança', icon: '🛡️', path: '/seguranca' },
  { id: 'system', label: 'Sistema', icon: '⚙️', path: '/sistema' },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { currentBranding, isAdmin, setIsAdmin } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = tabs.find(t => t.path === location.pathname)?.id || 'dns';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-header text-header-foreground px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/30 rounded-lg flex items-center justify-center">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{currentBranding.systemName}</h1>
              <p className="text-xs opacity-80 flex items-center gap-1">
                📊 Sistema de Monitoramento DNS em Tempo Real
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const goingToAdmin = !isAdmin;
                setIsAdmin(goingToAdmin);
                navigate(goingToAdmin ? '/admin' : '/');
              }}
              className="flex items-center gap-1.5 text-sm opacity-80 hover:opacity-100 transition-opacity px-3 py-1.5 rounded-md hover:bg-primary/20"
            >
              <Shield className="w-4 h-4" />
              {isAdmin ? 'Dashboard' : 'Admin'}
            </button>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4" />
              <span>admin</span>
            </div>
            <button
              className="flex items-center gap-1 text-sm opacity-80 hover:opacity-100 transition-opacity"
              onClick={() => {
                setIsAdmin(false);
                localStorage.removeItem('dns_admin_logged');
                navigate('/');
              }}
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      {!isAdmin && (
        <nav className="flex justify-center gap-2 py-4 bg-card border-b">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`nav-tab ${activeTab === tab.id ? 'nav-tab-active' : 'nav-tab-inactive'}`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      )}

      {/* Content */}
      <main className="max-w-[1400px] mx-auto p-6">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
