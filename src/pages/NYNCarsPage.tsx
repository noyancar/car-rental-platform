import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Car as CarIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SEO } from '../components/seo/SEO';
import { supabase } from '../lib/supabase';
import type { Car } from '../types';

const NYNCarsPage: React.FC = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('available', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setCars(data || []);
      } catch (err) {
        console.error('Error fetching cars:', err);
        setError('Failed to load cars. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

  const handleCheckAvailability = () => {
    navigate('/cars');
  };

  if (loading) {
    return (
      <>
        <SEO
          title="NYN Cars - All Available Vehicles"
          description="Browse all available rental cars from NYN Rentals in Honolulu, Oahu. View our complete fleet and check availability for your dates."
          canonical="https://nynrentals.com/nyncars"
          ogType="website"
        />
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="loading-spinner h-12 w-12"></div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <SEO
          title="NYN Cars - All Available Vehicles"
          description="Browse all available rental cars from NYN Rentals in Honolulu, Oahu. View our complete fleet and check availability for your dates."
          canonical="https://nynrentals.com/nyncars"
          ogType="website"
        />
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl shadow-md max-w-2xl">
            <h3 className="font-semibold text-lg mb-2">Error Loading Cars</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="NYN Cars - All Available Vehicles | Honolulu Car Rentals"
        description="Browse all available rental cars from NYN Rentals in Honolulu, Oahu. View our complete fleet of economy, luxury, and SUV vehicles. Check availability and book online."
        canonical="https://nynrentals.com/nyncars"
        ogType="website"
      />
      <div className="py-8 md:py-12 bg-white min-h-screen">
        <div className="container-custom">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-volcanic-900 mb-3">
              NYN Cars - Our Complete Fleet
            </h1>
            <p className="text-lg text-volcanic-600">
              Browse all {cars.length} available vehicles. Select your dates to check availability and pricing.
            </p>
          </div>

          {/* Cars Grid */}
          {cars.length === 0 ? (
            <div className="bg-gray-50 p-12 text-center rounded-2xl shadow-md">
              <CarIcon className="w-12 h-12 mx-auto mb-4 text-primary-600" />
              <h3 className="text-2xl font-display font-semibold mb-3 text-volcanic-900">
                No Cars Available
              </h3>
              <p className="text-volcanic-600 text-lg">
                We currently have no cars available. Please check back later.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cars.map((car) => (
                <div
                  key={car.id}
                  className="bg-white rounded-xl shadow-hawaii overflow-hidden group hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={
                        car.image_urls && car.image_urls.length > 0
                          ? car.image_urls[car.main_image_index || 0]
                          : car.image_url
                      }
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-lg font-display font-semibold text-volcanic-900 mb-2">
                      {car.make} {car.model} {car.year}
                    </h3>

                    <div className="flex items-center text-accent-500 mb-3">
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-volcanic-500 text-sm ml-2">5.0</span>
                    </div>

                    <div className="text-sm text-volcanic-600 mb-4 space-y-1">
                      <p>
                        <span className="font-semibold text-volcanic-700">Category:</span> {car.category}
                      </p>
                      <p>
                        <span className="font-semibold text-volcanic-700">Seats:</span> {car.seats}
                      </p>
                      <p>
                        <span className="font-semibold text-volcanic-700">Transmission:</span>{' '}
                        {car.transmission}
                      </p>
                    </div>

                    <p className="text-volcanic-600 text-sm line-clamp-2 mb-4 flex-grow">
                      {car.description}
                    </p>

                    <Button
                      variant="primary"
                      fullWidth
                      className="shadow-md hover:shadow-lg"
                      onClick={handleCheckAvailability}
                      pixel={{
                        event: 'NYNCarsCheckAvailability',
                        params: { carMake: car.make, carModel: car.model, carYear: car.year },
                      }}
                    >
                      Check Availability
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NYNCarsPage;
