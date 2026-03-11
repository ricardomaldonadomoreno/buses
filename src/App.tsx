import WeMoveBooking from './pages/WeMoveBooking';
import WeMoveViaje from './pages/WeMoveViaje';
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Trips from "./pages/Trips";
import Transactions from "./pages/Transactions";
import PackService from "./pages/PackService";
import WeMove from "./pages/WeMove";
import WeMoveRegister from "./pages/WeMoveRegister";
import WeMoveAuthCallback from "./pages/WeMoveAuthCallback";
import WeMoveVerifyEmail from "./pages/WeMoveVerifyEmail";
import WeMoveDashboard from "./pages/WeMoveDashboard";
import WeMoveCompleteProfile from "./pages/WeMoveCompleteProfile";
import WeMovePublishRoute from "./pages/WeMovePublishRoute";
import Contact from "./pages/Contact";
import WeMoveCartera from './pages/WeMoveCartera';
import NotFound from "./pages/NotFound";
// Admin — backoffice
import Admin             from "./pages/Admin";
import AdminWeMove       from "./pages/AdminWeMove";
import AdminPackService  from "./pages/AdminPackService";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/packservice" element={<PackService />} />
            <Route path="/wemove" element={<WeMove />} />
            <Route path="/wemove/register" element={<WeMoveRegister />} />
            <Route path="/wemove/auth/callback" element={<WeMoveAuthCallback />} />
            <Route path="/wemove/verify-email" element={<WeMoveVerifyEmail />} />
            <Route path="/wemove/dashboard" element={<WeMoveDashboard />} />
            <Route path="/wemove/booking/:routeId" element={<WeMoveBooking />} />
            <Route path="/wemove/viaje/:routeId" element={<WeMoveViaje />} />
            <Route path="/wemove/profile" element={<WeMoveCompleteProfile />} />
            <Route path="/wemove/publish-route" element={<WeMovePublishRoute />} />
            <Route path="/wemove/cartera" element={<WeMoveCartera />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
              {/* ── ADMIN BACKOFFICE ── */}
            <Route path="/admin"             element={<Admin />} />
            <Route path="/admin/wemove"      element={<AdminWeMove />} />
            <Route path="/admin/packservice" element={<AdminPackService />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
