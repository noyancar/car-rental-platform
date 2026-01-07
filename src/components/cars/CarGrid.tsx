import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star, Car as CarIcon, Calendar, MapPin, Tag } from 'lucide-react';
import { Button } from '../ui/Button';
import { useSearchStore } from '../../stores/searchStore';
import { useBookingStore } from '../../stores/bookingStore';
import { calculateRentalDuration } from '../../utils/bookingPriceCalculations';
import type { Car, PriceCalculationResult } from '../../types';

interface CarWithPricing extends Car {
  calculatedPrice?: PriceCalculationResult;
  priceLoading?: boolean;
  isAvailableForDates?: boolean;
}

const CarGrid: React.FC = () => {
  const { filteredResults, loading, isSearchPerformed, error, searchParams, sortBy } = useSearchStore();
  const { calculatePriceWithBreakdown } = useBookingStore();
  const [carsWithPricing, setCarsWithPricing] = useState<CarWithPricing[]>([]);

  // Calculate rental days using existing time-based calculation
  const rentalDays = calculateRentalDuration(
    searchParams.pickupDate,
    searchParams.returnDate,
    searchParams.pickupTime,
    searchParams.returnTime
  );

  // Sort cars based on calculated prices
  const sortedCars = useMemo(() => {
    if (carsWithPricing.length === 0) return [];

    const sorted = [...carsWithPricing];

    switch (sortBy) {
      case 'price-low-high':
        sorted.sort((a, b) => {
          const priceA = a.calculatedPrice ? a.calculatedPrice.average_per_day : a.price_per_day;
          const priceB = b.calculatedPrice ? b.calculatedPrice.average_per_day : b.price_per_day;
          return priceA - priceB;
        });
        break;
      case 'price-high-low':
        sorted.sort((a, b) => {
          const priceA = a.calculatedPrice ? a.calculatedPrice.average_per_day : a.price_per_day;
          const priceB = b.calculatedPrice ? b.calculatedPrice.average_per_day : b.price_per_day;
          return priceB - priceA;
        });
        break;
      case 'name-a-z':
        sorted.sort((a, b) => {
          const nameA = `${a.make} ${a.model}`.toLowerCase();
          const nameB = `${b.make} ${b.model}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
        break;
      case 'name-z-a':
        sorted.sort((a, b) => {
          const nameA = `${a.make} ${a.model}`.toLowerCase();
          const nameB = `${b.make} ${b.model}`.toLowerCase();
          return nameB.localeCompare(nameA);
        });
        break;
    }

    return sorted;
  }, [carsWithPricing, sortBy]);

  // Calculate pricing for each car when search is performed
  useEffect(() => {
    if (isSearchPerformed && filteredResults.length > 0) {
      const loadPricing = async () => {
        const carsWithInitialState = filteredResults.map(car => ({
          ...car,
          priceLoading: true,
          isAvailableForDates: (car as any).isAvailableForDates
        }));
        setCarsWithPricing(carsWithInitialState);

        // Calculate prices in parallel
        const pricingPromises = filteredResults.map(async (car) => {
          try {
            const priceResult = await calculatePriceWithBreakdown(
              car.id,
              searchParams.pickupDate,
              searchParams.returnDate,
              searchParams.pickupTime,
              searchParams.returnTime
            );
            return {
              ...car,
              calculatedPrice: priceResult || undefined,
              priceLoading: false,
              isAvailableForDates: (car as any).isAvailableForDates
            };
          } catch (error) {
            console.error(`Error calculating price for car ${car.id}:`, error);
            return {
              ...car,
              calculatedPrice: undefined,
              priceLoading: false,
              isAvailableForDates: (car as any).isAvailableForDates
            };
          }
        });

        const results = await Promise.all(pricingPromises);
        setCarsWithPricing(results);
      };

      loadPricing();
    } else {
      setCarsWithPricing([]);
    }
  }, [filteredResults, isSearchPerformed, searchParams.pickupDate, searchParams.returnDate, searchParams.pickupTime, searchParams.returnTime, calculatePriceWithBreakdown]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="loading-spinner h-12 w-12"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 sm:p-6 md:p-8 rounded-xl shadow-md max-w-2xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="bg-red-100 p-3 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">Unable to Complete Your Search</h3>
            <p className="text-red-600 text-sm sm:text-base">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!isSearchPerformed) {
    return (
      <div className="bg-white p-6 sm:p-8 md:p-12 text-center rounded-2xl shadow-md max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Calendar className="w-8 h-8 text-primary-600" />
            <CarIcon className="w-10 h-10 text-primary-600" />
            <MapPin className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-display font-bold mb-3 sm:mb-4 text-volcanic-900">
            Let's Find Your Perfect Car!
          </h3>
          <p className="text-volcanic-600 text-sm sm:text-base md:text-lg mb-1.5 sm:mb-2">
            Tell us when and where you need a car, and we'll show you all available options.
          </p>
          <p className="text-volcanic-500 text-xs sm:text-sm md:text-base">
            Our real-time availability ensures you only see cars you can actually book.
          </p>
        </div>
        <div className="bg-primary-50 p-4 sm:p-5 md:p-6 rounded-xl border border-primary-200">
          <p className="text-primary-700 font-medium text-sm sm:text-base">
            💡 Quick tip: Start by selecting your travel dates above to see available cars and real-time pricing.
          </p>
        </div>
      </div>
    );
  }
  
  if (carsWithPricing.length === 0 && !loading) {
    return (
      <div className="bg-gray-50 p-6 sm:p-8 md:p-12 text-center rounded-2xl shadow-md">
        <CarIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-primary-600" />
        <h3 className="text-lg sm:text-xl md:text-2xl font-display font-semibold mb-2 sm:mb-3 text-volcanic-900">No Cars Found</h3>
        <p className="text-volcanic-600 text-sm sm:text-base md:text-lg mb-3 sm:mb-4">
          We couldn't find any cars matching your search criteria.
        </p>
        <p className="text-volcanic-500 text-xs sm:text-sm md:text-base">
          Try adjusting your dates or filters to see more results.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {sortedCars.map(car => {
        const hasSpecialPricing = car.calculatedPrice && car.calculatedPrice.special_price_days > 0;
        const displayPrice = car.calculatedPrice
          ? car.calculatedPrice.average_per_day
          : car.price_per_day;
        const totalPrice = car.calculatedPrice
          ? car.calculatedPrice.total_price
          : car.price_per_day * rentalDays;

        return (
        <div key={car.id} className="bg-white rounded-xl shadow-hawaii overflow-hidden group hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col h-full min-h-[400px] sm:min-h-[450px]">
          <div className="relative h-48 sm:h-52 md:h-56 overflow-hidden">
            <img
              src={car.image_urls && car.image_urls.length > 0
                ? car.image_urls[car.main_image_index || 0]
                : car.image_url}
              alt={`${car.make} ${car.model}`}
              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
            />
            {/* Special Pricing Badge */}
            {hasSpecialPricing && (
              <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-lg">
                <Tag className="w-3 h-3" />
                Special Price
              </div>
            )}
            {/* Price Tag */}
            <div className="absolute bottom-0 left-0 price-tag m-2 sm:m-3">
              {car.priceLoading ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                <>${displayPrice.toFixed(0)}/day</>
              )}
            </div>
          </div>
          <div className="p-4 sm:p-5 md:p-6 flex flex-col flex-grow">
            <h3 className="text-base sm:text-lg md:text-xl font-display font-semibold text-volcanic-900 mb-1.5 sm:mb-2">
              {car.make} {car.model} {car.year}
            </h3>
            <div className="flex items-center text-accent-500 mb-2 sm:mb-3">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
              <span className="text-volcanic-500 text-xs sm:text-sm ml-1.5 sm:ml-2">5.0</span>
            </div>
            
            <div className="text-xs sm:text-sm text-volcanic-600 mb-3 sm:mb-4 space-y-0.5 sm:space-y-1">
              <p><span className="font-semibold text-volcanic-700">Category:</span> {car.category}</p>
              <p><span className="font-semibold text-volcanic-700">Seats:</span> {car.seats}</p>
              <p><span className="font-semibold text-volcanic-700">Transmission:</span> {car.transmission}</p>
            </div>

            {/* Total Price Display */}
            {!car.priceLoading && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-3 sm:mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-volcanic-600">Total for {rentalDays} {rentalDays === 1 ? 'day' : 'days'}:</span>
                  <span className="text-lg sm:text-xl font-bold text-primary-700">${totalPrice.toFixed(0)}</span>
                </div>
              </div>
            )}

            <p className="text-volcanic-600 text-xs sm:text-sm line-clamp-2 mb-4 sm:mb-6 flex-grow">
              {car.description}
            </p>
            
            {car.isAvailableForDates === false ? (
              <Button
                variant="secondary"
                fullWidth
                disabled
                className="shadow-md cursor-not-allowed opacity-60"
              >
                Not Available
              </Button>
            ) : (
              <Link to={`/cars/${car.id}`} className="mt-auto">
                <Button variant="primary" fullWidth className="shadow-md hover:shadow-lg"
                pixel={{
                  event: "CarViewDetail",
                  params: { carMake: car.make, carModel: car.model, carYear: car.year }
                }}>
                  View Details
                </Button>
              </Link>
            )}
          </div>
        </div>
        );
      })}
    </div>
  );
};

export default CarGrid; 