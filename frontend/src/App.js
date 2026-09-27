import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import PromoBanner from './components/PromoBanner';
import CookieConsent from './components/CookieConsent';
import PageviewTracker from './components/PageviewTracker';
import ConsultationWidget from './components/ConsultationWidget';
import VisitorTools from './components/VisitorTools';
import ThemeProvider from './components/ThemeProvider';
import { LanguageProvider } from './i18n';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import Services from './pages/Services';
import ServiceAndSolution from './pages/ServiceAndSolution';
import Booking from './pages/Booking';
import BookingConfirmation from './pages/BookingConfirmation';
import BookingHistory from './pages/BookingHistory';
import Callback from './pages/Callback';
import MobileBookingPopup from './components/MobileBookingPopup';
import ForgotPassword from './pages/ForgotPassword';
import { BRANDING } from './utils/branding';
import AdminSessionManager from './components/AdminSessionManager';
import SolarCalculator from './pages/SolarCalculator';
import Products from './pages/Products';
import BecomePartner from './pages/BecomePartner';
import About from './pages/About';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import Subsidies from './pages/Subsidies';

// Lazy-loaded pages — only downloaded when the user visits them
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings'));
const AdminServices = lazy(() => import('./pages/admin/AdminServices'));
const WhatsAppDashboard = lazy(() => import('./pages/admin/WhatsAppDashboard'));
const SubAdmins = lazy(() => import('./pages/admin/SubAdmins'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminTransactions = lazy(() => import('./pages/admin/AdminTransactions'));
const AdminLeads = lazy(() => import('./pages/admin/AdminLeads'));
const AdminTestimonials = lazy(() => import('./pages/admin/AdminTestimonials'));
const AdminSiteSettings = lazy(() => import('./pages/admin/AdminSiteSettings'));
const AdminProjects = lazy(() => import('./pages/admin/AdminProjects'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminCatalog = lazy(() => import('./pages/admin/AdminCatalog'));
const AdminEmail = lazy(() => import('./pages/admin/AdminEmail'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const UnifiedLogin = lazy(() => import('./pages/UnifiedLogin'));
const CustomerPortal = lazy(() => import('./pages/CustomerPortal'));
const CustomerBookingDetail = lazy(() => import('./pages/CustomerBookingDetail'));
const Gallery = lazy(() => import('./pages/Gallery'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const CRMDashboard = lazy(() => import('./pages/crm/CRMDashboard'));
const CRMLeads = lazy(() => import('./pages/crm/CRMLeads'));
const CRMVisitors = lazy(() => import('./pages/crm/CRMVisitors'));
const CRMCapture = lazy(() => import('./pages/crm/CRMCapture'));
const CRMCommunication = lazy(() => import('./pages/crm/CRMCommunication'));
const CRMIntegrations = lazy(() => import('./pages/crm/CRMIntegrations'));

function WithNavbar({ children }) {
  return (
    <>
      <Navbar />
      <PromoBanner />
      <main className="flex-grow">{children}</main>
      <Footer />
    </>
  );
}


function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isPortalPage = location.pathname.startsWith('/portal');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <ScrollToTop />
      <PageviewTracker />
      {!isAdminPage && !isPortalPage && <CookieConsent />}
      {!isAdminPage && !isPortalPage && <ConsultationWidget />}
      {!isAdminPage && !isPortalPage && <VisitorTools />}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' },
          success: { style: { background: BRANDING.colors.primary[600] } },
          error: { style: { background: '#dc2626' } },
        }}
      />
      <AdminSessionManager />
      {!isAdminPage && !isPortalPage && <MobileBookingPopup />}

      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div></div>}>
        <Routes>
      
        {/* ── Admin routes (no navbar/footer) ── */}
        <Route path="/admin/login"        element={<UnifiedLogin />} />
        <Route path="/admin"              element={<AdminDashboard />} />
        <Route path="/admin/bookings"     element={<AdminBookings />} />
        <Route path="/admin/services"     element={<AdminServices />} />
        <Route path="/admin/whatsapp"     element={<WhatsAppDashboard />} />
        <Route path="/admin/subadmins"    element={<SubAdmins />} />
        <Route path="/admin/customers"    element={<AdminCustomers />} />
        <Route path="/admin/transactions" element={<AdminTransactions />} />
        <Route path="/admin/leads"        element={<AdminLeads />} />
        <Route path="/admin/testimonials"   element={<AdminTestimonials />} />
        <Route path="/admin/site-settings"  element={<AdminSiteSettings />} />
        <Route path="/admin/projects"       element={<AdminProjects />} />
        <Route path="/admin/orders"         element={<AdminOrders />} />
        <Route path="/admin/catalog"        element={<AdminCatalog />} />
        <Route path="/admin/email"          element={<AdminEmail />} />
        <Route path="/admin/analytics"      element={<AdminAnalytics />} />

        {/* ── Customer portal (no navbar/footer) ── */}
        <Route path="/portal/login"               element={<UnifiedLogin />} />
        <Route path="/portal"                     element={<CustomerPortal />} />
        <Route path="/portal/booking/:bookingId"  element={<CustomerBookingDetail />} />
        <Route path="/forgot-password"            element={<ForgotPassword />} />

        {/* ── Public website (with navbar/footer) ── */}
        <Route path="/"                element={<WithNavbar><HomePage /></WithNavbar>} />
        <Route path="/services"        element={<WithNavbar><Services /></WithNavbar>} />
        <Route path="/solutions"       element={<WithNavbar><ServiceAndSolution /></WithNavbar>} />
        <Route path="/booking"         element={<WithNavbar><Booking /></WithNavbar>} />
        <Route path="/booking/:serviceId"                   element={<WithNavbar><Booking /></WithNavbar>} />
        <Route path="/booking-confirmation/:bookingId"      element={<WithNavbar><BookingConfirmation /></WithNavbar>} />
        <Route path="/booking-history" element={<WithNavbar><BookingHistory /></WithNavbar>} />
        <Route path="/callback"        element={<WithNavbar><Callback /></WithNavbar>} />
        <Route path="/login"           element={<UnifiedLogin />} />
        <Route path="/solar-calculator" element={<WithNavbar><SolarCalculator /></WithNavbar>} />
        <Route path="/gallery"         element={<WithNavbar><Gallery /></WithNavbar>} />
        <Route path="/products"        element={<WithNavbar><Products /></WithNavbar>} />
        <Route path="/products/:id"     element={<WithNavbar><ProductDetail /></WithNavbar>} />
        <Route path="/track-order"     element={<WithNavbar><TrackOrder /></WithNavbar>} />
        <Route path="/become-partner"  element={<WithNavbar><BecomePartner /></WithNavbar>} />
        <Route path="/about"           element={<WithNavbar><About /></WithNavbar>} />
        <Route path="/faq"             element={<WithNavbar><FAQ /></WithNavbar>} />
        <Route path="/contact"         element={<WithNavbar><Contact /></WithNavbar>} />
        <Route path="/projects-gallery" element={<WithNavbar><ProjectsPage /></WithNavbar>} />
        <Route path="/subsidies"       element={<WithNavbar><Subsidies /></WithNavbar>} />
        <Route path="*"                element={<WithNavbar><HomePage /></WithNavbar>} />
        {/* ── CRM Portal ── */}
        <Route path="/crm"               element={<CRMDashboard />} />
        <Route path="/crm/leads"         element={<CRMLeads />} />
        <Route path="/crm/visitors"      element={<CRMVisitors />} />
        <Route path="/crm/capture"       element={<CRMCapture />} />
        <Route path="/crm/communication" element={<CRMCommunication />} />
        <Route path="/crm/integrations"  element={<CRMIntegrations />} />
      </Routes>
        </Suspense>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
    <ThemeProvider>
    <Router>
      <AppContent />
    </Router>
    </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
