import React, { useState, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import { format, addDays, isBefore, isValid, parseISO } from 'date-fns';
import { Button } from './Button';
import { Input } from './Input';

interface DatePickerCardProps {
  onSearch?: (pickupDate: string, returnDate: string) => void;
  className?: string;
}

export const DatePickerCard: React.FC<DatePickerCardProps> = ({
  onSearch,
  className = '',
}) => {
  // Initialize pickup date to today, but leave return date empty
  const [pickupDate, setPickupDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [returnDate, setReturnDate] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Validate dates and return status
  const validateDates = useCallback(() => {
    if (!pickupDate || !returnDate) {
      setValidationMessage('Please select both dates');
      return false;
    }

    const pickup = parseISO(pickupDate);
    const return_ = parseISO(returnDate);
    
    if (!isValid(pickup) || !isValid(return_)) {
      setValidationMessage('Invalid date format');
      return false;
    }

    if (isBefore(return_, pickup)) {
      setValidationMessage('Return date must be after pickup date');
      return false;
    }

    setValidationMessage('');
    return true;
  }, [pickupDate, returnDate]);

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

  // Handle return date change
  const handleReturnDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReturnDate(e.target.value);
    setValidationMessage('');
  };

  // Handle search
  const handleSearch = () => {
    if (!validateDates()) {
      return;
    }

    setIsSearching(true);
    
    try {
      onSearch?.(pickupDate, returnDate);
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
      <div className="flex flex-col md:flex-row gap-4">
        {/* Pickup Date */}
        <div className="flex-1">
          <Input
            label="Pickup Date"
            type="date"
            value={pickupDate}
            onChange={handlePickupDateChange}
            min={format(new Date(), 'yyyy-MM-dd')}
            leftIcon={<Calendar className="text-primary-800" size={20} />}
            className="bg-white/90 backdrop-blur-sm border-transparent focus:border-primary-500"
          />
        </div>

        {/* Return Date */}
        <div className="flex-1">
          <Input
            label="Return Date"
            type="date"
            value={returnDate}
            onChange={handleReturnDateChange}
            min={pickupDate}
            leftIcon={<Calendar className="text-primary-800" size={20} />}
            className="bg-white/90 backdrop-blur-sm border-transparent focus:border-primary-500"
            disabled={!pickupDate}
          />
        </div>

        {/* Search Button */}
        <div className="flex items-end">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSearch}
            disabled={!pickupDate || !returnDate || Boolean(validationMessage) || isSearching}
            isLoading={isSearching}
            className="w-full md:w-auto min-w-[160px] bg-primary-800 hover:bg-primary-700"
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