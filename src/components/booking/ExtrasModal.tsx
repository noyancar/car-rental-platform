import React, { useEffect, useState } from 'react';
import { X, Plus, Minus, Check, AlertCircle, ShoppingCart, Shield, Umbrella, Camera, Package, Fuel, Sparkles, Baby, Armchair, Backpack, Package2, Battery } from 'lucide-react';
import { useExtrasStore } from '../../stores/extrasStore';
import { ExtraCategory } from '../../types';
import { Button } from '../ui/Button';

interface ExtrasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (selectedExtras: Map<string, { extra: any; quantity: number }>) => void;
  pickupDate: string;
  returnDate: string;
  rentalDays: number;
  carTotal: number;
  deliveryFee?: number;
  requiresQuote?: boolean;
}

const categoryInfo: Record<ExtraCategory, { label: string; icon: React.ReactNode }> = {
  services: { label: 'Services', icon: <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /> },
  safety: { label: 'Safety', icon: <Shield className="w-4 h-4 sm:w-5 sm:h-5" /> },
  beach: { label: 'Beach', icon: <Umbrella className="w-4 h-4 sm:w-5 sm:h-5" /> },
  tech: { label: 'Technology', icon: <Camera className="w-4 h-4 sm:w-5 sm:h-5" /> },
  camping: { label: 'Camping', icon: <Package className="w-4 h-4 sm:w-5 sm:h-5" /> }
};

const iconMap: Record<string, React.ReactNode> = {
  Fuel: <Fuel className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  Baby: <Baby className="w-5 h-5" />,
  Armchair: <Armchair className="w-5 h-5" />,
  Umbrella: <Umbrella className="w-5 h-5" />,
  ShoppingCart: <ShoppingCart className="w-5 h-5" />,
  Package: <Package className="w-5 h-5" />,
  Backpack: <Backpack className="w-5 h-5" />,
  Package2: <Package2 className="w-5 h-5" />,
  Camera: <Camera className="w-5 h-5" />,
  Battery: <Battery className="w-5 h-5" />
};

