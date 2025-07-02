import React from 'react';
import { MapPin, Building2, Plane, HelpCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLocations } from '../../hooks/useLocations';

interface LocationSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  showCategories?: boolean;
  excludeCustom?: boolean;
  hideFeesInOptions?: boolean;
}

type LocationCategory = 'base' | 'airport' | 'hotel' | 'custom';

const categoryIcons: Record<LocationCategory, React.ReactNode> = {
  base: <Building2 className="w-4 h-4" />,
  airport: <Plane className="w-4 h-4" />,
  hotel: <MapPin className="w-4 h-4" />,
  custom: <HelpCircle className="w-4 h-4" />
};

const categoryLabels: Record<LocationCategory, string> = {
  base: 'Office (Free Pickup/Return)',
  airport: 'Airport',
  hotel: 'Premium Hotels',
  custom: 'Custom Location'
};

export function LocationSelector({
  value,
  onChange,
  label,
  placeholder = 'Select location',
  error,
  showCategories = true,
  excludeCustom = false,
  hideFeesInOptions = false
}: LocationSelectorProps) {
  const { locations: allLocations, loading } = useLocations();
  
  const locations = excludeCustom 
    ? allLocations.filter(loc => loc.category !== 'custom')
    : allLocations;

  const groupedLocations = locations.reduce((acc, location) => {
    if (!acc[location.category]) {
      acc[location.category] = [];
    }
    acc[location.category].push(location);
    return acc;
  }, {} as Record<LocationCategory, typeof locations[0][]>);

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 min-h-[40px]"
        style={{
          display: 'block',
          width: '100%',
          padding: '8px 12px',
          border: '2px solid #9CA3AF',
          borderRadius: '8px',
          backgroundColor: 'white',
          color: '#111827',
          minHeight: '40px',
          fontSize: '16px'
        }}
      >
        <option value="">{placeholder}</option>
        
        {showCategories ? (
          Object.entries(groupedLocations).map(([category, locs]) => (
            <optgroup key={category} label={categoryLabels[category as LocationCategory]}>
              {locs.map((location) => (
                <option key={location.value} value={location.value}>
                  {location.label}
                  {!hideFeesInOptions && location.fee > 0 && ` ($${location.fee})`}
                  {!hideFeesInOptions && location.fee === -1 && ' (Quote)'}
                </option>
              ))}
            </optgroup>
          ))
        ) : (
          locations.map((location) => (
            <option key={location.value} value={location.value}>
              {location.label}
            </option>
          ))
        )}
      </select>
      
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}

interface LocationDisplayProps {
  locationValue: string;
  showIcon?: boolean;
  showFee?: boolean;
  className?: string;
}

export function LocationDisplay({ 
  locationValue, 
  showIcon = true, 
  showFee = false,
  className 
}: LocationDisplayProps) {
  const { getLocationByValue } = useLocations();
  const location = getLocationByValue(locationValue);
  
  if (!location) return null;
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showIcon && (
        <span className="text-gray-500">
          {categoryIcons[location.category as LocationCategory]}
        </span>
      )}
      <span>{location.label}</span>
      {showFee && location.fee > 0 && (
        <span className="text-sm text-gray-500">
          (${location.fee} delivery)
        </span>
      )}
      {showFee && location.fee === -1 && (
        <span className="text-sm text-gray-500">
          (Quote required)
        </span>
      )}
    </div>
  );
}