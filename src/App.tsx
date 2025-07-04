import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Layout components
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import AuthCallback from './pages/auth/AuthCallback';

// Main pages
import { HomePage } from './pages/HomePage';
import CarsPage from './pages/cars/CarsPage';
import CarDetailsPage from './pages/cars/CarDetailsPage';
import BookingPage from './pages/bookings/BookingPage';
import BookingsListPage from './pages/bookings/BookingsListPage';
import BookingDetailsPage from './pages/bookings/BookingDetailsPage';
import PaymentPage from './pages/PaymentPage';
import PendingPaymentPage from './pages/PendingPaymentPage';
import HowItWorksPage from './pages/HowItWorksPage';
import DealsPage from './pages/DealsPage';
import ProfilePage from './pages/ProfilePage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCars from './pages/admin/AdminCars';
import AdminBookings from './pages/admin/AdminBookings';
import AdminDiscountCodes from './pages/admin/AdminDiscountCodes';
import AdminCampaigns from './pages/admin/AdminCampaigns';
import AdminExtras from './pages/admin/AdminExtras';
import LocationManagement from './pages/admin/LocationManagement';

// Auth store
import { useAuthStore } from './stores/authStore';

// Protected Route component
const ProtectedRoute: React.FC<{ element: React.ReactElement; adminOnly?: boolean }> = ({ 
  element, 
  adminOnly = false 
}) => {
  const { user, isAdmin, loading } = useAuthStore();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" />;
  }
  
  return element;
};

function App() {
  const { getProfile } = useAuthStore();
  
  useEffect(() => {
    getProfile();
  }, [getProfile]);
  
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-16">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/cars" element={<CarsPage />} />
            <Route path="/cars/:id" element={<CarDetailsPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/deals" element={<DealsPage />} />
            
            {/* Semi-Protected routes - Allow anonymous but show auth modal at checkout */}
            <Route path="/booking/:carId" element={<BookingPage />} />
            <Route path="/payment/pending" element={<PendingPaymentPage />} />
            <Route path="/payment/:bookingId" element={<PaymentPage />} />
            
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