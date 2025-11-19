import React, { useEffect } from 'react';
import { useCarStore } from '../stores/carStore';

// Import components using barrel export
import {
  HeroSection,
  FeaturesSection,
  FeaturedCarsSection,
  TestimonialsSection,
  SocialMediaSection
} from '../components/home';
import CampaignSection from '../components/layout/CampaignSection';
import SimpleBanner from '../components/home/SimpleBanner';

export const HomePage: React.FC = () => {
  const { featuredCars, fetchFeaturedCars, loading } = useCarStore();

  useEffect(() => {
    fetchFeaturedCars();
  }, [fetchFeaturedCars]);
  
  return (
    <div>
      <HeroSection />
      
      <FeaturedCarsSection
        featuredCars={featuredCars}
        loading={loading}
      />

      <SimpleBanner
        title="Adventure Awaits You"
        subtitle="Discover Hawaii's hidden gems with our premium vehicles. Your island journey starts here."
        backgroundImage="https://azu023qxep7q7kax.public.blob.vercel-storage.com/bgimg.jpeg"
        backgroundColor="#1e1e1eff" // optional, defaults to dark gray
      />

      <FeaturesSection />

      <SocialMediaSection />

      <TestimonialsSection />
    </div>
  );
};

export default HomePage; 