import { supabase } from '../lib/supabase';

/**
 * Represents the daily price for a specific car on a specific date
 */
export interface DailyPrice {
  date: string;          // YYYY-MM-DD format
  price: number;
  isSpecialPrice: boolean;
  pricingName?: string;  // Name of the seasonal pricing if applicable
}

/**
 * Map of car_id -> date -> DailyPrice
 */
export type CarDailyPricesMap = Map<string, Map<string, DailyPrice>>;

/**
 * Response from the calculate_car_price database function
 */
interface CalculateCarPriceResponse {
  total_price: number;
  daily_breakdown: Array<{
    date: string;
    price: number;
    pricing_name: string;
    is_special_price: boolean;
  }>;
  base_price_days: number;
  special_price_days: number;
  average_per_day: number;
}

/**
 * Fetches daily prices for a single car using the database function
 * This is the single source of truth for price calculation
 */
async function fetchCarDailyPrices(
  carId: string,
  startDate: string,
  endDate: string
): Promise<Map<string, DailyPrice>> {
  const carPrices = new Map<string, DailyPrice>();

  // Using type assertion because calculate_car_price is not in generated Supabase types
  const { data, error } = await (supabase.rpc as any)('calculate_car_price', {
    p_car_id: carId,
    p_start_date: startDate,
    p_end_date: endDate
  });

  if (error) {
    console.error(`Error fetching prices for car ${carId}:`, error);
    return carPrices;
  }

  // The RPC returns an array with one row
  const result = (data as unknown as CalculateCarPriceResponse[])?.[0];
  if (!result?.daily_breakdown) return carPrices;

  // Convert daily_breakdown to our DailyPrice map
  for (const day of result.daily_breakdown) {
    carPrices.set(day.date, {
      date: day.date,
      price: day.price,
      isSpecialPrice: day.is_special_price,
      pricingName: day.is_special_price ? day.pricing_name : undefined
    });
  }

  return carPrices;
}

/**
 * Builds a complete price map for multiple cars across a date range
 * Uses the database function calculate_car_price as single source of truth
 */
export async function buildCarDailyPricesMap(
  cars: Array<{ id: string; price_per_day: number }>,
  startDate: string,
  endDate: string
): Promise<CarDailyPricesMap> {
  const pricesMap: CarDailyPricesMap = new Map();

  if (cars.length === 0) return pricesMap;

  // Fetch prices for all cars in parallel
  const pricePromises = cars.map(async (car) => {
    const prices = await fetchCarDailyPrices(car.id, startDate, endDate);
    return { carId: car.id, prices };
  });

  const results = await Promise.all(pricePromises);

  // Build the map from results
  for (const { carId, prices } of results) {
    pricesMap.set(carId, prices);
  }

  return pricesMap;
}

/**
 * Formats price for display (e.g., "$89")
 */
export function formatPrice(price: number): string {
  return `$${Math.round(price)}`;
}
