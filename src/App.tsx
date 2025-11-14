import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Layout components
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import ScrollToTop from './components/utils/ScrollToTop';

// Auth components
import { AuthModal } from './components/auth';

// Auth pages
import AuthCallback from './pages/auth/AuthCallback';

// Main pages
import { HomePage } from './pages/HomePage';
import CarsPage from './pages/cars/CarsPage';
import CarDetailsPage from './pages/cars/CarDetailsPage';
import BookingPage from './pages/bookings/BookingPage';
import BookingsListPage from './pages/bookings/BookingsListPage';
import BookingDetailsPage from './pages/bookings/BookingDetailsPage';
import PaymentPage from './pages/PaymentPage';
import PaymentCallbackPage from './pages/PaymentCallbackPage';
import PendingPaymentPage from './pages/PendingPaymentPage';
import HowItWorksPage from './pages/HowItWorksPage';
import DealsPage from './pages/DealsPage';
import ProfilePage from './pages/ProfilePage';
import QRStatsPage from './pages/QRStatsPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCars from './pages/admin/AdminCars';
import AdminBookings from './pages/admin/AdminBookings';
import AdminDiscountCodes from './pages/admin/AdminDiscountCodes';
import AdminCampaigns from './pages/admin/AdminCampaigns';
import AdminExtras from './pages/admin/AdminExtras';
import LocationManagement from './pages/admin/LocationManagement';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminCalendar from './pages/admin/AdminCalendar';

// Stores
import { useAuthStore } from './stores/authStore';
import { useLocationStore } from './stores/locationStore';
import CampaignSection from './components/layout/CampaignSection';

// Protected Route component
const ProtectedRoute: React.FC<{ element: React.ReactElement; adminOnly?: boolean }> = ({ 
  element, 
  adminOnly = false 
}) => {
  const { user, isAdmin, loading } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
      </div>
    );
  }
  
  // Show auth modal if user is not authenticated
  if (!loading && !user) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to access this page</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              Sign In
            </button>
          </div>
        </div>
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            mode="signin"
          />
        )}
      </>
    );
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" />;
  }
  
  return element;
};

function App() {
  const { getProfile } = useAuthStore();
  const { fetchLocations } = useLocationStore();

  useEffect(() => {
    // Initialize auth
    getProfile();
    // Pre-load locations for better UX
    fetchLocations();
  }, [getProfile, fetchLocations]);
  
  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        <CampaignSection/>
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/cars" element={<CarsPage />} />
            <Route path="/cars/:id" element={<CarDetailsPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/qr-stats" element={<QRStatsPage />} />
            
            {/* Semi-Protected routes - Allow anonymous but show auth modal at checkout */}
            <Route path="/booking/:carId" element={<BookingPage />} />
            <Route path="/payment/pending" element={<PendingPaymentPage />} />
            <Route path="/payment/:bookingId" element={<PaymentPage />} />
            <Route path="/payment/callback" element={<PaymentCallbackPage />} />
            
            {/* Protected routes */}
            <Route path="/bookings" element={
              <ProtectedRoute element={<BookingsListPage />} />
            } />
            <Route path="/bookings/:id" element={
              <ProtectedRoute element={<BookingDetailsPage />} />
            } />
            <Route path="/profile" element={
              <ProtectedRoute element={<ProfilePage />} />
            } />
            
            {/* Admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute element={<AdminDashboard />} adminOnly />
            } />
            <Route path="/admin/cars" element={
              <ProtectedRoute element={<AdminCars />} adminOnly />
            } />
            <Route path="/admin/bookings" element={
              <ProtectedRoute element={<AdminBookings />} adminOnly />
            } />
            <Route path="/admin/extras" element={
              <ProtectedRoute element={<AdminExtras />} adminOnly />
            } />
            <Route path="/admin/discount-codes" element={
              <ProtectedRoute element={<AdminDiscountCodes />} adminOnly />
            } />
            <Route path="/admin/campaigns" element={
              <ProtectedRoute element={<AdminCampaigns />} adminOnly />
            } />
            <Route path="/admin/locations" element={
              <ProtectedRoute element={<LocationManagement />} adminOnly />
            } />
            <Route path="/admin/customers" element={
              <ProtectedRoute element={<AdminCustomers />} adminOnly />
            } />
            <Route path="/admin/calendar" element={
              <ProtectedRoute element={<AdminCalendar />} adminOnly />
            } />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </div>
      
      <Toaster position="top-right" closeButton richColors />
    </Router>
  );
}

export default App;