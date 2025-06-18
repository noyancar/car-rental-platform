import React, { useEffect, useState } from 'react';
import { X, Plus, Minus, Check, AlertCircle, ShoppingCart, Shield, Umbrella, Camera, Package, Fuel, Sparkles, Baby, Armchair, Backpack, Package2, Battery } from 'lucide-react';
import { useExtrasStore } from '../../stores/extrasStore';
import { ExtraCategory } from '../../types';
import { Button } from '../ui/Button';

interface ExtrasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  pickupDate: string;
  returnDate: string;
  rentalDays: number;
  carTotal: number;
}

const categoryInfo: Record<ExtraCategory, { label: string; icon: React.ReactNode }> = {
  services: { label: 'Services', icon: <Sparkles className="w-5 h-5" /> },
  safety: { label: 'Safety', icon: <Shield className="w-5 h-5" /> },
  beach: { label: 'Beach', icon: <Umbrella className="w-5 h-5" /> },
  tech: { label: 'Technology', icon: <Camera className="w-5 h-5" /> },
  camping: { label: 'Camping', icon: <Package className="w-5 h-5" /> }
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
  carTotal
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
  const grandTotal = carTotal + extrasTotal;

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Enhance Your Experience</h2>
            <p className="text-blue-100 mt-1">Add extras to make your trip even better</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-200px)]">
          {/* Left side - Categories and Extras */}
          <div className="flex-1 overflow-y-auto">
            {/* Category tabs */}
            <div className="bg-gray-50 border-b px-6 py-4">
              <div className="flex gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                      activeCategory === category 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {categoryInfo[category].icon}
                    <span className="font-medium">{categoryInfo[category].label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Extras list */}
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading extras...</p>
                </div>
              ) : filteredExtras.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No extras available in this category</p>
              ) : (
                <div className="space-y-4">
                  {filteredExtras.map(extra => {
                    const quantity = getQuantity(extra.id);
                    const isSelected = quantity > 0;
                    const isAvailable = extra.stock_quantity === null || (extra as any).available;
                    
                    return (
                      <div
                        key={extra.id}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        } ${!isAvailable ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              {extra.icon_name && iconMap[extra.icon_name]}
                              <h3 className="text-lg font-semibold text-gray-900">{extra.name}</h3>
                              {isSelected && (
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                                  <Check className="w-4 h-4" />
                                  Added
                                </span>
                              )}
                            </div>
                            {extra.description && (
                              <p className="text-gray-600 mt-2">{extra.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-3">
                              <span className="text-2xl font-bold text-gray-900">
                                ${extra.price.toFixed(2)}
                                <span className="text-sm font-normal text-gray-500 ml-1">
                                  {extra.price_type === 'per_day' ? '/day' : '/trip'}
                                </span>
                              </span>
                              {extra.stock_quantity !== null && (
                                <span className={`text-sm ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                  {isAvailable ? `${extra.stock_quantity} available` : 'Out of stock'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Quantity controls */}
                          <div className="ml-6">
                            {isAvailable ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleQuantityChange(extra.id, -1)}
                                  disabled={quantity === 0}
                                  className={`p-2 rounded-lg transition-all ${
                                    quantity === 0 
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                  }`}
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                                <button
                                  onClick={() => handleQuantityChange(extra.id, 1)}
                                  disabled={quantity >= extra.max_per_booking}
                                  className={`p-2 rounded-lg transition-all ${
                                    quantity >= extra.max_per_booking 
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                                  }`}
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-500 text-sm">
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
          <div className="w-96 bg-gray-50 border-l p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
            
            {/* Selected extras */}
            <div className="flex-1 overflow-y-auto">
              {breakdown.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No extras selected</p>
                  <p className="text-gray-400 text-sm mt-1">Add some extras to enhance your trip</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {breakdown.map((item, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {item.quantity} × ${item.price.toFixed(2)}
                            {extras.find(e => e.name === item.name)?.price_type === 'per_day' && ` × ${rentalDays} days`}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900">${item.total.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="border-t pt-4 mt-4 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Car Rental</span>
                <span>${carTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Extras</span>
                <span>${extrasTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t">
                <span>Total</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 space-y-3">
              <Button
                onClick={onContinue}
                className="w-full py-3"
              >
                {breakdown.length > 0 ? 'Add Extras & Continue' : 'Continue to Payment'}
              </Button>
              <button
                onClick={onContinue}
                className="w-full py-3 text-gray-600 hover:text-gray-800 transition-colors"
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