import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const qrCode = pathParts[pathParts.length - 1]; // Get the last part of the path

    if (!qrCode) {
      return new Response('QR code not found', { status: 400 });
    }

    // Get IP and User Agent
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log the scan
    const { error } = await supabase
      .from('qr_scans')
      .insert({
        qr_code: qrCode,
        ip_address: ip,
        user_agent: userAgent,
      });

    if (error) {
      console.error('Error logging QR scan:', error);
      // Continue with redirect even if logging fails
    }

    // Redirect to home page
    return new Response(null, {
      status: 302,
      headers: {
        'Location': 'https://www.nynrentals.com/',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
