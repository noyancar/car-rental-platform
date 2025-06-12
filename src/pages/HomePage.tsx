import React, { useEffect } from 'react';
import { useCarStore } from '../stores/carStore';

// Import components using barrel export
import {
  HeroSection,
  FeaturesSection,
  FeaturedCarsSection,
  TestimonialsSection,
  CallToActionSection
} from '../components/home';

export const HomePage: React.FC = () => {
  const { featuredCars, fetchFeaturedCars, loading } = useCarStore();
  
  useEffect(() => {
    fetchFeaturedCars();
  }, [fetchFeaturedCars]);
  
  return (
    <div>
      <HeroSection />
      
      <FeaturesSection />
      
      <FeaturedCarsSection 
        featuredCars={featuredCars}
        loading={loading}
      />
      
      <CallToActionSection />
      
      <TestimonialsSection />
    </div>
  );
};

export default HomePage; 