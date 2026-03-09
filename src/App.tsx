import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { BrandingProvider } from "@/contexts/BrandingContext";
import DashboardLayout from "@/components/DashboardLayout";
import RequireAuth from "@/components/RequireAuth";
import DnsAnalyticsPage from "@/pages/DnsAnalyticsPage";
import RpzAnatelPage from "@/pages/RpzAnatelPage";
import SecurityPage from "@/pages/SecurityPage";
import SystemPage from "@/pages/SystemPage";
import AdminPage from "@/pages/AdminPage";
import BlockPage from "@/pages/BlockPage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Router central com regra especial para o host de bloqueio
const AppRoutes = () => {
  const location = useLocation();
  const host = typeof window !== "undefined" ? window.location.hostname : "";

  // Se estiver acessando pelo domínio de bloqueio e na raiz (/),
  // redireciona automaticamente para a página /blocked
  if (host === "bloqueio.sudonet.com.br" && location.pathname === "/") {
    return <Navigate to="/blocked" replace />;
  }

  return (
    <Routes>
      <Route path="/blocked" element={<BlockPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<DashboardLayout><AdminPage /></DashboardLayout>} />
      <Route path="/" element={<RequireAuth><DashboardLayout><DnsAnalyticsPage /></DashboardLayout></RequireAuth>} />
      <Route path="/rpz" element={<RequireAuth><DashboardLayout><RpzAnatelPage /></DashboardLayout></RequireAuth>} />
      <Route path="/seguranca" element={<RequireAuth><DashboardLayout><SecurityPage /></DashboardLayout></RequireAuth>} />
      <Route path="/sistema" element={<RequireAuth><DashboardLayout><SystemPage /></DashboardLayout></RequireAuth>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrandingProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </BrandingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
