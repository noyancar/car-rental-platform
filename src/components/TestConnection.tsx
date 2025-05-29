import React, { useEffect, useState } from 'react';
import { testConnection } from '../lib/supabase';

export const TestConnection: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const checkConnection = async () => {
      try {
        const result = await testConnection();
        if (!mounted) return;
        
        if (result.success) {
          setStatus('success');
          setData(result.data);
        } else {
          setStatus('error');
          setError(result.error?.message || 'Failed to connect to database');
        }
      } catch (err) {
        if (!mounted) return;
        setStatus('error');
        setError((err as Error).message);
      }
    };

    checkConnection();
    return () => { mounted = false; };
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-4 bg-secondary-50 rounded-md">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-800 mr-3"></div>
        <span>Testing database connection...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="bg-error-50 text-error-500 p-4 rounded-md">
        Database connection error: {error}
      </div>
    );
  }

  return (
    <div className="bg-success-50 text-success-500 p-4 rounded-md">
      Database connected successfully!
      {data && (
        <pre className="mt-4 bg-white p-4 rounded-md overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
};