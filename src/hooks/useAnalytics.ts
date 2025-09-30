import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Declare gtag type for TypeScript
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}

export const useAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Send page view to Google Analytics
    if (window.gtag) {
      window.gtag('config', 'G-7RY3DM815X', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);
};