import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import HowItWorks from "./pages/HowItWorks";
import ForPatients from "./pages/ForPatients";
import ForSpecialists from "./pages/ForSpecialists";
import ForClinics from "./pages/ForClinics";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import SpecialistProfile from "./pages/SpecialistProfile";
import BookAppointment from "./pages/BookAppointment";
import Appointments from "./pages/Appointments";
import AppointmentDetails from "./pages/AppointmentDetails";
import SpecialistDashboard from "./pages/SpecialistDashboard";
import SpecialistAvailability from "./pages/SpecialistAvailability";
import MedicalRecords from "./pages/MedicalRecords";
import Messages from "./pages/Messages";
import VideoConsultation from "./pages/VideoConsultation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/for-patients" element={<ForPatients />} />
            <Route path="/for-specialists" element={<ForSpecialists />} />
            <Route path="/for-clinics" element={<ForClinics />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/search" element={<Search />} />
            <Route path="/specialist/:id" element={<SpecialistProfile />} />
            <Route path="/book/:id" element={<BookAppointment />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/appointments/:id" element={<AppointmentDetails />} />
            <Route path="/specialist/dashboard" element={<SpecialistDashboard />} />
            <Route path="/specialist/availability" element={<SpecialistAvailability />} />
            <Route path="/medical-records" element={<MedicalRecords />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/consultation/:appointmentId" element={<VideoConsultation />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
