import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import Tables from "./pages/admin/Tables";
import Reservations from "./pages/admin/Reservations";
import AdminLocations from "./pages/admin/Locations";
import ScanCheckIn from "./pages/admin/ScanCheckIn";
import Contact from "./pages/Contact";
import MenuPage from "./pages/Menu";
import ExperiencePage from "./pages/Experience";
import PublicLocations from "./pages/PublicLocations";
import ReservationPage from "./pages/Reserve";
import AboutPage from "./pages/About";
import TrackPage from "./pages/Track";
import PrivacyPage from "./pages/Privacy";
import TermsPage from "./pages/Terms";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/tables" element={<Tables />} />
          <Route path="/admin/reservations" element={<Reservations />} />
          <Route path="/admin/locations" element={<AdminLocations />} />
          <Route path="/admin/scan" element={<ScanCheckIn />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/experience" element={<ExperiencePage />} />
          <Route path="/locations" element={<PublicLocations />} />
          <Route path="/reserve" element={<ReservationPage />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