export default function ExtrasModal({
  isOpen,
  onClose,
  onContinue,
  pickupDate,
  returnDate,
  rentalDays,
  carTotal,
  deliveryFee = 0,
  requiresQuote = false
}: ExtrasModalProps) {
  const { extras, selectedExtras, loading, fetchExtras, addExtra, removeExtra, updateQuantity, calculateTotal } = useExtrasStore();
  const [activeCategory, setActiveCategory] = useState<ExtraCategory>('services');
  
  useEffect(() => {
    if (isOpen) {
      fetchExtras(pickupDate, returnDate);
    }
  }, [isOpen, pickupDate, returnDate]);

  if (!isOpen) return null;

  const { extrasTotal, breakdown } = calculateTotal(rentalDays);
  const grandTotal = carTotal + extrasTotal + (requiresQuote ? 0 : deliveryFee);

  const categories = Object.keys(categoryInfo) as ExtraCategory[];
  const filteredExtras = extras.filter(extra => extra.category === activeCategory);

  const handleQuantityChange = (extraId: string, delta: number) => {
    const selected = selectedExtras.get(extraId);
    const extra = extras.find(e => e.id === extraId);
    
    if (!extra) return;
    
    if (selected) {
      const newQuantity = selected.quantity + delta;
      if (newQuantity <= 0) {
        removeExtra(extraId);
      } else if (newQuantity <= extra.max_per_booking) {
        updateQuantity(extraId, newQuantity);
      }
    } else if (delta > 0) {
      addExtra(extra, 1);
    }
  };

  const getQuantity = (extraId: string): number => {
    const selected = selectedExtras.get(extraId);
    return selected ? selected.quantity : 0;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-hawaii max-w-6xl w-full max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="gradient-hawaii text-white p-4 sm:p-5 md:p-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-display font-bold">Enhance Your Island Adventure</h2>
            <p className="text-white/90 text-sm sm:text-base mt-0.5 sm:mt-1">Add extras to make your trip even better</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 group"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-200px)]">
          {/* Left side - Categories and Extras */}
          <div className="flex-1 overflow-y-auto">
            {/* Category tabs */}
            <div className="bg-sandy-100 border-b border-sandy-200 px-3 py-3 sm:px-6 sm:py-4">
              <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg flex items-center gap-1.5 sm:gap-2 transition-all duration-200 whitespace-nowrap ${
                      activeCategory === category 
                        ? 'bg-primary-600 text-white shadow-lg transform scale-105' 
                        : 'bg-white text-volcanic-700 hover:bg-sandy-200 hover:shadow-md'
                    }`}
                  >
                    {categoryInfo[category].icon}
                    <span className="font-semibold text-sm sm:text-base">{categoryInfo[category].label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Extras list */}
            <div className="p-3 sm:p-4 md:p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="loading-spinner h-12 w-12 mx-auto"></div>
                  <p className="text-volcanic-500 mt-3 sm:mt-4 text-sm sm:text-base">Loading extras...</p>
                </div>
              ) : filteredExtras.length === 0 ? (
                <p className="text-center text-volcanic-500 py-8 sm:py-12 text-sm sm:text-base">No extras available in this category</p>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {filteredExtras.map(extra => {
                    const quantity = getQuantity(extra.id);
                    const isSelected = quantity > 0;
                    const isAvailable = extra.stock_quantity === null || (extra as any).available;
                    
                    return (
                      <div
                        key={extra.id}
                        className={`p-4 sm:p-5 md:p-6 rounded-xl border-2 transition-all duration-300 ${
                          isSelected 
                            ? 'border-primary-500 bg-primary-50 shadow-lg' 
                            : 'border-sandy-200 hover:border-primary-300 hover:shadow-md bg-white'
                        } ${!isAvailable ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              {extra.icon_name && iconMap[extra.icon_name]}
                              <h3 className="text-base sm:text-lg font-display font-semibold text-volcanic-900">{extra.name}</h3>
                              {isSelected && (
                                <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm flex items-center gap-1 font-medium">
                                  <Check className="w-4 h-4" />
                                  Added
                                </span>
                              )}
                            </div>
                            {extra.description && (
                              <p className="text-volcanic-600 mt-1.5 sm:mt-2 text-sm sm:text-base">{extra.description}</p>
                            )}
                            <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-3">
                              <span className="text-lg sm:text-xl md:text-2xl font-bold text-volcanic-900">
                                ${extra.price.toFixed(2)}
                                <span className="text-sm font-normal text-volcanic-500 ml-1">
                                  {extra.price_type === 'per_day' ? '/day' : '/trip'}
                                </span>
                              </span>
                              {extra.stock_quantity !== null && (
                                <span className={`text-sm font-medium ${isAvailable ? 'text-success-600' : 'text-error-600'}`}>
                                  {isAvailable ? `${extra.stock_quantity} available` : 'Out of stock'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Quantity controls */}
                          <div className="ml-3 sm:ml-4 md:ml-6">
                            {isAvailable ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleQuantityChange(extra.id, -1)}
                                  disabled={quantity === 0}
                                  className={`p-2 rounded-lg transition-all duration-200 ${
                                    quantity === 0 
                                      ? 'bg-sandy-100 text-sandy-400 cursor-not-allowed' 
                                      : 'bg-sandy-200 hover:bg-sandy-300 text-volcanic-700 hover:shadow-md'
                                  }`}
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-12 text-center font-bold text-lg text-volcanic-900">{quantity}</span>
                                <button
                                  onClick={() => handleQuantityChange(extra.id, 1)}
                                  disabled={quantity >= extra.max_per_booking}
                                  className={`p-2 rounded-lg transition-all duration-200 ${
                                    quantity >= extra.max_per_booking 
                                      ? 'bg-sandy-100 text-sandy-400 cursor-not-allowed' 
                                      : 'bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg'
                                  }`}
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="px-4 py-2 bg-sandy-100 rounded-lg text-volcanic-500 text-sm font-medium">
                                Unavailable
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right side - Summary */}
          <div className="w-96 bg-sandy-50 border-l border-sandy-200 p-6 flex flex-col">
            <h3 className="text-lg font-display font-semibold text-volcanic-900 mb-4">Booking Summary</h3>
            
            {/* Selected extras */}
            <div className="flex-1 overflow-y-auto">
              {breakdown.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-volcanic-300 mx-auto mb-3" />
                  <p className="text-volcanic-600 font-medium">No extras selected</p>
                  <p className="text-volcanic-400 text-sm mt-1">Add some extras to enhance your trip</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {breakdown.map((item, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-volcanic-900">{item.name}</p>
                          <p className="text-sm text-volcanic-600 mt-1">
                            {item.quantity} × ${item.price.toFixed(2)}
                            {extras.find(e => e.name === item.name)?.price_type === 'per_day' && ` × ${rentalDays} days`}
                          </p>
                        </div>
                        <p className="font-bold text-volcanic-900">${item.total.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-sandy-300 pt-4 mt-4 space-y-3">
              <div className="flex justify-between text-volcanic-600">
                <span>Car Rental</span>
                <span className="font-medium">${carTotal.toFixed(2)}</span>
              </div>
              {extrasTotal > 0 && (
                <div className="flex justify-between text-volcanic-600">
                  <span>Extras</span>
                  <span className="font-medium">${extrasTotal.toFixed(2)}</span>
                </div>
              )}
              {deliveryFee > 0 && !requiresQuote && (
                <div className="flex justify-between text-volcanic-600">
                  <span>Delivery Fee</span>
                  <span className="font-medium">${deliveryFee.toFixed(2)}</span>
                </div>
              )}
              {requiresQuote && (
                <div className="flex justify-between text-orange-600">
                  <span>Delivery Fee</span>
                  <span className="font-medium italic">Quote required</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-volcanic-900 pt-3 border-t border-sandy-300">
                <span>Total</span>
                <span className="text-accent-500">
                  {requiresQuote ? (
                    <span className="text-base">${(carTotal + extrasTotal).toFixed(2)} + quote</span>
                  ) : (
                    `$${grandTotal.toFixed(2)}`
                  )}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 space-y-3">
              <Button
                onClick={() => onContinue(selectedExtras)}
                className="w-full py-3 shadow-lg hover:shadow-xl"
                variant="accent"
              >
                {breakdown.length > 0 ? 'Add Extras & Continue' : 'Continue to Payment'}
              </Button>
              <button
                onClick={() => onContinue(selectedExtras)}
                className="w-full py-3 text-volcanic-600 hover:text-volcanic-800 transition-all duration-200 font-medium"
              >
                Skip & Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 