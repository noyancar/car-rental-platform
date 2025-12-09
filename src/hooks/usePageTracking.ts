// ================================================
// usePageTracking Hook
// Purpose: Automatically track page views on route changes
// ================================================

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { tracker } from '../lib/analytics/tracker';

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    const pageUrl = window.location.href;
    const pageTitle = document.title;

    // Track new page view
    tracker.trackPageView(pageUrl, pageTitle);

    // Track exit when component unmounts or location changes
    return () => {
      tracker.trackPageExit();
    };
  }, [location.pathname]);
}
