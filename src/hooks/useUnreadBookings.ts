import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useUnreadBookings = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    // Check for new bookings
    const checkUnreadBookings = async () => {
      try {
        // Get last read timestamp from localStorage
        const lastReadTime = localStorage.getItem('lastBookingReadTime') || '2020-01-01';
        
        // Count bookings created after last read time
        const { data, count, error } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'confirmed')
          .gt('created_at', lastReadTime);
        
        if (!error && count !== null) {
          setUnreadCount(count);
        }
      } catch (error) {
        console.error('Error checking unread bookings:', error);
      }
    };
    
    // Check on mount (when page loads/refreshes)
    checkUnreadBookings();
    
    // Check when tab becomes visible again (admin comes back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkUnreadBookings();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Check when admin navigates within the app
    const handleFocus = () => {
      checkUnreadBookings();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  
  // Mark all as read
  const markAllAsRead = () => {
    localStorage.setItem('lastBookingReadTime', new Date().toISOString());
    setUnreadCount(0);
  };
  
  return { unreadCount, markAllAsRead };
};