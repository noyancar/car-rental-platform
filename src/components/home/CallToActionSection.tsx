import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

const CallToActionSection: React.FC = () => {
  return (
    <section className="py-10 sm:py-16 md:py-20 bg-primary-800 text-white">
      <div className="container-custom text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display mb-4 sm:mb-6">
          Ready for Your Next Adventure?
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto px-4 sm:px-0">
          Join thousands of satisfied customers who have experienced the DriveLuxe difference.
        </p>
        <Link to="/register">
          <Button 
            variant="accent" 
            size="lg" 
            className="animate-pulse-slow"
          >
            Create Your Account Now
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default CallToActionSection; 