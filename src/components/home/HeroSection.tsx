import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useSearchStore } from '../../stores/searchStore';

const LOCATIONS = [
  // $70 Delivery Fee
  { value: 'daniel-k-inouye-airport', label: 'Daniel K. Inouye International Airport' },
  
  // $50 Delivery Fee - Waikiki Hotels
  { value: 'alohilani-resort', label: 'Alohilani Resort Waikiki Beach' },
  { value: 'hyatt-regency-waikiki', label: 'Hyatt Regency Waikiki Beach Resort & Spa' },
  { value: 'ilikai-hotel', label: 'Ilikai Hotel & Luxury Suites' },
  { value: 'hale-koa-hotel', label: 'Hale Koa Hotel' },
  { value: 'hilton-hawaiian-village', label: 'Hilton Hawaiian Village Waikiki Beach Resort' },
  { value: 'sheraton-waikiki', label: 'Sheraton Waikiki' },
  { value: 'royal-hawaiian', label: 'The Royal Hawaiian, a Luxury Collection Resort' },
  { value: 'waikiki-beach-marriott', label: 'Waikiki Beach Marriott Resort & Spa' },
  { value: 'waikiki-grand-hotel', label: 'Waikiki Grand Hotel' },
  
  // $70 Delivery Fee
  //{ value: 'custom-location-10mi', label: 'Custom Location - Within 10mi radius' },
  
  // Ask for Quote
  //{ value: 'custom-location-outside', label: 'Any other location outside 10mi radius' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const { 
    searchParams, 
    updateSearchParams,
    setSearchParams,
    searchCars
  } = useSearchStore();
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Search for available cars with current parameters
    await searchCars();
    
    // Navigate to cars page
    navigate('/cars');
  };

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div 
          className="w-full h-full bg-cover bg-center animate-float" 
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1598135753163-6167c1a1ad65?auto=compress&cs=tinysrgb&w=1920&q=80)',
            backgroundPosition: 'center 30%'
          }}
        >
          <div className="w-full h-full bg-gradient-to-br from-primary-900/80 via-primary-800/60 to-accent-600/40"></div>
        </div>
      </div>
      
      {/* Hero Content */}
      <div className="container-custom relative z-10 text-white pt-20 pb-32">
        <div className="max-w-4xl mb-12 text-center mx-auto">
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 animate-slide-down whitespace-nowrap">
            <span className="bg-gradient-to-r from-accent-400 to-accent-200 bg-clip-text text-transparent drop-shadow-[3px_3px_6px_rgba(0,0,0,0.8)]"> Adventure Awaits You</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 animate-slide-up text-shadow" style={{ animationDelay: '0.2s' }}>
            Discover Hawaii's hidden gems with our premium 4x4 vehicles. From beaches to volcanoes, your island journey starts here.
          </p>
        </div>
        
        {/* Search Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-hawaii animate-slide-up max-w-5xl mx-auto" style={{ animationDelay: '0.4s' }}>
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Location - Full Width */}
            <div className="mb-4">
              <Select
                label="Pickup & Return Location"
                options={LOCATIONS}
                value={searchParams.location}
                onChange={(e) => updateSearchParams({ location: e.target.value })}
                className="bg-white/90 backdrop-blur-sm border-transparent focus:border-primary-500 text-secondary-800"
              />
            </div>
            
            {/* Date and Time Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pickup Date and Time - Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Pickup Date"
                    type="date"
                    value={searchParams.pickupDate}
                    onChange={(e) => updateSearchParams({ pickupDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    leftIcon={<CalendarDays className="text-primary-600" size={18} />}
                    className="bg-white/90 backdrop-blur-sm border-transparent focus:border-primary-500 text-secondary-800"
                  />
                </div>
                <div>
                  <Select
                    label="Pickup Time"
                    options={HOURS}
                    value={searchParams.pickupTime}
                    onChange={(e) => updateSearchParams({ pickupTime: e.target.value })}
                    className="bg-white/90 backdrop-blur-sm border-transparent focus:border-primary-500 text-secondary-800"
                  />
                </div>
              </div>
              
              {/* Return Date and Time - Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Return Date"
                    type="date"
                    value={searchParams.returnDate}
                    onChange={(e) => updateSearchParams({ returnDate: e.target.value })}
                    min={searchParams.pickupDate}
                    leftIcon={<CalendarDays className="text-primary-600" size={18} />}
                    className="bg-white/90 backdrop-blur-sm border-transparent focus:border-primary-500 text-secondary-800"
                  />
                </div>
                <div>
                  <Select
                    label="Return Time"
                    options={HOURS}
                    value={searchParams.returnTime}
                    onChange={(e) => updateSearchParams({ returnTime: e.target.value })}
                    className="bg-white/90 backdrop-blur-sm border-transparent focus:border-primary-500 text-secondary-800"
                  />
                </div>
              </div>
            </div>
            
            {/* Search Button */}
            <div className="text-center">
              <Button 
                type="submit" 
                variant="accent"
                size="lg"
                leftIcon={<Search size={20} />}
                className="w-full md:w-auto min-w-[200px] shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300"
              >
                Search Cars
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 