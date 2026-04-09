import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
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
import LocationMatch from "./pages/LocationMatch";
import StoreCandidateInput from "./pages/StoreCandidateInput";
import MediaPlan from "./pages/MediaPlan";
import MapAreaAnalysis from "./pages/MapAreaAnalysis";
import AgencyDashboard from "./pages/AgencyDashboard";
import Report from "./pages/Report";
import ResponseAnalysis from "./pages/ResponseAnalysis";
import OrderHistory from "./pages/OrderHistory";
import Pricing from "./pages/Pricing";
import AdminDashboard from "./pages/AdminDashboard";
import Tokushoho from "./pages/Tokushoho";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";
import StoreComparison from "./pages/StoreComparison";
import MonthlyReport from "./pages/MonthlyReport";
import ReportSchedule from "./pages/ReportSchedule";
import MeoAnalysis from "./pages/MeoAnalysis";
import FreeAnalysis from "./pages/FreeAnalysis";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">{t("loading")}</div>;
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
    <Route path="/location-match" element={<ProtectedRoute><LocationMatch /></ProtectedRoute>} />
    <Route path="/store-candidates" element={<ProtectedRoute><StoreCandidateInput /></ProtectedRoute>} />
    <Route path="/media-plan" element={<ProtectedRoute><MediaPlan /></ProtectedRoute>} />
    <Route path="/map-analysis" element={<ProtectedRoute><MapAreaAnalysis /></ProtectedRoute>} />
    <Route path="/agency" element={<ProtectedRoute><AgencyDashboard /></ProtectedRoute>} />
    <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
    <Route path="/response-analysis" element={<ProtectedRoute><ResponseAnalysis /></ProtectedRoute>} />
    <Route path="/order-history" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
    <Route path="/store-comparison" element={<ProtectedRoute><StoreComparison /></ProtectedRoute>} />
    <Route path="/monthly-report" element={<ProtectedRoute><MonthlyReport /></ProtectedRoute>} />
    <Route path="/report-schedule" element={<ProtectedRoute><ReportSchedule /></ProtectedRoute>} />
    <Route path="/meo-analysis" element={<ProtectedRoute><MeoAnalysis /></ProtectedRoute>} />
    <Route path="/free-analysis" element={<FreeAnalysis />} />
    <Route path="/pricing" element={<Pricing />} />
    <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
    <Route path="/tokushoho" element={<Tokushoho />} />
    <Route path="/terms" element={<Terms />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/install" element={<Install />} />
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
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
