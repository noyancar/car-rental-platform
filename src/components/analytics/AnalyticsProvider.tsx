// ================================================
// AnalyticsProvider Component
// Purpose: Global analytics wrapper - activates all tracking hooks
// ================================================

import { useEffect } from 'react';
import { usePageTracking } from '../../hooks/usePageTracking';
import { useClickTracking } from '../../hooks/useClickTracking';
import { useScrollTracking } from '../../hooks/useScrollTracking';
import { tracker } from '../../lib/analytics/tracker';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  // Activate all tracking hooks
  usePageTracking();
  useClickTracking();
  useScrollTracking();

  useEffect(() => {
    // Initialize analytics session on mount
    tracker.initSession();

    // Track exit intent (mouse leaving viewport)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        const timeOnPage = Math.floor((Date.now() - performance.now()) / 1000);
        tracker.trackExitIntent('mouse_leave', timeOnPage);
      }
    };

    // Track visibility change (tab switch, minimize)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        tracker.trackExitIntent('tab_hidden', 0);
      }
    };

    // Track before unload (close tab, navigate away)
    const handleBeforeUnload = () => {
      const timeOnPage = Math.floor((Date.now() - performance.now()) / 1000);
      tracker.trackExitIntent('close_tab', timeOnPage);
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return <>{children}</>;
}
