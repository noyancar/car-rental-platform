import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  const location = useLocation();
  
  // Generate breadcrumb items from current path if not provided
  const breadcrumbItems = items || generateBreadcrumbItems(location.pathname);
  
  if (breadcrumbItems.length === 0) return null;
  
  return (
    <nav aria-label="Breadcrumb" className={`text-sm ${className}`}>
      <ol className="flex items-center space-x-2">
        {/* Home link */}
        <li>
          <Link 
            to="/" 
            className="text-secondary-600 hover:text-primary-700 transition-colors flex items-center"
            aria-label="Home"
          >
            <Home size={16} />
          </Link>
        </li>
        
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          return (
            <React.Fragment key={item.path}>
              <li>
                <ChevronRight size={16} className="text-secondary-400" />
              </li>
              <li>
                {isLast ? (
                  <span className="text-secondary-800 font-medium" aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <Link 
                    to={item.path} 
                    className="text-secondary-600 hover:text-primary-700 transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

// Helper function to generate breadcrumb items from path
function generateBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];
  
  // Path to label mapping
  const labelMap: Record<string, string> = {
    cars: 'Cars',
    bookings: 'Bookings',
    booking: 'Book Car',
    profile: 'Profile',
    admin: 'Admin',
    payment: 'Payment',
    'how-it-works': 'How It Works',
    deals: 'Deals',
    'discount-codes': 'Discount Codes',
    campaigns: 'Campaigns',
    extras: 'Extra Services'
  };
  
  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Skip ID segments (numeric)
    if (!isNaN(Number(segment))) {
      return;
    }
    
    const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    
    items.push({
      label,
      path: currentPath
    });
  });
  
  return items;
} 