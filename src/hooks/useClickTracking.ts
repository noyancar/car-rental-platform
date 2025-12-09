// ================================================
// useClickTracking Hook
// Purpose: Automatically track clicks on buttons, links, and tracked elements
// ================================================

import { useEffect } from 'react';
import { tracker } from '../lib/analytics/tracker';

export function useClickTracking() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Track buttons, links, and elements with data-track attribute
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.hasAttribute('data-track')
      ) {
        tracker.trackClick({
          eventType: target.getAttribute('data-track-type') || 'click',
          eventCategory: target.getAttribute('data-track-category') || undefined,
          eventLabel: target.getAttribute('data-track-label') || undefined,
          elementId: target.id || undefined,
          elementClass: target.className || undefined,
          elementText: target.textContent?.trim() || undefined,
          elementHref:
            target.tagName === 'A' ? (target as HTMLAnchorElement).href : undefined,
          x: e.clientX,
          y: e.clientY,
        });
      }
    };

    // Use capture phase to catch clicks before they bubble
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, []);
}
