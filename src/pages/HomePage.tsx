import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarStore } from '../stores/carStore';

// Import components using barrel export
import {
  HeroSection,
  FeaturesSection,
  FeaturedCarsSection,
  TestimonialsSection,
  CallToActionSection
} from '../components/home';

const HomePage: React.FC = () => {
  const { featuredCars, fetchFeaturedCars, loading } = useCarStore();
  const navigate = useNavigate();
  
  // Form state
  const [location, setLocation] = useState('istanbul-airport');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('10:00');
  
  useEffect(() => {
    // Set default dates (today and tomorrow)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setPickupDate(today.toISOString().split('T')[0]);
    setReturnDate(tomorrow.toISOString().split('T')[0]);
    
    fetchFeaturedCars();
  }, [fetchFeaturedCars]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create search params
    const searchParams = new URLSearchParams({
      location,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime
    });
    
    // Navigate to cars page with search params
    navigate(`/cars?${searchParams.toString()}`);
  };
  
  return (
    <div>
      <HeroSection 
        location={location}
        pickupDate={pickupDate}
        pickupTime={pickupTime}
        returnDate={returnDate}
        returnTime={returnTime}
        onLocationChange={setLocation}
        onPickupDateChange={setPickupDate}
        onPickupTimeChange={setPickupTime}
        onReturnDateChange={setReturnDate}
        onReturnTimeChange={setReturnTime}
        onSearch={handleSearch}
      />
      
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