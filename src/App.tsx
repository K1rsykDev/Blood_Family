import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationPermissionBanner } from "@/components/NotificationPermissionBanner";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Apply from "./pages/Apply";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";
import News from "./pages/News";
import Giveaways from "./pages/Giveaways";
import Admin from "./pages/Admin";
import Roulette from "./pages/Roulette";
import Developer from "./pages/Developer";
import Leaders from "./pages/Leaders";
import Information from "./pages/Information";
import Players from "./pages/Players";
import Cinema from "./pages/Cinema";
import CinemaRoom from "./pages/CinemaRoom";
import Shop from "./pages/Shop";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NotificationPermissionBanner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/news" element={<News />} />
            <Route path="/giveaways" element={<Giveaways />} />
            <Route path="/admin/*" element={<Admin />} />
            <Route path="/roulette" element={<Roulette />} />
            <Route path="/developer" element={<Developer />} />
            <Route path="/leaders" element={<Leaders />} />
            <Route path="/information" element={<Information />} />
            <Route path="/players" element={<Players />} />
            <Route path="/cinema" element={<Cinema />} />
            <Route path="/cinema/:roomId" element={<CinemaRoom />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
