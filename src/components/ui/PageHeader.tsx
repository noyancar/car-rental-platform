import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useBackNavigation } from '../../hooks/useBackNavigation';
import { Breadcrumb } from './Breadcrumb';
import { Button } from './Button';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backButtonLabel?: string;
  fallbackPath?: string;
  onBack?: () => void;
  showBreadcrumb?: boolean;
  breadcrumbItems?: Array<{ label: string; path: string }>;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBackButton = true,
  backButtonLabel = 'Back',
  fallbackPath,
  onBack,
  showBreadcrumb = true,
  breadcrumbItems,
  actions,
  className = ''
}) => {
  const { goBack } = useBackNavigation({ fallbackPath, onBack });
  
  return (
    <div className={`mb-6 ${className}`}>
      {/* Breadcrumb */}
      {showBreadcrumb && (
        <div className="mb-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      )}
      
      {/* Header Content */}
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          {/* Back Button */}
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              leftIcon={<ArrowLeft size={20} />}
              className="mr-4 -ml-2"
            >
              {backButtonLabel}
            </Button>
          )}
          
          {/* Title and Subtitle */}
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-secondary-900">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-secondary-600">{subtitle}</p>
            )}
          </div>
        </div>
        
        {/* Actions */}
        {actions && (
          <div className="flex items-center space-x-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}; 