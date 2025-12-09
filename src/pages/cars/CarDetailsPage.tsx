import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Gauge, Car as CarIcon, Fuel, Car, Tag, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../../components/ui/Button';
import { SimpleImageViewer } from '../../components/ui/SimpleImageViewer';
import { PageHeader } from '../../components/ui/PageHeader';
import { useCarStore } from '../../stores/carStore';
import { useSearchStore } from '../../stores/searchStore';
import { useBookingStore } from '../../stores/bookingStore';
import { toast } from 'sonner';
import { parseDateInLocalTimezone } from '../../utils/dateUtils';
import type { PriceCalculationResult } from '../../types';
import { tracker } from '../../lib/analytics/tracker';

const CarDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentCar, loading, error, fetchCarById } = useCarStore();
  const { searchParams, isSearchPerformed } = useSearchStore();
  const { calculatePriceWithBreakdown } = useBookingStore();
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculationResult | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const viewStartTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (id) {
      fetchCarById(id);
    }
  }, [id, fetchCarById]);

  // Track funnel stage 3 and car view when car loads
  useEffect(() => {
    if (currentCar && id) {
      viewStartTimeRef.current = Date.now();

      // Track funnel stage 3: Car details view
      tracker.trackFunnelStage('car_details', 3, id, {
        carId: id,
        carMake: currentCar.make,
        carModel: currentCar.model,
        carYear: currentCar.year,
        pricePerDay: currentCar.price_per_day,
      });

      // Track car view event
      tracker.trackCarView({
        carId: id,
        carMake: currentCar.make,
        carModel: currentCar.model,
        carYear: currentCar.year,
        category: currentCar.category,
        pricePerDay: currentCar.price_per_day,
      });

      // Track time spent when component unmounts
      return () => {
        const timeSpent = Math.floor((Date.now() - viewStartTimeRef.current) / 1000);
        if (timeSpent > 0) {
          tracker.trackCarView({
            carId: id,
            carMake: currentCar.make,
            carModel: currentCar.model,
            carYear: currentCar.year,
            category: currentCar.category,
            pricePerDay: currentCar.price_per_day,
            timeSpent,
          });
        }
      };
    }
  }, [currentCar, id]);

  // Calculate pricing when car and search params are available
  useEffect(() => {
    const loadPricing = async () => {
      if (currentCar && isSearchPerformed && id) {
        setPriceLoading(true);
        try {
          const result = await calculatePriceWithBreakdown(
            id,
            searchParams.pickupDate,
            searchParams.returnDate,
            searchParams.pickupTime,
            searchParams.returnTime
          );
          setPriceCalculation(result);
        } catch (error) {
          console.error('Error calculating price:', error);
        } finally {
          setPriceLoading(false);
        }
      }
    };

    loadPricing();
  }, [currentCar, isSearchPerformed, id, searchParams.pickupDate, searchParams.returnDate, searchParams.pickupTime, searchParams.returnTime, calculatePriceWithBreakdown]);
  
  
  // Function to proceed to booking
  const handleBookNow = () => {
    if (!isSearchPerformed) {
      toast.error('Please search for available cars first');
      navigate('/');
      return;
    }
    
    // Navigate to booking page with search parameters
    navigate(`/booking/${id}`);
  };
  
  
  if (loading) {
    return (
      <div className="min-h-screen pt-2 pb-12 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen pt-2 pb-12 flex flex-col items-center justify-center">
        <div className="bg-error-50 text-error-500 p-4 rounded-md">
          Error loading car details: {error}
        </div>
      </div>
    );
  }
  
  if (!currentCar) {
    return (
      <div className="min-h-screen pt-2 pb-12 flex flex-col items-center justify-center">
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
  
  // Generate breadcrumb items
  const breadcrumbItems = [
    { label: 'Cars', path: '/cars' },
    { label: `${currentCar.make} ${currentCar.model} ${currentCar.year}`, path: `/cars/${id}` }
  ];
  
  return (
    <div className="min-h-screen pt-2 pb-12 bg-secondary-50">
      <div className="container-custom">
        <PageHeader
          title={`${currentCar.make} ${currentCar.model} ${currentCar.year}`}
          subtitle={`$${currentCar.price_per_day}/day`}
          breadcrumbItems={breadcrumbItems}
          fallbackPath="/cars"
          className="lg:hidden"
        />
        
        {/* Desktop Layout - Side by Side */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Left Column - Images */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Car Image Slider */}
              <div className="relative">
                <SimpleImageViewer 
                  images={sliderImages}
                  alt={`${currentCar.make} ${currentCar.model}`}
                  className="w-full"
                  aspectRatio="auto"
                  maxHeight="max-h-[300px] sm:max-h-[400px] lg:max-h-[500px]"
                />
              </div>
            </div>
          </div>
          
          {/* Right Column - Details */}
          <div className="lg:col-span-5 mt-6 lg:mt-0">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
              {/* Desktop Breadcrumb */}
              <div className="hidden lg:block mb-6">
                <PageHeader
                  title={`${currentCar.make} ${currentCar.model} ${currentCar.year}`}
                  subtitle={`$${currentCar.price_per_day}/day`}
                  breadcrumbItems={breadcrumbItems}
                  fallbackPath="/cars"
                />
              </div>
            
            {/* Car Info Header */}
              <div className="mb-6">
              
                {/* Price and Booking Section */}
                <div className="border-t border-b border-gray-100 py-4 mb-6">
                  {/* Special Pricing Badge */}
                  {priceCalculation && priceCalculation.special_price_days > 0 && (
                    <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2">
                      <Tag className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-sm font-semibold text-orange-900">Special Pricing Active!</p>
                        <p className="text-xs text-orange-700">
                          {priceCalculation.special_price_days} of {priceCalculation.base_price_days + priceCalculation.special_price_days} days have special pricing
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      {priceLoading ? (
                        <p className="text-3xl font-bold text-primary-800 animate-pulse">
                          Loading...
                        </p>
                      ) : priceCalculation ? (
                        <>
                          <p className="text-3xl font-bold text-primary-800">
                            ${priceCalculation.average_per_day.toFixed(0)}<span className="text-lg font-normal text-gray-600">/day avg</span>
                          </p>
                          <p className="text-xl font-semibold text-gray-700 mt-1">
                            Total: ${priceCalculation.total_price.toFixed(0)}
                          </p>
                        </>
                      ) : (
                        <p className="text-3xl font-bold text-primary-800">
                          ${currentCar.price_per_day}<span className="text-lg font-normal text-gray-600">/day</span>
                        </p>
                      )}
                      {isSearchPerformed && (
                        <p className="text-sm text-gray-600 mt-1">
                          {format(parseDateInLocalTimezone(searchParams.pickupDate), 'MMM d')} - {format(parseDateInLocalTimezone(searchParams.returnDate), 'MMM d')}
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="primary" 
                      size="md"
                      onClick={handleBookNow}
                      className="w-full sm:w-auto"
                      pixel={{ event: "CarBookNow", params: {carId: currentCar.id } }}
                    >
                      Book Now
                    </Button>
                  </div>
                </div>
              </div>
            
            
            {/* Features - Quick Info */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Users className="h-5 w-5 text-primary-700 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-600">Seats</p>
                  <p className="text-sm font-semibold text-gray-900">{currentCar.seats || 5}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Car className="h-5 w-5 text-primary-700 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-600">Doors</p>
                  <p className="text-sm font-semibold text-gray-900">{currentCar.doors || 4}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Fuel className="h-5 w-5 text-primary-700 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-600">Fuel</p>
                  <p className="text-sm font-semibold text-gray-900">{currentCar.fuel_type || 'Gas'}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <CarIcon className="h-5 w-5 text-primary-700 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-600">Transmission</p>
                  <p className="text-sm font-semibold text-gray-900">{currentCar.transmission || 'Automatic'}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Gauge className="h-5 w-5 text-primary-700 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-600">Mileage</p>
                  <p className="text-sm font-semibold text-gray-900">{currentCar.mileage_type || 'Unlimited'}</p>
                </div>
              </div>

              {currentCar.category && (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Car className="h-5 w-5 text-primary-700 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">Category</p>
                    <p className="text-sm font-semibold text-gray-900">{currentCar.category}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Description - Desktop Only */}
            <div className="mb-6 hidden lg:block">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">About this car</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{currentCar.description}</p>
            </div>
            
            {/* Features List - Desktop Only */}
            <div className="hidden lg:block">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">Features & Amenities</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentCar.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mr-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>
        
        {/* Mobile Only - Full Width Sections */}
        <div className="lg:hidden mt-6 space-y-6">
          {/* Description for Mobile */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-900">About this car</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{currentCar.description}</p>
          </div>
          
          {/* Features for Mobile */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3 text-gray-900">Features & Amenities</h2>
            <div className="grid grid-cols-1 gap-2">
              {currentCar.features.map((feature, index) => (
                <div key={index} className="flex items-center text-sm">
                  <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mr-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarDetailsPage;