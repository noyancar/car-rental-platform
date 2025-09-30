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
    console.log('Analytics initialized');

    // Send page view to Google Analytics
    if (window.gtag) {
      window.gtag('config', 'G-7RY3DM815X', {
        page_path: location.pathname + location.search,
      });
    }

    // Check for UTM parameters
    const searchParams = new URLSearchParams(location.search);
    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');

    // If UTM parameters exist, send custom event
    if (utmSource || utmMedium || utmCampaign) {
      console.log('UTM parameters detected:', {
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
      });

      if (window.gtag) {
        window.gtag('event', 'campaign_tracking', {
          campaign_source: utmSource,
          campaign_medium: utmMedium,
          campaign_name: utmCampaign,
        });
      }
    }
  }, [location]);
};