import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Car, User, Menu, X, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../stores/authStore';

export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  
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
  
  return (
    <header 
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled || isMenuOpen || location.pathname !== '/' 
          ? 'bg-white shadow-md py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="container-custom mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <Car className="h-8 w-8 text-primary-800" />
          <span className="ml-2 text-xl font-bold text-primary-800">DriveLuxe</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            to="/cars" 
            className={`font-medium hover:text-primary-700 transition-colors ${
              location.pathname.includes('/cars') ? 'text-primary-800' : 'text-secondary-700'
            }`}
          >
            Browse Cars
          </Link>
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
                <Link 
                  to="/admin" 
                  className="flex items-center space-x-1 text-accent-600 hover:text-accent-700"
                >
                  <ShieldCheck size={20} />
                  <span>Admin</span>
                </Link>
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
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">Register</Button>
              </Link>
            </div>
          )}
        </nav>
        
        <button 
          className="md:hidden text-secondary-800 focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>
      
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-md">
          <div className="container mx-auto py-4 space-y-3">
            <Link 
              to="/cars" 
              className={`block py-2 font-medium ${
                location.pathname.includes('/cars') ? 'text-primary-800' : 'text-secondary-700'
              }`}
            >
              Browse Cars
            </Link>
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
                  onClick={() => signOut()}
                  className="w-full mt-2"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link to="/login" className="w-full">
                  <Button variant="outline" fullWidth>Sign In</Button>
                </Link>
                <Link to="/register" className="w-full">
                  <Button variant="primary" fullWidth>Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};