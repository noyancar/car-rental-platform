import React, { useState, useCallback } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { format, addDays, isBefore, isValid, parseISO } from 'date-fns';
import { Button } from './Button';
import { Input } from './Input';

// Business hours for car rental industry standard
const BUSINESS_HOURS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"
];

const DEFAULT_PICKUP_TIME = "10:00";
const DEFAULT_RETURN_TIME = "10:00";

interface DatePickerCardProps {
  onSearch?: (
    pickupDate: string,
    pickupTime: string,
    returnDate: string,
    returnTime: string
  ) => void;
  className?: string;
}

const TimeSelector: React.FC<{
  value: string;
  onChange: (time: string) => void;
  label: string;
  disabled?: boolean;
}> = ({ value, onChange, label, disabled }) => (
  <div className="flex-1">
    <label className="block text-sm font-medium text-white/90 mb-1">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="
        w-full h-[42px] bg-white/90 backdrop-blur-sm
        border-transparent focus:border-primary-500
        rounded-md text-secondary-900 text-sm
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      {BUSINESS_HOURS.map(time => (
        <option key={time} value={time}>{time}</option>
      ))}
    </select>
  </div>
);

export const DatePickerCard: React.FC<DatePickerCardProps> = ({
  onSearch,
  className = '',
}) => {
  // Date states
  const [pickupDate, setPickupDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [returnDate, setReturnDate] = useState('');
  
  // Time states
  const [pickupTime, setPickupTime] = useState(DEFAULT_PICKUP_TIME);
  const [returnTime, setReturnTime] = useState(DEFAULT_RETURN_TIME);
  
  const [validationMessage, setValidationMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Validate dates and times
  const validateDateTime = useCallback(() => {
    if (!pickupDate || !returnDate) {
      setValidationMessage('Please select both dates');
      return false;
    }

    const pickup = new Date(`${pickupDate}T${pickupTime}`);
    const return_ = new Date(`${returnDate}T${returnTime}`);
    
    if (!isValid(pickup) || !isValid(return_)) {
      setValidationMessage('Invalid date/time format');
      return false;
    }

    if (isBefore(return_, pickup)) {
      setValidationMessage('Return date/time must be after pickup');
      return false;
    }

    // Ensure minimum 24-hour rental
    const hoursDifference = (return_.getTime() - pickup.getTime()) / (1000 * 60 * 60);
    if (hoursDifference < 24) {
      setValidationMessage('Minimum rental period is 24 hours');
      return false;
    }

    setValidationMessage('');
    return true;
  }, [pickupDate, pickupTime, returnDate, returnTime]);

  // Handle pickup date change
  const handlePickupDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPickupDate = e.target.value;
    setPickupDate(newPickupDate);
    
    // Clear return date if it's before new pickup date
    if (returnDate && isBefore(parseISO(returnDate), parseISO(newPickupDate))) {
      setReturnDate('');
    }
    
    setValidationMessage('');
  };

  // Handle pickup time change
  const handlePickupTimeChange = (time: string) => {
    setPickupTime(time);
    
    // If pickup time is after 15:00 and return is same day, suggest next day
    if (time >= "15:00" && returnDate === pickupDate) {
      const nextDay = format(addDays(parseISO(pickupDate), 1), 'yyyy-MM-dd');
      setReturnDate(nextDay);
    }
  };

  // Handle return date/time changes
  const handleReturnDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReturnDate(e.target.value);
    setValidationMessage('');
  };

  // Handle search
  const handleSearch = () => {
    if (!validateDateTime()) {
      return;
    }

    setIsSearching(true);
    
    try {
      onSearch?.(pickupDate, pickupTime, returnDate, returnTime);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div 
      className={`
        relative backdrop-blur-lg bg-white/10 border border-white/20 
        rounded-2xl shadow-xl p-4 md:p-6
        ${className}
      `}
    >
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Pickup Date */}
        <div className="md:col-span-2">
          <Input
            label="Pickup Date"
            type="date"
            value={pickupDate}
            onChange={handlePickupDateChange}
            min={format(new Date(), 'yyyy-MM-dd')}
            leftIcon={<Calendar className="text-primary-800\" size={20} />}
            className="bg-white/90 backdrop-blur-sm border-transparent focus:border-primary-500"
          />
        </div>

        {/* Pickup Time */}
        <TimeSelector
          label="Pickup Time"
          value={pickupTime}
          onChange={handlePickupTimeChange}
        />

        {/* Return Date */}
        <div className="md:col-span-2">
          <Input
            label="Return Date"
            type="date"
            value={returnDate}
            onChange={handleReturnDateChange}
            min={pickupDate}
            leftIcon={<Calendar className="text-primary-800\" size={20} />}
            className="bg-white/90 backdrop-blur-sm border-transparent focus:border-primary-500"
            disabled={!pickupDate}
          />
        </div>

        {/* Return Time */}
        <TimeSelector
          label="Return Time"
          value={returnTime}
          onChange={setReturnTime}
          disabled={!returnDate}
        />

        {/* Search Button */}
        <div className="md:col-span-5">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSearch}
            disabled={!pickupDate || !returnDate || Boolean(validationMessage) || isSearching}
            isLoading={isSearching}
            className="w-full bg-primary-800 hover:bg-primary-700"
          >
            {!pickupDate || !returnDate ? 'Select Dates' : 'Find Available Cars'}
          </Button>
        </div>
      </div>

      {/* Validation Message */}
      {validationMessage && (
        <div className="absolute -bottom-6 left-0 w-full text-center">
          <span className="text-sm text-white bg-error-500/90 px-3 py-1 rounded-full">
            {validationMessage}
          </span>
        </div>
      )}
    </div>
  );
};