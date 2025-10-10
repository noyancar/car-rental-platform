import type { Booking } from '../types';

/**
 * Format booking ID to short 8-character uppercase format
 */
export const formatBookingId = (id: string): string => {
  return id.slice(0, 8).toUpperCase();
};

/**
 * Check if a booking has expired
 */
export const isBookingExpired = (booking: Booking): boolean => {
  if (booking.status !== 'draft' || !booking.expires_at) {
    return false;
  }
  return new Date(booking.expires_at) < new Date();
};

/**
 * Get minutes remaining until booking expires
 */
export const getExpiryMinutesLeft = (booking: Booking): number => {
  if (!booking.expires_at) return 0;

  const now = new Date().getTime();
  const expiry = new Date(booking.expires_at).getTime();
  const minutesLeft = Math.ceil((expiry - now) / (1000 * 60));

  return Math.max(0, minutesLeft);
};

/**
 * Filter out expired draft bookings from a list
 */
export const filterActiveBookings = (bookings: Booking[]): Booking[] => {
  return bookings.filter(booking => {
    // Keep all non-draft bookings
    if (booking.status !== 'draft') return true;

    // For draft bookings, only keep non-expired ones
    return !isBookingExpired(booking);
  });
};
