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
    name: 'Lenny K.',
    location: 'New York, NY',
    text: 'Jeep was perfect for our day trip across the island. Very clean and fun to drive. Pick up and drop off were a breeze. Thank you guys!',
    initials: 'LK'
  },
  {
    id: '2',
    name: 'Jeff G.',
    location: 'Seattle, WA',
    text: 'Everything was great! The car was clean and in excellent condition. We had the car delivered to our hotel. Much more convenient than major car rental companies. Loved it. Will rent again on our next trip!',
    initials: 'JG'
  },
  {
    id: '3',
    name: 'Wendy M.',
    location: 'San Francisco, CA',
    text: 'The car was super clean, pickup & drop off the car was super easy and most of all the service was fantastic. We rented beach gear with the car as well. Highly recommended. ',
    initials: 'WM'
  }
];

const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-10 sm:py-16 md:py-20 bg-white">
      <div className="container-custom">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display text-center mb-8 sm:mb-10 md:mb-12">
          What Our Guests Say
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