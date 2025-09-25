import React from 'react';
import { Car, Calendar, CreditCard, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const HowItWorksPage: React.FC = () => {
  const navigate = useNavigate();

  const handleScrollToTop = () => {
    navigate('/', { state: { scrollToTop: true } });
  };

  const steps = [
    {
      icon: <Car className="h-12 w-12 text-primary-800" />,
      title: 'Choose Your Car',
      description: 'Browse our extensive fleet of premium vehicles and select the perfect car for your needs.',
    },
    {
      icon: <Calendar className="h-12 w-12 text-primary-800" />,
      title: 'Select Dates',
      description: 'Pick your preferred rental dates and duration. Our flexible booking system accommodates your schedule.',
    },
    {
      icon: <CreditCard className="h-12 w-12 text-primary-800" />,
      title: 'Book & Pay',
      description: 'Complete your reservation with our secure payment system. Receive instant confirmation.',
    },
    {
      icon: <CheckCircle className="h-12 w-12 text-primary-800" />,
      title: 'Enjoy Your Ride',
      description: 'Pick up your car and enjoy a premium driving experience with our top-quality vehicles.',
    },
  ];

  return (
    <div className="min-h-screen pt-16 pb-12 bg-secondary-50">
      <div className="container-custom">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-800 mb-4">
            How NoyanCar Works
          </h1>
          <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
            Renting a luxury car has never been easier. Follow these simple steps to get started with your premium driving experience.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-lg shadow-md text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
                {step.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-secondary-600">{step.description}</p>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-16">
          <h2 className="text-3xl font-display font-bold text-primary-800 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-2">What documents do I need?</h3>
              <p className="text-secondary-600">
                You'll need a valid driver's license, proof of insurance, and a credit card in your name. International customers need a valid passport and international driver's permit.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Is insurance included?</h3>
              <p className="text-secondary-600">
                Basic insurance is included with all rentals. Additional coverage options are available for enhanced protection.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">What's your cancellation policy?</h3>
              <p className="text-secondary-600">
                Free cancellation up to 48 hours before your rental start time. Cancellations within 48 hours may incur a fee.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Is there a mileage limit?</h3>
              <p className="text-secondary-600">
                Most rentals include 150 miles per day. Additional mileage can be purchased at competitive rates.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-primary-800 rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-display font-bold text-white mb-4">
            Ready to Experience Luxury?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Browse our collection of premium vehicles and book your perfect car today.
          </p>
          <Button variant="accent" size="lg" onClick={handleScrollToTop}>
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;