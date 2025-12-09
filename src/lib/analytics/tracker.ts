// ================================================
// Analytics Tracker (Client-Side - Minimal)
// Purpose: Send events to Edge Function (server-side tracking)
// ================================================

import { getVisitorId, getDeviceInfo } from './fingerprint';
import type {
  SessionInitData,
  PageViewData,
  ClickEventData,
  FunnelStageData,
  FormInteractionData,
  CarViewData,
  SearchData,
  ScrollDepthData,
  ExitIntentData,
} from './types';


const CACHE = {
  lastTrackedUrl: '',
  lastTrackedTime: 0
};

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-event`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

class AnalyticsTracker {
  private sessionId: string | null = null;
  private userId: string | null = null;
  private sessionInitialized: boolean = false;
  private sessionInitializing: boolean = false;
  private pageStartTime: number = Date.now();
  private currentPageUrl: string = '';

  /**
   * Check if current page should be tracked
   * Returns false for admin pages to avoid polluting analytics
   */
  private shouldTrack(): boolean {
    const pathname = window.location.pathname;
    // Don't track admin pages
    if (pathname.startsWith('/admin')) {
      return false;
    }
    return true;
  }

  /**
   * Initialize analytics session
   * Called once on app load
   */
  async initSession() {
    // Don't initialize session on admin pages
    if (!this.shouldTrack()) {
      // [DEBUG] console.log('[Analytics] Tracking disabled for admin pages');
      return;
    }
    if (this.sessionInitialized || this.sessionInitializing) return;

    try {
      this.sessionInitializing = true;
      this.sessionId = await getVisitorId();
      const deviceInfo = await getDeviceInfo();
      const utmParams = this.getUTMParams();

      const sessionData: SessionInitData = {
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        country: deviceInfo.country || 'Unknown',
        ...utmParams,
        referrer: document.referrer || null,
        landingPage: window.location.pathname,
      };

      // Send session init to Edge Function
      await this.sendEvent('init_session', sessionData);

      this.sessionInitialized = true;
      this.sessionInitializing = false;
      // [DEBUG] console.log('[Analytics] Session initialized:', this.sessionId?.substring(0, 8) + '...');
    } catch (error) {
      this.sessionInitializing = false;
      // [DEBUG] console.error('[Analytics] Failed to initialize session:', error);
    }
  }

  /**
   * Send event to Edge Function (server-side tracking)
   */
  private async sendEvent(eventType: string, data: any): Promise<void> {
    try {
      const userId = await this.getUserId();

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({
          eventType,
          sessionId: this.sessionId,
          userId,
          data,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[Analytics] Event tracking failed:', error);
      }
    } catch (error) {
      // Silently fail - don't break user experience
      console.error('[Analytics] Failed to send event:', error);
    }
  }

  /**
   * Get current user ID (if logged in)
   */
  private async getUserId(): Promise<string | null> {
    try {
      const { supabase } = await import('../supabase');
      const { data } = await supabase.auth.getUser();
      this.userId = data.user?.id || null;
      return this.userId;
    } catch {
      return null;
    }
  }

  /**
   * Extract UTM parameters from URL
   */
  private getUTMParams() {
    const params = new URLSearchParams(window.location.search);

    return {
      utmSource: params.get('utm_source'),
      utmMedium: params.get('utm_medium'),
      utmCampaign: params.get('utm_campaign'),
      utmContent: params.get('utm_content'),
      utmTerm: params.get('utm_term'),
    };
  }

  // ================================================
  // PUBLIC TRACKING METHODS
  // ================================================

  /**
   * Track page view
   */
  async trackPageView(pageUrl: string, pageTitle: string) {
    // Don't track admin pages
    if (!this.shouldTrack()) return;

    if (!this.sessionId) await this.initSession();
    const now = Date.now();

    // AYNI URL'E 750 ms İÇİNDE TEKRAR İSTEK ATILMASINI ENGELLE
    // Bu, "burst" (patlama) şeklindeki mükerrer kayıtları %100 engeller.
    if (CACHE.lastTrackedUrl === pageUrl && (now - CACHE.lastTrackedTime < 750)) {
        // [DEBUG] console.log('Duplicate tracking prevented:', pageUrl);
        return;
    }

    // Calculate time on previous page
    const timeOnPreviousPage = this.currentPageUrl
      ? Math.floor((Date.now() - this.pageStartTime) / 1000)
      : 0;

    // Cache'i güncelle
    CACHE.lastTrackedUrl = pageUrl;
    CACHE.lastTrackedTime = now;
    const isEntryPage = this.currentPageUrl === '';

    const pageViewData: PageViewData = {
      pageUrl,
      pageTitle,
      pagePath: new URL(pageUrl, window.location.origin).pathname,
      entryPage: isEntryPage,
      referrer: document.referrer || null,
      previousPage: this.currentPageUrl || null,
      timeOnPreviousPage: timeOnPreviousPage > 0 ? timeOnPreviousPage : undefined,
    };

    await this.sendEvent('page_view', pageViewData);

    this.currentPageUrl = pageUrl;
    this.pageStartTime = Date.now();
  }

  /**
   * Track page exit (called when component unmounts or beforeunload)
   * Uses sendBeacon for reliability during page unload
   */
  trackPageExit() {
    // Don't track admin pages
    if (!this.shouldTrack()) return;

    const timeOnPage = Math.floor((Date.now() - this.pageStartTime) / 1000);

    if (timeOnPage > 0 && this.currentPageUrl && this.sessionId) {
      const exitData = {
        eventType: 'page_exit',
        sessionId: this.sessionId,
        userId: this.userId,
        data: {
          pageUrl: this.currentPageUrl,
          pagePath: new URL(this.currentPageUrl, window.location.origin).pathname,
          timeOnPage,
        },
      };

      // Use sendBeacon for reliability during page unload
      // sendBeacon queues data to be sent even if page is closing
      try {
        // sendBeacon doesn't support custom headers, so use fetch with keepalive
        fetch(EDGE_FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ANON_KEY}`,
          },
          body: JSON.stringify(exitData),
          keepalive: true, // Ensures request completes even if page closes
        }).catch((error) => {
          console.error('[Analytics] Error sending page exit:', error);
        });
      } catch (error) {
        console.error('[Analytics] Error sending page exit:', error);
      }
    }
  }

  /**
   * Track click event
   */
  async trackClick(eventData: {
    eventType: string;
    eventCategory?: string;
    eventLabel?: string;
    elementId?: string;
    elementClass?: string;
    elementText?: string;
    elementHref?: string;
    x: number;
    y: number;
  }) {
    // Don't track admin pages
    if (!this.shouldTrack()) return;

    if (!this.sessionId) await this.initSession();

    const clickData: ClickEventData = {
      eventType: eventData.eventType,
      eventCategory: eventData.eventCategory,
      eventLabel: eventData.eventLabel,
      elementId: eventData.elementId,
      elementClass: eventData.elementClass,
      elementText: eventData.elementText?.substring(0, 200),
      elementHref: eventData.elementHref,
      pageUrl: window.location.href,
      pagePath: window.location.pathname,
      clickX: eventData.x,
      clickY: eventData.y,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };

    await this.sendEvent('click', clickData);
  }

  /**
   * Track funnel stage entry
   */
  async trackFunnelStage(stage: string, step: number, carId?: string, metadata?: any) {
    // Don't track admin pages
    if (!this.shouldTrack()) return;

    if (!this.sessionId) await this.initSession();

    const funnelData: FunnelStageData = {
      action: 'enter',
      stage,
      step,
      carId,
      metadata,
    };

    await this.sendEvent('funnel_stage', funnelData);
  }

  /**
   * Mark funnel stage as completed
   */
  async completeFunnelStage(stage: string) {
    // Don't track admin pages
    if (!this.shouldTrack()) return;

    if (!this.sessionId) return;

    const funnelData: FunnelStageData = {
      action: 'complete',
      stage,
    };

    await this.sendEvent('funnel_stage', funnelData);
  }

  /**
   * Track form interaction
   */
  async trackFormInteraction(formData: {
    formName: string;
    fieldName: string;
    interactionType: string;
    fieldValue?: string;
    errorMessage?: string;
  }) {
    // Don't track admin pages
    if (!this.shouldTrack()) return;

    if (!this.sessionId) await this.initSession();

    const interactionData: FormInteractionData = {
      ...formData,
      pageUrl: window.location.href,
      pagePath: window.location.pathname,
    };

    await this.sendEvent('form_interaction', interactionData);
  }

  /**
   * Track car view (product analytics)
   * Accepts an object with car details and optional timeSpent
   */
  async trackCarView(data: {
    carId: string;
    carMake?: string;
    carModel?: string;
    carYear?: number;
    category?: string;
    pricePerDay?: number;
    fromSearch?: boolean;
    fromDirectLink?: boolean;
    searchFilters?: any;
    timeSpent?: number;
  }) {
    // Don't track admin pages
    if (!this.shouldTrack()) return;

    if (!this.sessionId) await this.initSession();

    // Determine action based on presence of timeSpent
    const action = data.timeSpent !== undefined ? 'end' : 'start';

    const carViewData: CarViewData = {
      action,
      carId: data.carId,
      fromSearch: data.fromSearch || false,
      fromDirectLink: data.fromDirectLink || false,
      searchFilters: data.searchFilters || null,
    };

    await this.sendEvent('car_view', carViewData);

    // Return function to end view (for backward compatibility)
    return {
      endView: async (clickedBookButton: boolean = false) => {
        const endData: CarViewData = {
          action: 'end',
          carId: data.carId,
          clickedBookButton,
        };
        await this.sendEvent('car_view', endData);
      },
    };
  }

  /**
   * Track search query
   */
  async trackSearch(searchData: {
    searchQuery?: string;
    searchType?: string;
    startDate?: Date;
    endDate?: Date;
    pickupLocation?: string;
    returnLocation?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    features?: any;
    filters?: any;
    resultsCount: number;
  }) {
    // Don't track admin pages
    if (!this.shouldTrack()) return;

    if (!this.sessionId) await this.initSession();

    const searchTrackingData: SearchData = {
      searchQuery: searchData.searchQuery,
      searchType: searchData.searchType || 'car_search',
      startDate: searchData.startDate?.toISOString().split('T')[0],
      endDate: searchData.endDate?.toISOString().split('T')[0],
      pickupLocation: searchData.pickupLocation || searchData.filters?.pickupLocation,
      returnLocation: searchData.returnLocation || searchData.filters?.returnLocation,
      category: searchData.category || searchData.filters?.category,
      priceMin: searchData.priceMin || searchData.filters?.minPrice,
      priceMax: searchData.priceMax || searchData.filters?.maxPrice,
      features: searchData.features || searchData.filters,
      resultsCount: searchData.resultsCount,
    };

    await this.sendEvent('search', searchTrackingData);

    return {
      recordClick: async (_carId: string) => {
        // Can implement if needed (track which car was clicked from search results)
      },
    };
  }

  /**
   * Track scroll depth
   */
  async trackScrollDepth(percentage: number) {
    // Don't track admin pages
    if (!this.shouldTrack()) return;

    // Wait for session to be fully initialized
    if (!this.sessionId) await this.initSession();
    if (!this.sessionId) {
      console.warn('[Analytics] Cannot track scroll: session not initialized');
      return;
    }

    const scrollData: ScrollDepthData = {
      pageUrl: window.location.href,
      pagePath: window.location.pathname,
      percentage,
    };

    await this.sendEvent('scroll_depth', scrollData);
  }

  /**
   * Track exit intent
   */
  async trackExitIntent(exitType: string, timeOnPage: number = 0) {
    // Don't track admin pages
    if (!this.shouldTrack()) return;

    if (!this.sessionId) await this.initSession();

    const exitData: ExitIntentData = {
      pageUrl: window.location.href,
      pagePath: window.location.pathname,
      exitType,
      timeOnPage,
    };

    await this.sendEvent('exit_intent', exitData);
  }
}

// Export singleton instance
export const tracker = new AnalyticsTracker();
