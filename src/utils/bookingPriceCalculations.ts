import { BookingWithExtras } from '../types';

export interface PriceBreakdown {
  carRentalSubtotal: number;
  pickupDeliveryFee: number;
  returnDeliveryFee: number;
  totalDeliveryFee: number;
  extrasTotal: number;
  grandTotal: number;
}

/**
 * Calculate rental duration in days from dates and times
 */
export function calculateRentalDuration(
  startDate: string, 
  endDate: string, 
  startTime?: string, 
  endTime?: string
): number {
  // If times are provided, use them for more accurate calculation
  if (startTime && endTime) {
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    const diffMs = endDateTime.getTime() - startDateTime.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }
  
  // Otherwise just use dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

interface LocationData {
  id?: string;
  value: string;
  label: string;
  delivery_fee: number;
}

/**
 * Calculate complete price breakdown for a booking
 * Works with both old bookings (calculates from scratch) and new bookings (uses stored values)
 */
export function calculateBookingPriceBreakdown(
  booking: BookingWithExtras & {
    car_rental_subtotal: number;
    pickup_delivery_fee: number;
    return_delivery_fee: number;
  }
): PriceBreakdown {
  const extrasTotal = booking.booking_extras?.reduce(
    (sum, extra) => sum + Number(extra.total_price),
    0
  ) || 0;

  return {
    carRentalSubtotal: booking.car_rental_subtotal,
    pickupDeliveryFee: booking.pickup_delivery_fee,
    returnDeliveryFee: booking.return_delivery_fee,
    totalDeliveryFee: booking.pickup_delivery_fee + booking.return_delivery_fee,
    extrasTotal,
    grandTotal: booking.grand_total || booking.total_price
  };
}

