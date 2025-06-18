import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Users, Gauge, Car as CarIcon, CalendarDays, CheckCircle, AlertCircle, Fuel, Palette, Car } from 'lucide-react';
import { format, addDays, isBefore, isValid, parseISO } from 'date-fns';
import { Button } from '../../components/ui/Button';
import { SimpleImageViewer } from '../../components/ui/SimpleImageViewer';
import { useCarStore } from '../../stores/carStore';
import { useSearchStore } from '../../stores/searchStore';
import { useBookingStore } from '../../stores/bookingStore';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { toast } from 'sonner';

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

const CarDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentCar, loading, error, fetchCarById } = useCarStore();
  const { searchParams, isSearchPerformed, updateSearchParams, searchCars } = useSearchStore();
  const { checkAvailability, isCheckingAvailability, calculatePrice } = useBookingStore();
  
  // Local state for date selection
  const [showDateSelector, setShowDateSelector] = useState(!isSearchPerformed);
  const [localPickupDate, setLocalPickupDate] = useState(
    searchParams.pickupDate || format(new Date(), 'yyyy-MM-dd')
  );
  const [localReturnDate, setLocalReturnDate] = useState(
    searchParams.returnDate || format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  );
  const [localPickupTime, setLocalPickupTime] = useState(searchParams.pickupTime || '10:00');
  const [localReturnTime, setLocalReturnTime] = useState(searchParams.returnTime || '10:00');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState('');
  const [rentalDuration, setRentalDuration] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  
  useEffect(() => {
    if (id) {
      fetchCarById(parseInt(id));
    }
  }, [id, fetchCarById]);
  
  // Validate dates
  const validateDates = () => {
    if (!localPickupDate || !localReturnDate) {
      setValidationMessage('Please select both dates');
      return false;
    }

    const start = parseISO(localPickupDate);
    const end = parseISO(localReturnDate);
    
    if (!isValid(start) || !isValid(end)) {
      setValidationMessage('Invalid date format');
      return false;
    }

    if (isBefore(end, start)) {
      setValidationMessage('Return date must be after pickup date');
      return false;
    }

    setValidationMessage('');
    return true;
  };
  
  // Calculate rental duration and price when dates change
  useEffect(() => {
    const updateDurationAndPrice = async () => {
      if (localPickupDate && localReturnDate && currentCar && validateDates()) {
        // Tarih ve saat bilgilerini birleştirerek tam tarih oluştur
        const startDateTime = new Date(`${localPickupDate}T${localPickupTime}`);
        const endDateTime = new Date(`${localReturnDate}T${localReturnTime}`);
        
        // Milisaniye cinsinden farkı hesapla
        const diffMs = endDateTime.getTime() - startDateTime.getTime();
        
        // Gün sayısını hesapla (yukarı yuvarlayarak)
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        setRentalDuration(days);
        
        // Fiyat hesaplama (eğer calculatePrice fonksiyonu kullanılabilirse)
        if (id && calculatePrice) {
          const price = await calculatePrice(parseInt(id), localPickupDate, localReturnDate, localPickupTime, localReturnTime);
          setTotalPrice(price);
        } else if (currentCar.price_per_day) {
          // Fallback olarak basit hesaplama
          setTotalPrice(currentCar.price_per_day * days);
        }
      }
    };
    
    updateDurationAndPrice();
  }, [localPickupDate, localReturnDate, localPickupTime, localReturnTime, currentCar, id, calculatePrice]);
  
  // Check availability when dates change
  useEffect(() => {
    const checkCarAvailability = async () => {
      if (!id || !localPickupDate || !localReturnDate || !validateDates()) {
        setIsAvailable(null);
        return;
      }
      
      const available = await checkAvailability(parseInt(id), localPickupDate, localReturnDate, localPickupTime, localReturnTime);
      setIsAvailable(available);
    };
    
    if (showDateSelector && localPickupDate && localReturnDate) {
      const timeoutId = setTimeout(checkCarAvailability, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [id, localPickupDate, localReturnDate, localPickupTime, localReturnTime, showDateSelector, checkAvailability]);
  
  // Function to proceed to booking
  const handleBookNow = () => {
    // If search has been performed, we already have date parameters
    if (isSearchPerformed && !showDateSelector) {
      // Navigate to booking page with search parameters
      navigate(`/booking/${id}`);
      return;
    }
    
    // Validate dates first
    if (!validateDates()) {
      toast.error(validationMessage);
      return;
    }
    
    // Check if car is available
    if (isAvailable === false) {
      toast.error('Car is not available for selected dates. Please choose different dates.');
      return;
    }
    
    // Otherwise, update search parameters with local values and proceed
    updateSearchParams({
      pickupDate: localPickupDate,
      returnDate: localReturnDate,
      pickupTime: localPickupTime,
      returnTime: localReturnTime
    });
    
    // Navigate to booking page
    navigate(`/booking/${id}`);
  };
  
  // Function to toggle date selector
  const toggleDateSelector = () => {
    setShowDateSelector(!showDateSelector);
    // Reset availability when toggling
    setIsAvailable(null);
  };
  
  // Handle date changes
  const handlePickupDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setLocalPickupDate(newDate);
    
    // Reset availability
    setIsAvailable(null);
    
    // Clear return date if it's before new pickup date
    if (localReturnDate && isBefore(parseISO(localReturnDate), parseISO(newDate))) {
      setLocalReturnDate('');
    }
  };
  
  const handleReturnDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalReturnDate(e.target.value);
    setIsAvailable(null);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex flex-col items-center justify-center">
        <div className="bg-error-50 text-error-500 p-4 rounded-md">
          Error loading car details: {error}
        </div>
      </div>
    );
  }
  
  if (!currentCar) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Car Not Found</h2>
          <Link to="/cars">
            <Button variant="primary" leftIcon={<ArrowLeft size={20} />}>
              Back to Cars
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Prepare image array for slider, ensuring it's valid
  const sliderImages = (currentCar.image_urls && currentCar.image_urls.length > 0) 
    ? [...currentCar.image_urls] // Create a new array to avoid mutations
    : [currentCar.image_url];
  
  return (
    <div className="min-h-screen pt-16 pb-12 bg-secondary-50">
      <div className="container-custom">
        <div className="mb-6">
          <Link to="/cars" className="inline-flex items-center text-primary-700 hover:text-primary-800">
            <ArrowLeft size={20} className="mr-2" />
            Back to Cars
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Car Image Slider */}
          <div className="relative">
            <SimpleImageViewer 
              images={sliderImages}
              alt={`${currentCar.make} ${currentCar.model}`}
              className="w-full h-96"
            />
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-primary-800 text-white px-4 py-2 rounded-full text-sm">
                {currentCar.category}
              </span>
            </div>
          </div>
          
          {/* Car Details */}
          <div className="p-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-semibold mb-2">
                  {currentCar.year} {currentCar.make} {currentCar.model} {currentCar.trim || ''}
                </h1>
                <div className="flex items-center gap-4 mb-2">
                  {currentCar.color && (
                    <span className="text-secondary-600 flex items-center">
                      <Palette size={16} className="mr-1" />
                      {currentCar.color}
                    </span>
                  )}
                  {currentCar.license_plate && (
                    <span className="font-mono text-sm bg-secondary-100 px-2 py-1 rounded">
                      {currentCar.license_plate}
                    </span>
                  )}
                </div>
                <p className="text-2xl text-primary-800 font-semibold">
                  ${currentCar.price_per_day}/day
                </p>
              </div>
              
              <div className="flex flex-col gap-2">
                {isSearchPerformed && !showDateSelector && (
                  <div className="text-right mb-2">
                    <p className="text-sm text-secondary-600">Your Dates:</p>
                    <p className="font-medium">
                      {format(new Date(searchParams.pickupDate), 'MMM d')} - {format(new Date(searchParams.returnDate), 'MMM d, yyyy')}
                    </p>
                    <button 
                      onClick={toggleDateSelector} 
                      className="text-xs text-primary-600 hover:text-primary-800 underline"
                    >
                      Change Dates
                    </button>
                  </div>
                )}
                
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={handleBookNow}
                  disabled={showDateSelector && isAvailable === false}
                >
                  {showDateSelector ? 'Continue to Booking' : 'Book Now'}
                </Button>
              </div>
            </div>
            
            {/* Date Selector */}
            {showDateSelector && (
              <div className="mt-6 p-4 bg-secondary-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Select Your Rental Dates</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Pickup Date"
                      type="date"
                      value={localPickupDate}
                      onChange={handlePickupDateChange}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      leftIcon={<CalendarDays size={18} />}
                    />
                  </div>
                  <div>
                    <Select
                      label="Pickup Time"
                      options={HOURS}
                      value={localPickupTime}
                      onChange={(e) => setLocalPickupTime(e.target.value)}
                    />
                  </div>
                  <div className="md:flex md:items-end md:justify-end">
                    {localPickupDate && localReturnDate && (
                      <div className="text-sm bg-primary-50 text-primary-700 px-3 py-2 rounded-md">
                        <span className="font-medium">{rentalDuration}</span> day{rentalDuration !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="Return Date"
                      type="date"
                      value={localReturnDate}
                      onChange={handleReturnDateChange}
                      min={localPickupDate}
                      leftIcon={<CalendarDays size={18} />}
                    />
                  </div>
                  <div>
                    <Select
                      label="Return Time"
                      options={HOURS}
                      value={localReturnTime}
                      onChange={(e) => setLocalReturnTime(e.target.value)}
                    />
                  </div>
                  <div className="md:flex md:items-end">
                    {isCheckingAvailability ? (
                      <div className="flex items-center text-secondary-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-800 mr-2"></div>
                        Checking...
                      </div>
                    ) : isAvailable !== null && (
                      <div className={`flex items-center ${
                        isAvailable ? 'text-success-600' : 'text-error-600'
                      }`}>
                        {isAvailable ? (
                          <>
                            <CheckCircle size={18} className="mr-1" />
                            Available
                          </>
                        ) : (
                          <>
                            <AlertCircle size={18} className="mr-1" />
                            Not Available
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {validationMessage && (
                  <div className="mt-2 text-error-500 text-sm">
                    {validationMessage}
                  </div>
                )}
                
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-lg font-semibold">
                    {localPickupDate && localReturnDate && (
                      <div className="flex items-center">
                        <span>Total: ${totalPrice}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={toggleDateSelector}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={handleBookNow}
                      disabled={!localPickupDate || !localReturnDate || isAvailable === false}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="flex items-center p-4 bg-secondary-50 rounded-lg">
                <Users className="h-6 w-6 text-primary-700 mr-3" />
                <div>
                  <p className="text-sm text-secondary-600">Seats</p>
                  <p className="font-semibold">{currentCar.seats || 5} Passengers</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-secondary-50 rounded-lg">
                <Car className="h-6 w-6 text-primary-700 mr-3" />
                <div>
                  <p className="text-sm text-secondary-600">Doors</p>
                  <p className="font-semibold">{currentCar.doors || 4} Doors</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-secondary-50 rounded-lg">
                <Fuel className="h-6 w-6 text-primary-700 mr-3" />
                <div>
                  <p className="text-sm text-secondary-600">Fuel Type</p>
                  <p className="font-semibold">{currentCar.fuel_type || 'Gas'} • {currentCar.gas_grade || 'Regular'}</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-secondary-50 rounded-lg">
                <CarIcon className="h-6 w-6 text-primary-700 mr-3" />
                <div>
                  <p className="text-sm text-secondary-600">Transmission</p>
                  <p className="font-semibold">{currentCar.transmission || 'Automatic'}</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-secondary-50 rounded-lg">
                <Gauge className="h-6 w-6 text-primary-700 mr-3" />
                <div>
                  <p className="text-sm text-secondary-600">Mileage</p>
                  <p className="font-semibold">{currentCar.mileage_type || 'Unlimited'}</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-secondary-50 rounded-lg">
                <Clock className="h-6 w-6 text-primary-700 mr-3" />
                <div>
                  <p className="text-sm text-secondary-600">Min. Rental</p>
                  <p className="font-semibold">24 Hours</p>
                </div>
              </div>
            </div>
            
            {/* Description */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-secondary-600">{currentCar.description}</p>
            </div>
            
            {/* Features List */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Features</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {currentCar.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-2 h-2 bg-primary-800 rounded-full mr-2"></div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarDetailsPage;