import React from 'react';
import { CalendarDays, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

const LOCATIONS = [
  { value: 'istanbul-airport', label: 'Istanbul Airport' },
  { value: 'istanbul-taksim', label: 'Istanbul Taksim' },
  { value: 'istanbul-kadikoy', label: 'Istanbul Kadıköy' },
  { value: 'ankara-airport', label: 'Ankara Airport' },
  { value: 'ankara-center', label: 'Ankara City Center' },
  { value: 'izmir-airport', label: 'Izmir Airport' },
  { value: 'izmir-center', label: 'Izmir City Center' },
  { value: 'antalya-airport', label: 'Antalya Airport' },
  { value: 'antalya-center', label: 'Antalya City Center' },
  { value: 'bodrum-airport', label: 'Bodrum Airport' },
  { value: 'bodrum-center', label: 'Bodrum City Center' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

interface HeroSectionProps {
  location: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  onLocationChange: (value: string) => void;
  onPickupDateChange: (value: string) => void;
  onPickupTimeChange: (value: string) => void;
  onReturnDateChange: (value: string) => void;
  onReturnTimeChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  location,
  pickupDate,
  pickupTime,
  returnDate,
  returnTime,
  onLocationChange,
  onPickupDateChange,
  onPickupTimeChange,
  onReturnDateChange,
  onReturnTimeChange,
  onSearch
}) => {
  return (
    <section className="relative min-h-[80vh] flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div 
          className="w-full h-full bg-cover bg-center" 
          style={{ 
            backgroundImage: 'url(https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750)',
            backgroundPosition: 'center 20%'
          }}
        >
          <div className="w-full h-full bg-black bg-opacity-60"></div>
        </div>
      </div>
      
      {/* Hero Content */}
      <div className="container-custom relative z-10 text-white pt-20 pb-32">
        <div className="max-w-3xl mb-12">
          <h1 className="text-5xl md:text-6xl font-display mb-6 animate-fade-in">
            Premium Car Rental <span className="text-primary-400">Made Easy</span>
          </h1>
          <p className="text-xl mb-8 text-white/90 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Explore our luxurious fleet and experience the road with style, comfort, and impeccable service.
          </p>
        </div>
        
        {/* Search Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <form onSubmit={onSearch} className="space-y-6">
            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-4 lg:col-span-1">
                <Select
                  label="Pickup & Return Location"
                  options={LOCATIONS}
                  value={location}
                  onChange={(e) => onLocationChange(e.target.value)}
                  className="bg-white/90 backdrop-blur-sm border-transparent focus:border-primary-500 text-secondary-800"
                />
              </div>
              
              {/* Pickup Date and Time */}
              <div className="md:col-span-2 lg:col-span-1">
                <Input
                  label="Pickup Date"
                  type="date"
                  value={pickupDate}
                  onChange={(e) => onPickupDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  leftIcon={<CalendarDays className="text-primary-600" size={18} />}
                  className="bg-white/90 backdrop-blur-sm border-transparent focus:border-primary-500 text-secondary-800"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-1">
                <Select
                  label="Pickup Time"
                  options={HOURS}
                  value={pickupTime}
                  onChange={(e) => onPickupTimeChange(e.target.value)}
                  className="bg-white/90 backdrop-blur-sm border-transparent focus:border-primary-500 text-secondary-800"
                />
              </div>
              
              {/* Return Date and Time */}
              <div className="md:col-span-2 lg:col-span-1">
                <Input
                  label="Return Date"
                  type="date"
                  value={returnDate}
                  onChange={(e) => onReturnDateChange(e.target.value)}
                  min={pickupDate}
                  leftIcon={<CalendarDays className="text-primary-600" size={18} />}
                  className="bg-white/90 backdrop-blur-sm border-transparent focus:border-primary-500 text-secondary-800"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-1">
                <Select
                  label="Return Time"
                  options={HOURS}
                  value={returnTime}
                  onChange={(e) => onReturnTimeChange(e.target.value)}
                  className="bg-white/90 backdrop-blur-sm border-transparent focus:border-primary-500 text-secondary-800"
                />
              </div>
            </div>
            
            {/* Search Button */}
            <div className="text-center">
              <Button 
                type="submit" 
                variant="primary"
                size="lg"
                leftIcon={<Search size={20} />}
                className="w-full md:w-auto min-w-[200px]"
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