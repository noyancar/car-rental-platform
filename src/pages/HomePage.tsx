import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCarStore } from '../stores/carStore';

// Import components using barrel export
import {
  HeroSection,
  FeaturesSection,
  FeaturedCarsSection,
  TestimonialsSection
} from '../components/home';

export const HomePage: React.FC = () => {
  const { featuredCars, fetchFeaturedCars, loading } = useCarStore();
  const location = useLocation();

  useEffect(() => {
    fetchFeaturedCars();
  }, [fetchFeaturedCars]);

  useEffect(() => {
    // Check if we should scroll to top
    if (location.state?.scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Clear the state to prevent scrolling on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);
  
  return (
    <div>
      <HeroSection />
      
      <FeaturesSection />
      
      <FeaturedCarsSection 
        featuredCars={featuredCars}
        loading={loading}
      />
      
      <TestimonialsSection />
    </div>
  );
};

export default HomePage; 