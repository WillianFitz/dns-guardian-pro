import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrandingProvider>
        <BrowserRouter>
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
        </BrowserRouter>
      </BrandingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
