import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Tag, Clock, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAdminStore } from '../stores/adminStore';

const DealsPage: React.FC = () => {
  const { campaigns, loading, error, fetchCampaigns } = useAdminStore();
  
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);
  
  const activeCampaigns = campaigns.filter(campaign => campaign.active);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center bg-secondary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center bg-secondary-50">
        <div className="bg-error-50 text-error-500 p-4 rounded-md">
          Error loading campaigns: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 bg-secondary-50">
      <div className="container-custom">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-primary-800 mb-4">
            Special Offers & Deals
          </h1>
          <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
            Take advantage of our exclusive offers and save on your next luxury car rental.
          </p>
        </div>

        {activeCampaigns.length === 0 ? (
          <div className="text-center py-20">
            <Tag className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Active Deals</h2>
            <p className="text-secondary-600 mb-8">
              Check back soon for new special offers and discounts!
            </p>
            <Link to="/cars">
              <Button variant="primary">Browse Cars</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeCampaigns.map((campaign) => (
              <div 
                key={campaign.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={campaign.featured_image_url} 
                    alt={campaign.name}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-accent-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Save {campaign.discount_percentage}%
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{campaign.name}</h3>
                  <p className="text-secondary-600 mb-4">{campaign.description}</p>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-secondary-600">
                      <Calendar size={16} className="mr-2" />
                      <span>Valid from {new Date(campaign.valid_from).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-secondary-600">
                      <Clock size={16} className="mr-2" />
                      <span>Expires on {new Date(campaign.valid_to).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <Link to="/cars">
                    <Button 
                      variant="primary" 
                      fullWidth
                      rightIcon={<ArrowRight size={16} />}
                    >
                      Browse Cars
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Additional Info Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Best Price Guarantee</h3>
            <p className="text-secondary-600">
              Find a better price? We'll match it and give you an additional 10% off.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Flexible Cancellation</h3>
            <p className="text-secondary-600">
              Plans change? Cancel up to 48 hours before your rental for a full refund.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Member Rewards</h3>
            <p className="text-secondary-600">
              Join our loyalty program and earn points towards free rental days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealsPage;