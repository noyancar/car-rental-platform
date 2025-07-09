import React, { InputHTMLAttributes, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-sm sm:text-base font-medium text-secondary-700 mb-1.5"
        >
          {label}
          {hint && <span className="text-xs sm:text-sm text-gray-500 ml-1">({hint})</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-500">
            {leftIcon}
          </div>
        )}
        
        <input
          id={inputId}
          className={`
            w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-md border text-sm sm:text-base min-h-[40px] sm:min-h-0
            ${error ? 'border-error-500 focus:ring-error-500' : 'border-secondary-300 focus:ring-primary-500'} 
            focus:outline-none focus:ring-2 focus:border-transparent
            ${leftIcon ? 'pl-9 sm:pl-10' : ''}
            ${rightIcon ? 'pr-9 sm:pr-10' : ''}
            ${className}
          `}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-secondary-500">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-xs sm:text-sm text-error-500">{error}</p>
      )}
    </div>
  );
};