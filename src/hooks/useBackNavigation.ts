import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

interface BackNavigationOptions {
  fallbackPath?: string;
  onBack?: () => void;
}

export const useBackNavigation = (options?: BackNavigationOptions) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const goBack = useCallback(() => {
    // Call custom onBack handler if provided
    if (options?.onBack) {
      options.onBack();
      return;
    }
    
    // Check if we have history to go back to
    if (window.history.length > 1) {
      navigate(-1);
    } else if (options?.fallbackPath) {
      // Use fallback path if no history
      navigate(options.fallbackPath);
    } else {
      // Default fallback based on current path
      const pathSegments = location.pathname.split('/').filter(Boolean);
      
      if (pathSegments.length > 1) {
        // Go up one level in the path hierarchy
        const parentPath = '/' + pathSegments.slice(0, -1).join('/');
        navigate(parentPath);
      } else {
        // Go to home if at root level
        navigate('/');
      }
    }
  }, [navigate, location.pathname, options]);
  
  return { goBack };
}; 