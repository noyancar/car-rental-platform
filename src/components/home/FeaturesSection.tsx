import React from 'react';
import { CalendarDays, CheckCircle, ShieldCheck, Car as CarIcon } from 'lucide-react';

const FeaturesSection: React.FC = () => {
  return (
    <section className="py-10 sm:py-16 md:py-20 bg-white">
      <div className="container-custom">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display text-center mb-8 sm:mb-10 md:mb-12">
          Why Choose <span className="text-primary-800">NYN Rentals</span>
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Feature 1 */}
          <div className="flex flex-col items-center text-center p-4 sm:p-5 md:p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-[#c51b37] flex items-center justify-center mb-3 sm:mb-4">
              <CarIcon  color='#FFFFFF' className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary-800" />
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1.5 sm:mb-2">Premium Vehicles</h3>
            <p className="text-sm sm:text-base text-secondary-600">
              Our fleet features the latest premium models from top manufacturers.
            </p>
          </div>
          
          {/* Feature 2 */}
          <div className="flex flex-col items-center text-center p-4 sm:p-5 md:p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-[#c51b37] flex items-center justify-center mb-3 sm:mb-4">
              <CalendarDays color='#FFFFFF' className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary-800" />
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1.5 sm:mb-2">Flexible Rentals</h3>
            <p className="text-sm sm:text-base text-secondary-600">
              From one-day excursions to extended adventures, customize your rental period.
            </p>
          </div>
          
          {/* Feature 3 */}
          <div className="flex flex-col items-center text-center p-4 sm:p-5 md:p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-[#b80000ff] flex items-center justify-center mb-3 sm:mb-4">
              <CheckCircle color='#FFFFFF' className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary-800" />
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1.5 sm:mb-2">Easy Booking</h3>
            <p className="text-sm sm:text-base text-secondary-600">
              Our streamlined process makes reserving your dream car quick and hassle-free.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="flex flex-col items-center text-center p-4 sm:p-5 md:p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-[#b80000ff] flex items-center justify-center mb-3 sm:mb-4">
              <ShieldCheck color='#FFFFFF' className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1.5 sm:mb-2">Need Delivery?</h3>
            <p className="text-sm sm:text-base text-secondary-600">
            We’ll bring the car right to you, with flexible delivery options available.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 