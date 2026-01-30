import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Mail, Phone, MapPin } from 'lucide-react';
import logo from '../../assets/images/logo.png';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-secondary-800 text-white pt-8 sm:pt-12 md:pt-16 pb-6 sm:pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 justify-items-center md:justify-items-start">
          {/* Brand */}
          <div className="text-center md:text-left max-w-xs">
            <div className="flex items-center justify-center md:justify-start mb-4">
              <img
                src={logo}
                alt="NYN Rentals Logo"
                className="h-7 w-7 md:h-8 md:w-8 object-contain"
              />
              <span className="ml-2 text-lg md:text-xl font-bold">NYN Rentals</span>
            </div>
            <p className="text-secondary-300 text-sm sm:text-base">
            Experience premium car rentals for any occasion with exceptional service.
            </p>
          </div>

          {/* Categories */}
          <div className="text-center md:text-left max-w-xs">
            <h3 className="text-lg font-semibold mb-4 text-white">Available Categories</h3>
            <p className="text-secondary-300 text-sm sm:text-base mb-3">
              Search by dates to explore our fleet:
            </p>
            <ul className="space-y-2 text-sm sm:text-base">
              <li className="text-secondary-300">• Luxury Cars</li>
              <li className="text-secondary-300">• SUVs</li>
              <li className="text-secondary-300">• Sports Cars</li>
              <li className="text-secondary-300">• Convertibles</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="text-center md:text-left max-w-xs">
            <h3 className="text-lg font-semibold mb-4 text-white">Contact Us</h3>
            <ul className="space-y-3 text-sm sm:text-base">
              <li className="flex items-start justify-center md:justify-start">
                <MapPin className="h-5 w-5 mr-2 text-secondary-300 mt-0.5 flex-shrink-0" />
                <span className="text-secondary-300 text-left">
                711 Ke’eaumoku St Garage<br />
                Honolulu HI 96814
                </span>
              </li>
              <li className="flex items-center justify-center md:justify-start">
                <Phone className="h-5 w-5 mr-2 text-secondary-300 flex-shrink-0" />
                <a href="tel:+18089091272" className="text-secondary-300 hover:text-white transition-colors">
                  +1 808-909-1272
                </a>
              </li>
              <li className="flex items-center justify-center md:justify-start">
                <Mail className="h-5 w-5 mr-2 text-secondary-300 flex-shrink-0" />
                <a href="mailto:info@nynrentals.com" className="text-secondary-300 hover:text-white transition-colors">
                info@nynrentals.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-secondary-700 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center text-secondary-400">
          <p className="text-sm sm:text-base">© {new Date().getFullYear()} NYN Rentals. All rights reserved.</p>
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