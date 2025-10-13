import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface QRStat {
  qr_code: string;
  scan_count: number;
  last_scan: string;
}

export default function QRStatsPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState<QRStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const CORRECT_PASSWORD = import.meta.env.VITE_QR_STATS_PASSWORD;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
      fetchStats();
    } else {
      setError('Wrong password');
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Get all scans
      const { data, error } = await supabase
        .from('qr_scans')
        .select('qr_code, scanned_at')
        .order('scanned_at', { ascending: false });

      if (error) throw error;

      // Group by qr_code and count
      const grouped = data.reduce((acc: any, scan: any) => {
        if (!acc[scan.qr_code]) {
          acc[scan.qr_code] = {
            qr_code: scan.qr_code,
            scan_count: 0,
            last_scan: scan.scanned_at,
          };
        }
        acc[scan.qr_code].scan_count++;
        return acc;
      }, {});

      const statsArray = Object.values(grouped) as QRStat[];
      setStats(statsArray);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px',
        }}>
          <h1 style={{ marginBottom: '20px', fontSize: '24px', textAlign: 'center' }}>
            QR Stats
          </h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />
            {error && (
              <p style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1000px',
      margin: '0 auto',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
      }}>
        <h1 style={{ fontSize: '28px' }}>QR Code Statistics</h1>
        <button
          onClick={fetchStats}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <p style={{ color: 'red', marginBottom: '20px' }}>{error}</p>
      )}

      {stats.length === 0 && !loading ? (
        <p style={{ textAlign: 'center', color: '#666', fontSize: '18px' }}>
          No scans yet
        </p>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                  QR Code
                </th>
                <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>
                  Total Scans
                </th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                  Last Scan
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.map((stat) => (
                <tr key={stat.qr_code} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>
                    {stat.qr_code}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center', fontSize: '20px', color: '#007bff' }}>
                    {stat.scan_count}
                  </td>
                  <td style={{ padding: '15px', color: '#666' }}>
                    {formatDate(stat.last_scan)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
