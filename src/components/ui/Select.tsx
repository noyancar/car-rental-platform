import React, { SelectHTMLAttributes } from 'react';

interface Option {
  value: string;
  label: string;
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
          className="block text-sm font-medium text-secondary-700 mb-1"
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
            w-full px-3 sm:px-4 py-2 sm:py-3 rounded-md border appearance-none bg-white text-sm sm:text-base
            ${error ? 'border-error-500 focus:ring-error-500' : 'border-secondary-300 focus:ring-primary-500'} 
            focus:outline-none focus:ring-2 focus:border-transparent
            ${leftIcon ? 'pl-9 sm:pl-10' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-error-500">{error}</p>
      )}
    </div>
  );
};