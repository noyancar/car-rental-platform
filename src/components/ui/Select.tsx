import React, { SelectHTMLAttributes } from 'react';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
  leftIcon?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  leftIcon,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <div className="w-full relative">
      {label && (
        <label 
          htmlFor={selectId} 
          className="block text-sm sm:text-base font-medium text-secondary-700 mb-1.5"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-500">
            {leftIcon}
          </div>
        )}
        
        <select
          id={selectId}
          className={`
            w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-md border appearance-none bg-white text-sm sm:text-base min-h-[40px] sm:min-h-0
            ${error ? 'border-error-500 focus:ring-error-500' : 'border-secondary-300 focus:ring-primary-500'} 
            focus:outline-none focus:ring-2 focus:border-transparent
            ${leftIcon ? 'pl-9 sm:pl-10' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
              style={option.disabled ? { color: '#9CA3AF', backgroundColor: '#F3F4F6' } : {}}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      {error && (
        <p className="mt-1 text-xs sm:text-sm text-error-500">{error}</p>
      )}
    </div>
  );
};