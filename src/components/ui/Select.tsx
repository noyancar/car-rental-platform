import React, { SelectHTMLAttributes } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <div className="w-full mb-4 relative">
      {label && (
        <label 
          htmlFor={selectId} 
          className="block text-sm font-medium text-secondary-700 mb-1"
        >
          {label}
        </label>
      )}
      
      <select
        id={selectId}
        className={`
          w-full px-4 py-3 rounded-md border appearance-none bg-white
          ${error ? 'border-error-500 focus:ring-error-500' : 'border-secondary-300 focus:ring-primary-500'} 
          focus:outline-none focus:ring-2 focus:border-transparent
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
      
      {error && (
        <p className="mt-1 text-sm text-error-500">{error}</p>
      )}
    </div>
  );
};