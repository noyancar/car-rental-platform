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
  
  // Generate breadcrumb items
  const breadcrumbItems = [
    { label: 'Cars', path: '/cars' },
    { label: `${currentCar.year} ${currentCar.make} ${currentCar.model}`, path: `/cars/${id}` }
  ];
  
  return (
    <div className="min-h-screen pt-16 pb-12 bg-secondary-50">
      <div className="container-custom">
        <PageHeader
          title={`${currentCar.year} ${currentCar.make} ${currentCar.model} ${currentCar.trim || ''}`}
          subtitle={`${currentCar.category} • $${currentCar.price_per_day}/day`}
          breadcrumbItems={breadcrumbItems}
          fallbackPath="/cars"
        />
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Car Image Slider */}
          <div className="relative">
            <SimpleImageViewer 
              images={sliderImages}
              alt={`${currentCar.make} ${currentCar.model}`}
              className="w-full"
              aspectRatio="auto"
              maxHeight="max-h-[600px]"
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
              </div>
              
              <div className="flex flex-col gap-2">
                {isSearchPerformed && (
                  <div className="text-right mb-2">
                    <p className="text-sm text-secondary-600">Your Dates:</p>
                    <p className="font-medium">
                      {format(new Date(searchParams.pickupDate), 'MMM d')} - {format(new Date(searchParams.returnDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
                
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={handleBookNow}
                >
                  Book Now
                </Button>
              </div>
            </div>
            
            
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