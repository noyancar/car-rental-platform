import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Tag, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useBookingStore } from '../../stores/bookingStore';
import type { PriceCalculationResult } from '../../types';

interface PriceBreakdownProps {
  carId: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  className?: string;
}

export const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  carId,
  startDate,
  endDate,
  startTime,
  endTime,
  className = ''
}) => {
  const { calculatePriceWithBreakdown } = useBookingStore();
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    const loadPricing = async () => {
      if (carId && startDate && endDate) {
        setLoading(true);
        try {
          const result = await calculatePriceWithBreakdown(carId, startDate, endDate, startTime, endTime);
          setPriceCalculation(result);
        } catch (error) {
          console.error('Error calculating price breakdown:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadPricing();
  }, [carId, startDate, endDate, startTime, endTime, calculatePriceWithBreakdown]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!priceCalculation) {
    // Show a message instead of returning null
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm ${className}`}>
        <p className="text-yellow-800">
          ℹ️ Unable to load seasonal pricing breakdown. Using standard pricing.
        </p>
      </div>
    );
  }

  const hasSpecialPricing = priceCalculation.special_price_days > 0;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Price Details</h3>
          {hasSpecialPricing && (
            <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-xs font-semibold">
              <Tag className="w-3 h-3" />
              Special Pricing
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600">
          {(() => {
            const totalDays = priceCalculation.base_price_days + priceCalculation.special_price_days;
            return `${totalDays} ${totalDays === 1 ? 'day' : 'days'} rental`;
          })()}
        </p>
      </div>

      {/* Summary */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-700">Average per day:</span>
          <span className="font-semibold text-gray-900">${priceCalculation.average_per_day.toFixed(2)}</span>
        </div>

        {hasSpecialPricing && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <Tag className="w-4 h-4 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-900">Special pricing applied</p>
                <p className="text-xs text-orange-700 mt-1">
                  {priceCalculation.special_price_days} {priceCalculation.special_price_days === 1 ? 'day' : 'days'} with special pricing
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Expandable Daily Breakdown */}
        {priceCalculation.daily_breakdown && priceCalculation.daily_breakdown.length > 0 && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center justify-between w-full text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Daily Breakdown
              </span>
              {showBreakdown ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {showBreakdown && (
              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {priceCalculation.daily_breakdown.map((day, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center p-2 rounded-lg ${
                      day.is_special_price ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {format(new Date(day.date), 'MMM d, yyyy')}
                      </p>
                      {day.is_special_price && (
                        <p className="text-xs text-orange-700 mt-0.5 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {day.pricing_name}
                        </p>
                      )}
                    </div>
                    <span className={`text-sm font-semibold ${
                      day.is_special_price ? 'text-orange-700' : 'text-gray-900'
                    }`}>
                      ${day.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Total */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Subtotal:</span>
            <span className="text-2xl font-bold text-primary-700">
              ${priceCalculation.total_price.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
