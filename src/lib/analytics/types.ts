// ================================================
// Analytics Type Definitions
// ================================================

export interface AnalyticsEvent {
  eventType: string;
  sessionId: string;
  userId?: string | null;
  data: any;
}

export interface SessionInitData {
  screenResolution: string;
  language: string;
  timezone: string;
  country: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  referrer?: string | null;
  landingPage: string;
}

export interface PageViewData {
  pageUrl: string;
  pageTitle: string;
  pagePath: string;
  entryPage: boolean;
  referrer?: string | null;
  previousPage?: string | null;
  timeOnPreviousPage?: number;
}

export interface ClickEventData {
  eventType: string;
  eventCategory?: string;
  eventLabel?: string;
  elementId?: string;
  elementClass?: string;
  elementText?: string;
  elementHref?: string;
  pageUrl: string;
  pagePath: string;
  clickX: number;
  clickY: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface FunnelStageData {
  action: 'enter' | 'complete';
  stage: string;
  step?: number;
  carId?: string;
  metadata?: any;
}

export interface FormInteractionData {
  formName: string;
  fieldName: string;
  interactionType: string;
  fieldValue?: string;
  errorMessage?: string;
  pageUrl: string;
  pagePath: string;
}

export interface CarViewData {
  action: 'start' | 'end';
  carId: string;
  fromSearch?: boolean;
  fromDirectLink?: boolean;
  searchFilters?: any;
  clickedBookButton?: boolean;
}

export interface SearchData {
  searchQuery?: string;
  searchType: string;
  startDate?: string;
  endDate?: string;
  pickupLocation?: string;
  returnLocation?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  features?: any;
  resultsCount: number;
}

export interface ScrollDepthData {
  pageUrl: string;
  pagePath: string;
  percentage: number;
}

export interface ExitIntentData {
  pageUrl: string;
  pagePath: string;
  exitType: string;
  timeOnPage: number;
}

export interface DeviceInfo {
  visitorId: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  screenResolution: string;
  language: string;
  timezone: string;
  country?: string;
}
