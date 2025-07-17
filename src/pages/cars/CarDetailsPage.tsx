import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Users, Gauge, Car as CarIcon, Fuel, Palette, Car } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../../components/ui/Button';
import { SimpleImageViewer } from '../../components/ui/SimpleImageViewer';
import { PageHeader } from '../../components/ui/PageHeader';
import { useCarStore } from '../../stores/carStore';
import { useSearchStore } from '../../stores/searchStore';
import { toast } from 'sonner';

const CarDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentCar, loading, error, fetchCarById } = useCarStore();
  const { searchParams, isSearchPerformed } = useSearchStore();
  
  
  useEffect(() => {
    if (id) {
      fetchCarById(parseInt(id));
    }
  }, [id, fetchCarById]);
  
  
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
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-3xl font-bold text-primary-800">
                        ${currentCar.price_per_day}<span className="text-lg font-normal text-gray-600">/day</span>
                      </p>
                      {isSearchPerformed && (
                        <p className="text-sm text-gray-600 mt-1">
                          {format(new Date(searchParams.pickupDate), 'MMM d')} - {format(new Date(searchParams.returnDate), 'MMM d')}
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="primary" 
                      size="md"
                      onClick={handleBookNow}
                      className="w-full sm:w-auto"
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
              
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Clock className="h-5 w-5 text-primary-700 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-600">Min. Rental</p>
                  <p className="text-sm font-semibold text-gray-900">24 Hours</p>
                </div>
              </div>
              
              {currentCar.color && (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Palette className="h-5 w-5 text-primary-700 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-600">Color</p>
                    <p className="text-sm font-semibold text-gray-900">{currentCar.color}</p>
                  </div>
                </div>
              )}
              
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