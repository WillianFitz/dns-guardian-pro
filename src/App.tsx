import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BrandingProvider } from "@/contexts/BrandingContext";
import DashboardLayout from "@/components/DashboardLayout";
import DnsAnalyticsPage from "@/pages/DnsAnalyticsPage";
import RpzAnatelPage from "@/pages/RpzAnatelPage";
import SecurityPage from "@/pages/SecurityPage";
import SystemPage from "@/pages/SystemPage";
import AdminPage from "@/pages/AdminPage";
import BlockPage from "@/pages/BlockPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrandingProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/blocked" element={<BlockPage />} />
            <Route path="/" element={<DashboardLayout><DnsAnalyticsPage /></DashboardLayout>} />
            <Route path="/rpz" element={<DashboardLayout><RpzAnatelPage /></DashboardLayout>} />
            <Route path="/seguranca" element={<DashboardLayout><SecurityPage /></DashboardLayout>} />
            <Route path="/sistema" element={<DashboardLayout><SystemPage /></DashboardLayout>} />
            <Route path="/admin" element={<DashboardLayout><AdminPage /></DashboardLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </BrandingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
