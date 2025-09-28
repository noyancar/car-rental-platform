import React from 'react';
import { Star } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  location: string;
  text: string;
  initials: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'James Davidson',
    location: 'Los Angeles, CA',
    text: 'The BMW I rented for my anniversary was immaculate. The booking process was seamless, and the staff was incredibly helpful. Will definitely use NYN Rentals again!',
    initials: 'JD'
  },
  {
    id: '2',
    name: 'Sarah Chen',
    location: 'New York, NY',
    text: 'I needed a luxury SUV for a client meeting, and NYN Rentals delivered. The Range Rover was spotless, and the pickup/drop-off process was extremely convenient.',
    initials: 'SC'
  },
  {
    id: '3',
    name: 'Michael Morgan',
    location: 'Austin, TX',
    text: 'We rented a Tesla for our California road trip and it was the perfect choice. Excellent range, immaculate condition, and the customer service was top-notch.',
    initials: 'MM'
  }
];

const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-10 sm:py-16 md:py-20 bg-white">
      <div className="container-custom">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display text-center mb-8 sm:mb-10 md:mb-12">
          What Our Customers Say
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {TESTIMONIALS.map(testimonial => (
            <div key={testimonial.id} className="bg-secondary-50 p-4 sm:p-5 md:p-6 rounded-lg shadow-sm">
              <div className="flex items-center text-accent-500 mb-3 sm:mb-4">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
              </div>
              <p className="italic text-sm sm:text-base text-secondary-700 mb-3 sm:mb-4">
                "{testimonial.text}"
              </p>
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary-200 flex items-center justify-center mr-2 sm:mr-3">
                  <span className="text-xs sm:text-sm text-primary-800 font-semibold">{testimonial.initials}</span>
                </div>
                <div>
                  <p className="text-sm sm:text-base font-semibold">{testimonial.name}</p>
                  <p className="text-xs sm:text-sm text-secondary-500">{testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection; 