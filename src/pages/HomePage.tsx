import React, { useEffect } from 'react';
import { useCarStore } from '../stores/carStore';
import { tracker } from '../lib/analytics/tracker';
import { SEO } from '../components/seo/SEO';

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

  // Track funnel stage 1: Homepage view
  tracker.trackFunnelStage(
    'homepage',                 // 1. stage (string)
    1,                          // 2. step (number) <-- You were missing this
    undefined,            // 3. carId (string?) <-- Pass undefined to skip this
    {                           // 4. metadata (any?)
      carsDisplayed: featuredCars.length,
    }
  );
}, [fetchFeaturedCars, featuredCars.length]);

  return (
    <>
      <SEO
        title="Car Rental Honolulu, Oahu | Affordable Hawaii Car Rentals"
        description="Rent the perfect car for your Oahu adventure with NYN Rentals. Wide selection of vehicles, transparent pricing, island-wide delivery. Daily, weekly, and monthly rentals available in Honolulu and across Hawaii."
        canonical="https://nynrentals.com/"
        ogType="website"
      />
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
    </>
  );
};

export default HomePage; 