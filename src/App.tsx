import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import "./lib/i18n";
import Home from "./pages/HomePage";
import HowItWorks from "./pages/HowItWorks";
import ForPatients from "./pages/ForPatients";
import ForSpecialists from "./pages/ForSpecialists";
import ForClinics from "./pages/ForClinics";
import About from "./pages/About";
import Careers from "./pages/Careers";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import HIPAACompliance from "./pages/HIPAACompliance";
import CookiePolicy from "./pages/CookiePolicy";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PatientDashboardHome from "./pages/PatientDashboardHome";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import SpecialistProfile from "./pages/SpecialistProfile";
import BookAppointment from "./pages/BookAppointment";
import Appointments from "./pages/Appointments";
import AppointmentDetails from "./pages/AppointmentDetails";
import SpecialistDashboard from "./pages/SpecialistDashboard";
import MedicalRecords from "./pages/MedicalRecords";
import Messages from "./pages/Messages";
import VideoConsultation from "./pages/VideoConsultation";
import InstantConsultation from "./pages/InstantConsultation";
import ClinicDashboard from "./pages/ClinicDashboard";
import ClinicSettings from "./pages/ClinicSettings";
import SearchClinics from "./pages/SearchClinics";
import Prescriptions from "./pages/Prescriptions";
import CreatePrescription from "./pages/CreatePrescription";
import CreateReview from "./pages/CreateReview";
import CreateSOAPNote from "./pages/CreateSOAPNote";
import Payments from "./pages/Payments";
import FamilyMembers from "./pages/FamilyMembers";
import Notifications from "./pages/Notifications";
import SpecialistTimeOff from "./pages/SpecialistTimeOff";
import UploadMedicalRecord from "./pages/UploadMedicalRecord";
import Favorites from "./pages/Favorites";
import Analytics from "./pages/Analytics";
import AdminPanel from "./pages/AdminPanel";
import AuditLogs from "./pages/AuditLogs";
import SessionManagement from "./pages/SessionManagement";
import NotFound from "./pages/NotFound";
import SpecialistProfileEdit from "./pages/SpecialistProfileEdit";
import ClinicProfileEdit from "./pages/ClinicProfileEdit";
import CreateVirtualClinic from "./pages/CreateVirtualClinic";
import PatientProfileEdit from "./pages/PatientProfileEdit";
import AISymptomChecker from "./pages/AISymptomChecker";
import SpecialistAvailability from "./pages/SpecialistAvailability";
import ClinicStaff from "./pages/ClinicStaff";
import WaitlistManagement from "./pages/WaitlistManagement";
import VirtualClinicQueue from "./pages/VirtualClinicQueue";
import ClinicBranding from "./pages/ClinicBranding";
import ClinicIntegrations from "./pages/ClinicIntegrations";
import ClinicRevenueSplits from "./pages/ClinicRevenueSplits";
import Referrals from "./pages/Referrals";
import LabOrders from "./pages/LabOrders";
import CarePathways from "./pages/CarePathways";
import RPMDashboard from "./pages/RPMDashboard";
import ProxyAccess from "./pages/ProxyAccess";
import CommunityQA from "./pages/CommunityQA";
import AIFinance from "./pages/AIFinance";
import PublicClinicPage from "./pages/PublicClinicPage";
import EHDSCompliance from "./pages/EHDSCompliance";
import ReviewModeration from "./pages/ReviewModeration";
import Complaints from "./pages/Complaints";
import ComplaintManagement from "./pages/ComplaintManagement";
import InsuranceVerification from "./pages/InsuranceVerification";
import ClaimsManagement from "./pages/ClaimsManagement";
import TeamChat from "./pages/TeamChat";
import EmergencyProtocols from "./pages/EmergencyProtocols";
import SpecialistForums from "./pages/SpecialistForums";
import CalendarSync from "./pages/CalendarSync";
import CostEstimator from "./pages/CostEstimator";
import DocumentSharing from "./pages/DocumentSharing";
import DataExport from "./pages/DataExport";
import PatientInsuranceCheck from "./pages/PatientInsuranceCheck";
import BrowseReviews from "./pages/BrowseReviews";
import InsuranceManagement from "./pages/InsuranceManagement";
import MediationChat from "./pages/MediationChat";
import ReviewResponse from "./pages/ReviewResponse";
import ReviewAppeals from "./pages/ReviewAppeals";
import VisitConfirmation from "./pages/VisitConfirmation";
import SupportTickets from "./pages/SupportTickets";
import ProcedureCatalog from "./pages/ProcedureCatalog";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* ROOT REDIRECT */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            
            {/* PUBLIC PAGES */}
            <Route path="/home" element={<Home />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/for-patients" element={<ForPatients />} />
            <Route path="/for-specialists" element={<ForSpecialists />} />
            <Route path="/for-clinics" element={<ForClinics />} />
            <Route path="/about" element={<About />} />
            <Route path="/about/careers" element={<Careers />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* SEARCH */}
            <Route path="/search" element={<Navigate to="/search/specialists" replace />} />
            <Route path="/search/specialists" element={<Search />} />
            <Route path="/search/clinics" element={<SearchClinics />} />
            <Route path="/specialists/:id" element={<SpecialistProfile />} />
            <Route path="/book/:id" element={<BookAppointment />} />
            
            {/* AUTH */}
            <Route path="/auth" element={<Auth />} />
            
            {/* PATIENT PORTAL */}
            <Route path="/patient/dashboard" element={<PatientDashboardHome />} />
            <Route path="/dashboard" element={<PatientDashboardHome />} />
            <Route path="/patient/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<PatientProfileEdit />} />
            <Route path="/patient/appointments" element={<Appointments />} />
            <Route path="/patient/appointments/:id" element={<AppointmentDetails />} />
            <Route path="/patient/prescriptions" element={<Prescriptions />} />
            <Route path="/patient/medical-records" element={<MedicalRecords />} />
            <Route path="/patient/medical-records/upload" element={<UploadMedicalRecord />} />
            <Route path="/patient/messages" element={<Messages />} />
            <Route path="/patient/payments" element={<Payments />} />
            <Route path="/patient/family-members" element={<FamilyMembers />} />
            <Route path="/patient/favorites" element={<Favorites />} />
            <Route path="/patient/notifications" element={<Notifications />} />
            <Route path="/patient/symptom-checker" element={<AISymptomChecker />} />
            
            {/* SPECIALIST PORTAL */}
            <Route path="/specialist/dashboard" element={<SpecialistDashboard />} />
            <Route path="/specialist/profile" element={<Profile />} />
            <Route path="/specialist/profile/edit" element={<SpecialistProfileEdit />} />
            <Route path="/specialist/create-virtual-clinic" element={<CreateVirtualClinic />} />
            <Route path="/specialist/availability" element={<SpecialistAvailability />} />
            <Route path="/specialist/time-off" element={<SpecialistTimeOff />} />
            <Route path="/specialist/appointments" element={<Appointments />} />
            <Route path="/specialist/appointments/:id" element={<AppointmentDetails />} />
            <Route path="/specialist/prescriptions/create/:appointmentId" element={<CreatePrescription />} />
            <Route path="/specialist/soap-notes/create/:appointmentId" element={<CreateSOAPNote />} />
            <Route path="/specialist/reviews/create/:appointmentId" element={<CreateReview />} />
            <Route path="/specialist/messages" element={<Messages />} />
            <Route path="/specialist/payments" element={<Payments />} />
            <Route path="/specialist/notifications" element={<Notifications />} />
            <Route path="/specialist/availability" element={<SpecialistAvailability />} />
            <Route path="/specialist/waitlist" element={<WaitlistManagement />} />
            <Route path="/specialist/virtual-clinic-queue" element={<VirtualClinicQueue />} />
            <Route path="/specialist/analytics" element={<Analytics />} />
            
            {/* CLINIC PORTAL */}
            <Route path="/clinic/dashboard" element={<ClinicDashboard />} />
            <Route path="/clinic/settings" element={<ClinicSettings />} />
            <Route path="/clinic/profile/edit" element={<ClinicProfileEdit />} />
            <Route path="/clinic/staff" element={<ClinicStaff />} />
            <Route path="/clinic/branding" element={<ClinicBranding />} />
            <Route path="/clinic/revenue-splits" element={<ClinicRevenueSplits />} />
            <Route path="/clinic/waitlist" element={<WaitlistManagement />} />
            <Route path="/clinic/virtual-clinic-queue" element={<VirtualClinicQueue />} />
            <Route path="/clinic/appointments" element={<Appointments />} />
            <Route path="/clinic/appointments/:id" element={<AppointmentDetails />} />
            <Route path="/clinic/messages" element={<Messages />} />
            <Route path="/clinic/notifications" element={<Notifications />} />
            <Route path="/clinic/analytics" element={<Analytics />} />
            <Route path="/clinic/integrations" element={<ClinicIntegrations />} />
            <Route path="/clinic/:slug" element={<PublicClinicPage />} />
            
            {/* CLINICAL WORKFLOWS */}
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/lab-orders" element={<LabOrders />} />
            <Route path="/care-pathways" element={<CarePathways />} />
            <Route path="/rpm-dashboard" element={<RPMDashboard />} />
            <Route path="/proxy-access" element={<ProxyAccess />} />
            <Route path="/community" element={<CommunityQA />} />
            
            {/* FINANCIAL */}
            <Route path="/ai-finance" element={<AIFinance />} />
            
            {/* EHDS COMPLIANCE */}
            <Route path="/ehds-compliance" element={<EHDSCompliance />} />
            
            {/* REVIEW & COMPLAINT MANAGEMENT */}
            <Route path="/reviews/moderation" element={<ReviewModeration />} />
            <Route path="/reviews/browse" element={<BrowseReviews />} />
            <Route path="/reviews/appeals" element={<ReviewAppeals />} />
            <Route path="/reviews/:reviewId/respond" element={<ReviewResponse />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/complaints/:complaintId/mediation" element={<MediationChat />} />
            <Route path="/complaint-management" element={<ComplaintManagement />} />
            <Route path="/insurance/verification" element={<InsuranceVerification />} />
            <Route path="/insurance/management" element={<InsuranceManagement />} />
            <Route path="/claims" element={<ClaimsManagement />} />
            <Route path="/team-chat" element={<TeamChat />} />
            <Route path="/emergency-protocols" element={<EmergencyProtocols />} />
            <Route path="/forums" element={<SpecialistForums />} />
            <Route path="/calendar-sync" element={<CalendarSync />} />
            <Route path="/cost-estimator" element={<CostEstimator />} />
            <Route path="/document-sharing" element={<DocumentSharing />} />
            <Route path="/data-export" element={<DataExport />} />
            <Route path="/patient/insurance-check" element={<PatientInsuranceCheck />} />
            <Route path="/visit-confirmation/:appointmentId" element={<VisitConfirmation />} />
            <Route path="/support/tickets" element={<SupportTickets />} />
            <Route path="/procedures" element={<ProcedureCatalog />} />
            
            {/* SHARED FEATURES */}
            <Route path="/instant-consultation" element={<InstantConsultation />} />
            <Route path="/consultation/:appointmentId" element={<VideoConsultation />} />
            
            {/* ADMIN */}
            <Route path="/admin/dashboard" element={<AdminPanel />} />
            <Route path="/admin/audit-logs" element={<AuditLogs />} />
            <Route path="/admin/sessions" element={<SessionManagement />} />
            
            {/* LEGAL */}
            <Route path="/legal/privacy" element={<PrivacyPolicy />} />
            <Route path="/legal/terms" element={<Terms />} />
            <Route path="/legal/hipaa" element={<HIPAACompliance />} />
            <Route path="/legal/cookies" element={<CookiePolicy />} />
            
            {/* LEGACY REDIRECTS */}
            <Route path="/dashboard" element={<Navigate to="/patient/dashboard" replace />} />
            <Route path="/profile" element={<Navigate to="/patient/profile" replace />} />
            <Route path="/appointments" element={<Navigate to="/patient/appointments" replace />} />
            <Route path="/appointments/:id" element={<Navigate to="/patient/appointments/:id" replace />} />
            <Route path="/prescriptions" element={<Navigate to="/patient/prescriptions" replace />} />
            <Route path="/medical-records" element={<Navigate to="/patient/medical-records" replace />} />
            <Route path="/medical-records/upload" element={<Navigate to="/patient/medical-records/upload" replace />} />
            <Route path="/messages" element={<Navigate to="/patient/messages" replace />} />
            <Route path="/payments" element={<Navigate to="/patient/payments" replace />} />
            <Route path="/family-members" element={<Navigate to="/patient/family-members" replace />} />
            <Route path="/favorites" element={<Navigate to="/patient/favorites" replace />} />
            <Route path="/notifications" element={<Navigate to="/patient/notifications" replace />} />
            <Route path="/analytics" element={<Navigate to="/specialist/analytics" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/audit-logs" element={<Navigate to="/admin/audit-logs" replace />} />
            <Route path="/sessions" element={<Navigate to="/admin/sessions" replace />} />
            <Route path="/privacy" element={<Navigate to="/legal/privacy" replace />} />
            <Route path="/terms" element={<Navigate to="/legal/terms" replace />} />
            <Route path="/hipaa" element={<Navigate to="/legal/hipaa" replace />} />
            <Route path="/cookies" element={<Navigate to="/legal/cookies" replace />} />
            <Route path="/careers" element={<Navigate to="/about/careers" replace />} />
            <Route path="/specialist/:id" element={<Navigate to="/specialists/:id" replace />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
