/**
 * Calculate rental duration in days based on start/end dates and times
 * Uses ceiling to ensure partial days are counted as full days
 * This matches the business logic where any time past the return hour counts as an extra day
 */
export const calculateRentalDuration = (
  startDate: string,
  endDate: string,
  pickupTime: string = '10:00',
  returnTime: string = '10:00'
): number => {
  const startDateTime = new Date(`${startDate}T${pickupTime}`);
  const endDateTime = new Date(`${endDate}T${returnTime}`);
  const diffMs = endDateTime.getTime() - startDateTime.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Calculate base rental price (car price * days)
 */
export const calculateCarRentalTotal = (
  pricePerDay: number,
  rentalDays: number
): number => {
  return pricePerDay * rentalDays;
};

/**
 * Calculate extras total from booking extras
 */
export const calculateExtrasTotal = (
  bookingExtras?: Array<{ total_price: number }>
): number => {
  return bookingExtras?.reduce((sum, be) => sum + be.total_price, 0) || 0;
};