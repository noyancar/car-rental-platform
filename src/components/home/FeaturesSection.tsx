import React from 'react';
import { CalendarDays, CheckCircle, ShieldCheck, Car as CarIcon } from 'lucide-react';

const FeaturesSection: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <h2 className="text-3xl md:text-4xl font-display text-center mb-12">
          Why Choose <span className="text-primary-800">DriveLuxe</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div className="flex flex-col items-center text-center p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
              <CarIcon className="h-8 w-8 text-primary-800" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Premium Vehicles</h3>
            <p className="text-secondary-600">
              Our fleet features the latest luxury models from top manufacturers.
            </p>
          </div>
          
          {/* Feature 2 */}
          <div className="flex flex-col items-center text-center p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
              <ShieldCheck className="h-8 w-8 text-primary-800" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Fully Insured</h3>
            <p className="text-secondary-600">
              Drive with peace of mind knowing all rentals include comprehensive insurance.
            </p>
          </div>
          
          {/* Feature 3 */}
          <div className="flex flex-col items-center text-center p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
              <CalendarDays className="h-8 w-8 text-primary-800" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Flexible Rentals</h3>
            <p className="text-secondary-600">
              From one-day excursions to extended adventures, customize your rental period.
            </p>
          </div>
          
          {/* Feature 4 */}
          <div className="flex flex-col items-center text-center p-6 rounded-lg hover:shadow-md transition-shadow">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-primary-800" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy Booking</h3>
            <p className="text-secondary-600">
              Our streamlined process makes reserving your dream car quick and hassle-free.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 