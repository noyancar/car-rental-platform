import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, CheckCircle, ShieldCheck, Car as CarIcon, Star } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { DatePickerCard } from '../components/ui/DatePickerCard';
import { useCarStore } from '../stores/carStore';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { featuredCars, fetchFeaturedCars, loading } = useCarStore();
  
  useEffect(() => {
    fetchFeaturedCars();
  }, [fetchFeaturedCars]);
  
  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-screen flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div 
            className="w-full h-full bg-cover bg-center" 
            style={{ 
              backgroundImage: 'url(https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750)',
              backgroundPosition: 'center 20%'
            }}
          >
            <div className="w-full h-full bg-black bg-opacity-50"></div>
          </div>
        </div>
        
        {/* Hero Content */}
        <div className="container-custom relative z-10 text-white">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-display mb-4 animate-fade-in">
              Experience Luxury on Every Journey
            </h1>
            <p className="text-xl mb-8 text-white/90 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Rent premium vehicles with exceptional service for unforgettable drives.
            </p>
            
            {/* DatePickerCard Integration */}
            <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <DatePickerCard 
                onSearch={(pickupDate, pickupTime, returnDate, returnTime) => {
                  const params = new URLSearchParams({
                    pickup: pickupDate,
                    pickupTime,
                    return: returnDate,
                    returnTime
                  });
                  navigate(`/cars?${params.toString()}`);
                }}
                className="mb-8 max-w-3xl"
              />
            </div>
            
            <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Link to="/cars">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  Browse All Cars
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  How It Works
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
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
      
      {/* Featured Cars Section */}
      <section className="py-20 bg-secondary-50">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display">
              Featured Vehicles
            </h2>
            <Link to="/cars">
              <Button variant="outline">View All Cars</Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCars.map(car => (
                <div key={car.id} className="card group overflow-hidden">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={car.image_url} 
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-0 left-0 bg-primary-800 text-white px-3 py-1">
                      ${car.price_per_day}/day
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">
                      {car.year} {car.make} {car.model}
                    </h3>
                    <div className="flex items-center text-accent-500 mt-1 mb-3">
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-secondary-600 text-sm ml-1">5.0</span>
                    </div>
                    <p className="text-secondary-600 text-sm line-clamp-2 mb-4">
                      {car.description}
                    </p>
                    <Link to={`/cars/${car.id}`}>
                      <Button variant="primary" fullWidth>
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-primary-800 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-display mb-6">
            Ready for Your Next Adventure?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have experienced the DriveLuxe difference.
          </p>
          <Link to="/register">
            <Button 
              variant="accent" 
              size="lg" 
              className="animate-pulse-slow"
            >
              Create Your Account Now
            </Button>
          </Link>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl md:text-4xl font-display text-center mb-12">
            What Our Customers Say
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-secondary-50 p-6 rounded-lg shadow-sm">
              <div className="flex items-center text-accent-500 mb-4">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <p className="italic text-secondary-700 mb-4">
                "The BMW I rented for my anniversary was immaculate. The booking process was seamless, and the staff was incredibly helpful. Will definitely use DriveLuxe again!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center mr-3">
                  <span className="text-primary-800 font-semibold">JD</span>
                </div>
                <div>
                  <p className="font-semibold">James Davidson</p>
                  <p className="text-sm text-secondary-500">Los Angeles, CA</p>
                </div>
              </div>
            </div>
            
            {/* Testimonial 2 */}
            <div className="bg-secondary-50 p-6 rounded-lg shadow-sm">
              <div className="flex items-center text-accent-500 mb-4">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <p className="italic text-secondary-700 mb-4">
                "I needed a luxury SUV for a client meeting, and DriveLuxe delivered. The Range Rover was spotless, and the pickup/drop-off process was extremely convenient."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center mr-3">
                  <span className="text-primary-800 font-semibold">SC</span>
                </div>
                <div>
                  <p className="font-semibold">Sarah Chen</p>
                  <p className="text-sm text-secondary-500">New York, NY</p>
                </div>
              </div>
            </div>
            
            {/* Testimonial 3 */}
            <div className="bg-secondary-50 p-6 rounded-lg shadow-sm">
              <div className="flex items-center text-accent-500 mb-4">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <p className="italic text-secondary-700 mb-4">
                "We rented a Tesla for our California road trip and it was the perfect choice. Excellent range, immaculate condition, and the customer service was top-notch."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center mr-3">
                  <span className="text-primary-800 font-semibold">MM</span>
                </div>
                <div>
                  <p className="font-semibold">Michael Morgan</p>
                  <p className="text-sm text-secondary-500">Austin, TX</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;