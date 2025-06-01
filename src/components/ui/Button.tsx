import React, { ButtonHTMLAttributes, memo } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = memo(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  // Base classes with fixed heights
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 relative';
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-primary-800 text-white hover:bg-primary-700 focus:ring-primary-500 disabled:bg-primary-800/70',
    secondary: 'bg-secondary-100 text-primary-800 hover:bg-secondary-200 focus:ring-secondary-300 disabled:bg-secondary-100/70',
    accent: 'bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-400 disabled:bg-accent-500/70',
    outline: 'border-2 border-primary-800 text-primary-800 hover:bg-primary-50 focus:ring-primary-500 disabled:border-primary-800/70 disabled:text-primary-800/70',
    ghost: 'text-primary-800 hover:bg-secondary-100 focus:ring-primary-500 disabled:text-primary-800/70',
  };
  
  // Fixed size classes to prevent layout shifts
  const sizeClasses = {
    sm: 'h-9 px-3 text-sm min-w-[90px]',
    md: 'h-11 px-6 min-w-[110px]',
    lg: 'h-12 px-8 text-lg min-w-[130px]',
  };
  
  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';
  
  // Disabled and loading classes
  const stateClasses = (disabled || isLoading) ? 'cursor-not-allowed' : '';

  // Loading spinner with fixed dimensions
  const LoadingSpinner = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-md">
      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
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
      <span className={`inline-flex items-center justify-center gap-2 ${isLoading ? 'invisible' : 'visible'}`}>
        {leftIcon}
        <span>{children}</span>
        {rightIcon}
      </span>
      {isLoading && <LoadingSpinner />}
    </button>
  );
});

Button.displayName = 'Button';

export { Button };