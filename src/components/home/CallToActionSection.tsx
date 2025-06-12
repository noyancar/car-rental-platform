import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

const CallToActionSection: React.FC = () => {
  return (
    <section className="py-20 bg-primary-800 text-white">
      <div className="container-custom text-center">
        <h2 className="text-3xl md:text-4xl font-display mb-6">
          Ready for Your Next Adventure?
        </h2>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
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