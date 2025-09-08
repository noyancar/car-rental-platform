import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

// Helper function to ensure storage buckets exist
export const ensureStorageBucket = async (bucketName: string, isPublic = true) => {
  try {
    // Sadece bucket'ın varlığını kontrol et, oluşturmaya ÇALIŞMA
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      // Bucket yok, sessizce devam et
    } else {
      // Bucket mevcut, devam et
    }
  } catch (error) {
    console.error('Bucket kontrolü sırasında hata:', error);
  }
};

// Helper function to safely handle auth session
export const safelySignOut = async () => {
  try {
    // Önce local kapsamda çıkış yapmayı dene
    const { error: localError } = await supabase.auth.signOut({ scope: 'local' });
    
    if (!localError) {
      return { success: true };
    }
    
    // Local kapsamda hata varsa, global kapsamda çıkış yapmayı dene
    const { error: globalError } = await supabase.auth.signOut();
    
    if (globalError) {
      // Her iki yöntem de başarısız olursa, sadece token'ları temizle
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
    }
    
    return { success: true, error: localError || globalError };
  } catch (error) {
    console.error('Safe sign out error:', error);
    return { success: false, error };
  }
};