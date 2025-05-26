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
    <div className="w-full mb-4">
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
      
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg className="w-5 h-5 text-secondary-500" fill="currentColor" viewBox="0 0 20 20">
          <path 
            fillRule="evenodd" 
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
            clipRule="evenodd"
          />
        </svg>
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-error-500">{error}</p>
      )}
    </div>
  );
};