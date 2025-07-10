import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-secondary-800 text-white pt-8 sm:pt-12 md:pt-16 pb-6 sm:pb-8">
      <div className="container-custom mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center mb-3 sm:mb-4">
              <Car className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
              <span className="ml-1.5 sm:ml-2 text-base sm:text-lg md:text-xl font-bold">Noyan Car</span>
            </div>
            <p className="text-secondary-300 text-sm sm:text-base mb-4 sm:mb-6">
              Experience premium car rentals with exceptional service and luxury vehicles for any occasion.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-secondary-300 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-secondary-300 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-secondary-300 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-secondary-300 hover:text-white transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">Quick Links</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-sm sm:text-base">
              <li>
                <Link to="/how-it-works" className="text-secondary-300 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/deals" className="text-secondary-300 hover:text-white transition-colors">
                  Special Deals
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-secondary-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-secondary-300 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Categories */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">Car Categories</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-sm sm:text-base">
              <li>
                <Link to="/cars?category=luxury" className="text-secondary-300 hover:text-white transition-colors">
                  Luxury Cars
                </Link>
              </li>
              <li>
                <Link to="/cars?category=suv" className="text-secondary-300 hover:text-white transition-colors">
                  SUVs
                </Link>
              </li>
              <li>
                <Link to="/cars?category=sports" className="text-secondary-300 hover:text-white transition-colors">
                  Sports Cars
                </Link>
              </li>
              <li>
                <Link to="/cars?category=convertible" className="text-secondary-300 hover:text-white transition-colors">
                  Convertibles
                </Link>
              </li>
              <li>
                <Link to="/cars?category=electric" className="text-secondary-300 hover:text-white transition-colors">
                  Electric Vehicles
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">Contact Us</h3>
            <ul className="space-y-3 sm:space-y-4 text-sm sm:text-base">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 text-secondary-300 mt-0.5" />
                <span className="text-secondary-300">
                  123 Luxury Drive<br />
                  Beverly Hills, CA 90210
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-secondary-300" />
                <a href="tel:+11234567890" className="text-secondary-300 hover:text-white transition-colors">
                  (123) 456-7890
                </a>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-secondary-300" />
                <a href="mailto:info@noyancar.com" className="text-secondary-300 hover:text-white transition-colors">
                  info@noyancar.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-secondary-700 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-secondary-400">
          <p className="text-sm sm:text-base">© {new Date().getFullYear()} NoyanCar. All rights reserved.</p>
          <div className="mt-2 space-x-3 sm:space-x-4 text-sm sm:text-base">
            <Link to="/terms" className="text-secondary-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-secondary-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};