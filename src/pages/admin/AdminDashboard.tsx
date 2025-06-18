import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, CalendarCheck, Tag, Megaphone, Users, TrendingUp, DollarSign, Clock, Package } from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';

const AdminDashboard: React.FC = () => {
  const { 
    allCars, 
    allBookings, 
    discountCodes, 
    campaigns,
    fetchAllCars,
    fetchAllBookings,
    fetchDiscountCodes,
    fetchCampaigns,
    loading 
  } = useAdminStore();
  
  useEffect(() => {
    fetchAllCars();
    fetchAllBookings();
    fetchDiscountCodes();
    fetchCampaigns();
  }, [fetchAllCars, fetchAllBookings, fetchDiscountCodes, fetchCampaigns]);
  
  const stats = [
    {
      title: 'Total Cars',
      value: allCars.length,
      icon: <Car className="h-6 w-6 text-primary-600" />,
      link: '/admin/cars',
    },
    {
      title: 'Active Bookings',
      value: allBookings.filter(b => b.status === 'confirmed').length,
      icon: <CalendarCheck className="h-6 w-6 text-primary-600" />,
      link: '/admin/bookings',
    },
    {
      title: 'Active Discounts',
      value: discountCodes.filter(d => d.active).length,
      icon: <Tag className="h-6 w-6 text-primary-600" />,
      link: '/admin/discount-codes',
    },
    {
      title: 'Active Campaigns',
      value: campaigns.filter(c => c.active).length,
      icon: <Megaphone className="h-6 w-6 text-primary-600" />,
      link: '/admin/campaigns',
    },
  ];
  
  const recentBookings = allBookings.slice(0, 5);
  
  if (loading) {
    return (
      <div className="min-h-screen pt-16 pb-12 flex items-center justify-center bg-secondary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pt-16 pb-12 bg-secondary-50">
      <div className="container-custom">
        <h1 className="text-3xl font-display font-bold text-primary-800 mb-8">
          Admin Dashboard
        </h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Link 
              key={index}
              to={stat.link}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary-600">{stat.title}</p>
                  <p className="text-3xl font-semibold mt-2">{stat.value}</p>
                </div>
                {stat.icon}
              </div>
            </Link>
          ))}
        </div>
        
        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Recent Bookings</h2>
              <Link 
                to="/admin/bookings"
                className="text-primary-600 hover:text-primary-800"
              >
                View All
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div 
                  key={booking.id}
                  className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-secondary-500 mr-3" />
                    <div>
                      <p className="font-medium">
                        {booking.car?.make} {booking.car?.model}
                      </p>
                      <p className="text-sm text-secondary-500">
                        {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      booking.status === 'confirmed' ? 'bg-success-50 text-success-500' :
                      booking.status === 'cancelled' ? 'bg-error-50 text-error-500' :
                      'bg-warning-50 text-warning-500'
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link 
                to="/admin/cars"
                className="flex items-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
              >
                <Car className="h-6 w-6 text-primary-600 mr-3" />
                <div>
                  <p className="font-medium">Manage Cars</p>
                  <p className="text-sm text-secondary-500">Add or edit vehicles</p>
                </div>
              </Link>
              
              <Link 
                to="/admin/bookings"
                className="flex items-center p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
              >
                <CalendarCheck className="h-6 w-6 text-secondary-600 mr-3" />
                <div>
                  <p className="font-medium">View Bookings</p>
                  <p className="text-sm text-secondary-500">Manage reservations</p>
                </div>
              </Link>
              
              <Link 
                to="/admin/extras"
                className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Package className="h-6 w-6 text-purple-600 mr-3" />
                <div>
                  <p className="font-medium">Manage Extras</p>
                  <p className="text-sm text-secondary-500">Add-on services</p>
                </div>
              </Link>
              
              <Link 
                to="/admin/discount-codes"
                className="flex items-center p-4 bg-accent-50 rounded-lg hover:bg-accent-100 transition-colors"
              >
                <Tag className="h-6 w-6 text-accent-600 mr-3" />
                <div>
                  <p className="font-medium">Discount Codes</p>
                  <p className="text-sm text-secondary-500">Create promotions</p>
                </div>
              </Link>
              
              <Link 
                to="/admin/campaigns"
                className="flex items-center p-4 bg-success-50 rounded-lg hover:bg-success-100/50 transition-colors"
              >
                <Megaphone className="h-6 w-6 text-success-500 mr-3" />
                <div>
                  <p className="font-medium">Campaigns</p>
                  <p className="text-sm text-secondary-500">Manage marketing</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;