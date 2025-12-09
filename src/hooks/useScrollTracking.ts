// ================================================
// useScrollTracking Hook
// Purpose: Track scroll depth (25%, 50%, 75%, 100%)
// ================================================

import { useEffect, useRef } from 'react';
import { tracker } from '../lib/analytics/tracker';

export function useScrollTracking() {
  const trackedMilestones = useRef<Set<number>>(new Set());

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;

      const scrollPercentage = Math.min(
        100,
        Math.round(((scrollTop + windowHeight) / documentHeight) * 100)
      );

      // Track only milestone percentages: 25%, 50%, 75%, 100%
      const milestones = [25, 50, 75, 100];

      for (const milestone of milestones) {
        if (scrollPercentage >= milestone && !trackedMilestones.current.has(milestone)) {
          trackedMilestones.current.add(milestone);
          tracker.trackScrollDepth(milestone);
        }
      }
    };

    // Throttle scroll events (max 1 per second)
    const throttledScroll = throttle(handleScroll, 1000);

    window.addEventListener('scroll', throttledScroll);

    // Reset tracked milestones when component unmounts
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      trackedMilestones.current.clear();
    };
  }, []);
}

// ================================================
// Utility: Throttle function
// ================================================
function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (!timeout) {
      timeout = setTimeout(() => {
        func(...args);
        timeout = null;
      }, wait);
    }
  };
}
