import React, { useEffect, useState } from 'react';
import { testConnection } from '../lib/supabase';

export const TestConnection: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const checkConnection = async () => {
      const result = await testConnection();
      if (result.success) {
        setStatus('success');
        setData(result.data);
      } else {
        setStatus('error');
        setError(result.error?.message || 'Failed to connect to database');
      }
    };

    checkConnection();
  }, []);

  if (status === 'loading') {
    return <div>Testing database connection...</div>;
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