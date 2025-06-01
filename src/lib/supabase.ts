import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = 'https://lwhqqhlvmtbcugzasamf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3aHFxaGx2bXRiY3VnemFzYW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4ODk5NDcsImV4cCI6MjAyMjQ2NTk0N30.XB-PWiM1gWGPk5MlMxhNOqgDzGlo_lA5XNXMhLWkRDI';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'car-rental',
    },
  },
});