import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import StoreInput from "./pages/StoreInput";
import Diagnosis from "./pages/Diagnosis";
import PromoText from "./pages/PromoText";
import KPIDesign from "./pages/KPIDesign";
import Dashboard from "./pages/Dashboard";
import AreaAnalysis from "./pages/AreaAnalysis";
import FlyerPlan from "./pages/FlyerPlan";
import AdProposal from "./pages/AdProposal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">読み込み中...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/input" element={<ProtectedRoute><StoreInput /></ProtectedRoute>} />
    <Route path="/diagnosis/:id" element={<ProtectedRoute><Diagnosis /></ProtectedRoute>} />
    <Route path="/promo/:id" element={<ProtectedRoute><PromoText /></ProtectedRoute>} />
    <Route path="/kpi/:id" element={<ProtectedRoute><KPIDesign /></ProtectedRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/area-analysis" element={<ProtectedRoute><AreaAnalysis /></ProtectedRoute>} />
    <Route path="/flyer-plan" element={<ProtectedRoute><FlyerPlan /></ProtectedRoute>} />
    <Route path="/ad-proposal" element={<ProtectedRoute><AdProposal /></ProtectedRoute>} />
    {/* Legacy routes redirect */}
    <Route path="/diagnosis" element={<Navigate to="/dashboard" replace />} />
    <Route path="/promo" element={<Navigate to="/dashboard" replace />} />
    <Route path="/kpi" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
