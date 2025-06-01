import React, { useState, useCallback } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { format, addDays, isBefore, isValid, parseISO } from 'date-fns';
import { Button } from './Button';
import { Input } from './Input';

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
  <div className="flex flex-col space-y-1">
    <label className="text-sm font-semibold text-white/90 uppercase tracking-wide">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="
        w-full h-12 px-4 bg-white/95 
        rounded-xl border-2 border-white/20
        text-secondary-900 text-sm font-medium
        focus:border-primary-500 focus:ring focus:ring-primary-500/20
        disabled:opacity-50 disabled:cursor-not-allowed
        transition duration-200
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
  const [pickupDate, setPickupDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [returnDate, setReturnDate] = useState('');
  const [pickupTime, setPickupTime] = useState(DEFAULT_PICKUP_TIME);
  const [returnTime, setReturnTime] = useState(DEFAULT_RETURN_TIME);
  const [validationMessage, setValidationMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);

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

    const hoursDifference = (return_.getTime() - pickup.getTime()) / (1000 * 60 * 60);
    if (hoursDifference < 24) {
      setValidationMessage('Minimum rental period is 24 hours');
      return false;
    }

    setValidationMessage('');
    return true;
  }, [pickupDate, pickupTime, returnDate, returnTime]);

  const handlePickupDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPickupDate = e.target.value;
    setPickupDate(newPickupDate);
    
    if (returnDate && isBefore(parseISO(returnDate), parseISO(newPickupDate))) {
      setReturnDate('');
    }
    
    setValidationMessage('');
  };

  const handlePickupTimeChange = (time: string) => {
    setPickupTime(time);
    
    if (time >= "15:00" && returnDate === pickupDate) {
      const nextDay = format(addDays(parseISO(pickupDate), 1), 'yyyy-MM-dd');
      setReturnDate(nextDay);
    }
  };

  const handleReturnDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReturnDate(e.target.value);
    setValidationMessage('');
  };

  const handleSearch = () => {
    if (!validateDateTime()) return;
    setIsSearching(true);
    try {
      onSearch?.(pickupDate, pickupTime, returnDate, returnTime);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className={`
      bg-white/15 backdrop-blur-[20px] 
      border border-white/30 rounded-[20px]
      p-6 md:p-8 shadow-xl
      ${className}
    `}>
      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Pickup Section */}
          <div className="space-y-4">
            <Input
              label="PICKUP DATE"
              type="date"
              value={pickupDate}
              onChange={handlePickupDateChange}
              min={format(new Date(), 'yyyy-MM-dd')}
              leftIcon={<Calendar className="text-primary-800" size={20} />}
              className="
                h-12 bg-white/95 rounded-xl
                border-2 border-white/20
                focus:border-primary-500 focus:ring-primary-500/20
              "
            />
            <TimeSelector
              label="PICKUP TIME"
              value={pickupTime}
              onChange={handlePickupTimeChange}
            />
          </div>

          {/* Return Section */}
          <div className="space-y-4">
            <Input
              label="RETURN DATE"
              type="date"
              value={returnDate}
              onChange={handleReturnDateChange}
              min={pickupDate}
              leftIcon={<Calendar className="text-primary-800" size={20} />}
              className="
                h-12 bg-white/95 rounded-xl
                border-2 border-white/20
                focus:border-primary-500 focus:ring-primary-500/20
              "
              disabled={!pickupDate}
            />
            <TimeSelector
              label="RETURN TIME"
              value={returnTime}
              onChange={setReturnTime}
              disabled={!returnDate}
            />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        <div className="space-y-4">
          <Input
            label="PICKUP DATE"
            type="date"
            value={pickupDate}
            onChange={handlePickupDateChange}
            min={format(new Date(), 'yyyy-MM-dd')}
            leftIcon={<Calendar className="text-primary-800" size={20} />}
            className="
              h-12 bg-white/95 rounded-xl
              border-2 border-white/20
              focus:border-primary-500 focus:ring-primary-500/20
            "
          />
          <TimeSelector
            label="PICKUP TIME"
            value={pickupTime}
            onChange={handlePickupTimeChange}
          />
        </div>

        <div className="space-y-4">
          <Input
            label="RETURN DATE"
            type="date"
            value={returnDate}
            onChange={handleReturnDateChange}
            min={pickupDate}
            leftIcon={<Calendar className="text-primary-800" size={20} />}
            className="
              h-12 bg-white/95 rounded-xl
              border-2 border-white/20
              focus:border-primary-500 focus:ring-primary-500/20
            "
            disabled={!pickupDate}
          />
          <TimeSelector
            label="RETURN TIME"
            value={returnTime}
            onChange={setReturnTime}
            disabled={!returnDate}
          />
        </div>
      </div>

      {/* Search Button */}
      <div className="mt-6">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSearch}
          disabled={!pickupDate || !returnDate || Boolean(validationMessage) || isSearching}
          isLoading={isSearching}
          className="
            w-full h-14 bg-primary-800 hover:bg-primary-700
            rounded-xl font-semibold uppercase tracking-wide
            transform transition-all duration-200
            hover:scale-[1.02] active:scale-[0.98]
            disabled:hover:scale-100
          "
        >
          {!pickupDate || !returnDate ? 'Select Dates' : 'Find Available Cars'}
        </Button>
      </div>

      {/* Validation Message */}
      {validationMessage && (
        <div className="absolute -bottom-6 left-0 w-full text-center">
          <span className="
            inline-block text-sm text-white bg-error-500/90 
            px-4 py-1.5 rounded-full shadow-lg
          ">
            {validationMessage}
          </span>
        </div>
      )}
    </div>
  );
};