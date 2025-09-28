import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Car, User, Menu, X, ShieldCheck, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { AuthModal } from '../auth';
import SimpleNotificationBadge from '../admin/SimpleNotificationBadge';

export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const location = useLocation();
  const navigate = useNavigate();
  
  const { user, isAdmin, signOut } = useAuthStore();
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);
  
  const handleSignInClick = () => {
    setAuthModalMode('signin');
    setShowAuthModal(true);
  };
  
  const handleSignUpClick = () => {
    setAuthModalMode('signup');
    setShowAuthModal(true);
  };
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  
  return (
    <>
      <header 
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled || isMenuOpen || location.pathname !== '/' 
            ? 'bg-white shadow-md py-2 sm:py-3' 
            : 'bg-transparent py-3 sm:py-4 md:py-5'
        }`}
      >
        <div className="container-custom mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <Car className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary-800" />
            <span className="ml-1.5 sm:ml-2 text-base sm:text-lg md:text-xl font-bold text-primary-800">NYN Rentals</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/how-it-works" 
              className={`font-medium hover:text-primary-700 transition-colors ${
                location.pathname === '/how-it-works' ? 'text-primary-800' : 'text-secondary-700'
              }`}
            >
              How It Works
            </Link>
            <Link 
              to="/deals" 
              className={`font-medium hover:text-primary-700 transition-colors ${
                location.pathname === '/deals' ? 'text-primary-800' : 'text-secondary-700'
              }`}
            >
              Deals
            </Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                {isAdmin && (
                  <div className="flex items-center space-x-2">
                    <SimpleNotificationBadge />
                    <Link 
                      to="/admin" 
                      className="flex items-center space-x-1 text-accent-600 hover:text-accent-700"
                    >
                      <ShieldCheck size={20} />
                      <span>Admin</span>
                    </Link>
                  </div>
                )}
                <Link 
                  to="/bookings" 
                  className={`font-medium hover:text-primary-700 transition-colors ${
                    location.pathname.includes('/bookings') ? 'text-primary-800' : 'text-secondary-700'
                  }`}
                >
                  My Bookings
                </Link>
                <Link 
                  to="/profile" 
                  className={`font-medium hover:text-primary-700 transition-colors ${
                    location.pathname === '/profile' ? 'text-primary-800' : 'text-secondary-700'
                  }`}
                >
                  Profile
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleSignInClick}
                leftIcon={<User size={18} />}
              >
                Sign In
              </Button>
            )}
          </nav>
          
          <button 
            className="md:hidden text-secondary-800 focus:outline-none p-1"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </button>
        </div>
        
        {isMenuOpen && (
          <div className="md:hidden bg-white shadow-md">
            <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-2 sm:space-y-3">
              <Link 
                to="/how-it-works" 
                className={`block py-2 font-medium ${
                  location.pathname === '/how-it-works' ? 'text-primary-800' : 'text-secondary-700'
                }`}
              >
                How It Works
              </Link>
              <Link 
                to="/deals" 
                className={`block py-2 font-medium ${
                  location.pathname === '/deals' ? 'text-primary-800' : 'text-secondary-700'
                }`}
              >
                Deals
              </Link>
              
              {user ? (
                <>
                  {isAdmin && (
                    <Link 
                      to="/admin" 
                      className="flex items-center space-x-1 py-2 text-accent-600 hover:text-accent-700"
                    >
                      <ShieldCheck size={20} />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  <Link 
                    to="/bookings" 
                    className={`block py-2 font-medium ${
                      location.pathname.includes('/bookings') ? 'text-primary-800' : 'text-secondary-700'
                    }`}
                  >
                    My Bookings
                  </Link>
                  <Link 
                    to="/profile" 
                    className={`block py-2 font-medium ${
                      location.pathname === '/profile' ? 'text-primary-800' : 'text-secondary-700'
                    }`}
                  >
                    Profile
                  </Link>
                  <Button 
                    variant="outline" 
                    onClick={handleSignOut}
                    className="w-full mt-2"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <div className="pt-2">
                  <Button 
                    variant="primary" 
                    fullWidth
                    onClick={handleSignInClick}
                    leftIcon={<User size={18} />}
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />
    </>
  );
};