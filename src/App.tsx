// Updated App.tsx - add these imports and routes

// NEW IMPORTS TO ADD:
import WeMoveCompleteProfile from "./pages/WeMoveCompleteProfile";
import WeMovePublishRoute from "./pages/WeMovePublishRoute";

// NEW ROUTES TO ADD inside <Routes>:
// <Route path="/wemove/profile" element={<WeMoveCompleteProfile />} />
// <Route path="/wemove/publish-route" element={<WeMovePublishRoute />} />

// Full updated App.tsx:
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Trips from "./pages/Trips";
import Transactions from "./pages/Transactions";
import Admin from "./pages/Admin";
import PackService from "./pages/PackService";
import WeMove from "./pages/WeMove";
import WeMoveRegister from "./pages/WeMoveRegister";
import WeMoveAuthCallback from "./pages/WeMoveAuthCallback";
import WeMoveVerifyEmail from "./pages/WeMoveVerifyEmail";
import WeMoveDashboard from "./pages/WeMoveDashboard";
import WeMoveCompleteProfile from "./pages/WeMoveCompleteProfile";
import WeMovePublishRoute from "./pages/WeMovePublishRoute";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/packservice" element={<PackService />} />
          <Route path="/wemove" element={<WeMove />} />
          <Route path="/wemove/register" element={<WeMoveRegister />} />
          <Route path="/wemove/auth/callback" element={<WeMoveAuthCallback />} />
          <Route path="/wemove/verify-email" element={<WeMoveVerifyEmail />} />
          <Route path="/wemove/dashboard" element={<WeMoveDashboard />} />
          <Route path="/wemove/profile" element={<WeMoveCompleteProfile />} />
          <Route path="/wemove/publish-route" element={<WeMovePublishRoute />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/auth" element={<NotFound />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
