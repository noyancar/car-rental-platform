// ================================================
// FingerprintJS Wrapper (Open Source)
// Purpose: Browser-based visitor identification
// ================================================

import FingerprintJS from '@fingerprintjs/fingerprintjs';
import type { DeviceInfo } from './types';

let fpPromise: Promise<any> | null = null;

/**
 * Initialize FingerprintJS (browser-based, no API required)
 */
export async function initFingerprint() {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  return fpPromise;
}

/**
 * Get unique visitor ID (persistent across sessions)
 */
export async function getVisitorId(): Promise<string> {
  const fp = await initFingerprint();
  const result = await fp.get();

  return result.visitorId;
}

/**
 * Get detailed device/browser information
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  const fp = await initFingerprint();
  const result = await fp.get();

  const { components } = result;

  return {
    visitorId: result.visitorId,
    deviceType: getDeviceType(),
    browser: components.vendor?.value || 'Unknown',
    browserVersion: components.vendorFlavors?.value?.[0] || '',
    os: components.platform?.value || 'Unknown',
    osVersion: components.platformVersion?.value || '',
    screenResolution: `${components.screenResolution?.value?.[0] || 0}x${components.screenResolution?.value?.[1] || 0}`,
    language: components.languages?.value?.[0]?.[0] || navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    country: getApproximateCountry(),
  };
}

/**
 * Detect device type from user agent
 */
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent;

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Get approximate country from timezone (fallback)
 * Server-side IP-based geolocation is more accurate
 */
function getApproximateCountry(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Simple timezone to country mapping (basic fallback)
    const timezoneMap: Record<string, string> = {
      'Europe/Istanbul': 'Turkey',
      'America/New_York': 'United States',
      'America/Los_Angeles': 'United States',
      'America/Chicago': 'United States',
      'Europe/London': 'United Kingdom',
      'Europe/Paris': 'France',
      'Europe/Berlin': 'Germany',
      'Asia/Tokyo': 'Japan',
      'Asia/Shanghai': 'China',
      'Australia/Sydney': 'Australia',
    };

    return timezoneMap[timezone] || 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
}
