import React from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUnreadBookings } from '../../hooks/useUnreadBookings';

const SimpleNotificationBadge: React.FC = () => {
  const { unreadCount, markAllAsRead } = useUnreadBookings();
  
  return (
    <Link 
      to="/admin/bookings"
      onClick={markAllAsRead}
      className="relative inline-flex items-center p-2 text-gray-600 hover:text-gray-900 transition-colors"
      title={`${unreadCount} yeni rezervasyon`}
    >
      <Bell className="h-6 w-6" />
      {unreadCount > 0 && (
        <>
          {/* Badge */}
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
          
          {/* Tooltip */}
          <span className="absolute top-full mt-2 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
            {unreadCount} yeni rezervasyon var!
          </span>
        </>
      )}
    </Link>
  );
};

export default SimpleNotificationBadge;