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
    text: 'The BMW I rented for my anniversary was immaculate. The booking process was seamless, and the staff was incredibly helpful. Will definitely use DriveLuxe again!',
    initials: 'JD'
  },
  {
    id: '2',
    name: 'Sarah Chen',
    location: 'New York, NY',
    text: 'I needed a luxury SUV for a client meeting, and DriveLuxe delivered. The Range Rover was spotless, and the pickup/drop-off process was extremely convenient.',
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
    <section className="py-20 bg-white">
      <div className="container-custom">
        <h2 className="text-3xl md:text-4xl font-display text-center mb-12">
          What Our Customers Say
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map(testimonial => (
            <div key={testimonial.id} className="bg-secondary-50 p-6 rounded-lg shadow-sm">
              <div className="flex items-center text-accent-500 mb-4">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <p className="italic text-secondary-700 mb-4">
                "{testimonial.text}"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center mr-3">
                  <span className="text-primary-800 font-semibold">{testimonial.initials}</span>
                </div>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-secondary-500">{testimonial.location}</p>
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