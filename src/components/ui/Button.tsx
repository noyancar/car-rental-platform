import React, { ButtonHTMLAttributes, memo } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = memo<ButtonProps>(({ 
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  // Base classes
  const baseClasses = 'btn inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-lg hover:shadow-xl',
    secondary: 'bg-volcanic-800 text-white hover:bg-volcanic-900 focus:ring-volcanic-500',
    accent: 'bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-400 shadow-lg hover:shadow-xl',
    outline: 'border-2 border-primary-800 text-primary-800 hover:bg-primary-50 focus:ring-primary-500 disabled:border-primary-800/70 disabled:text-primary-800/70',
    ghost: 'text-volcanic-700 hover:bg-sandy-200 focus:ring-sandy-400',
  };
  
  // Size classes with better mobile touch targets
  const sizeClasses = {
    sm: 'text-sm px-3 py-2 sm:px-3 sm:py-1.5 min-h-[36px] sm:min-h-0',
    md: 'text-sm sm:text-base px-4 py-2.5 sm:px-4 sm:py-2 min-h-[40px] sm:min-h-0',
    lg: 'text-base sm:text-lg px-5 py-3 sm:px-6 sm:py-3 min-h-[44px] sm:min-h-0',
  };
  
  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';
  
  // Loading state classes
  const stateClasses = isLoading ? 'cursor-wait' : '';
  
  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClasses}
        ${stateClasses}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading...
        </>
      ) : (
        <>
          {leftIcon && <span className="mr-2 inline-flex">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2 inline-flex">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';