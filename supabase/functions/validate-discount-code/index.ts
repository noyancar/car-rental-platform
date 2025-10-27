import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscountCode {
  id: string;
  code: string;
  discount_percentage: number;
  valid_from: string;
  valid_to: string;
  active: boolean;
  max_uses: number;
  current_uses: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Get code from query params
    const url = new URL(req.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return new Response(
        JSON.stringify({
          valid: false,
          message: 'Discount code is required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Query discount code (case-insensitive)
    const { data: discountCode, error } = await supabaseClient
      .from('discount_codes')
      .select('*')
      .ilike('code', code)
      .single();

    if (error || !discountCode) {
      return new Response(
        JSON.stringify({
          valid: false,
          message: 'Invalid discount code'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const discount = discountCode as DiscountCode;

    // Check if active
    if (!discount.active) {
      return new Response(
        JSON.stringify({
          valid: false,
          message: 'This discount code is no longer active'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check date validity
    const now = new Date();
    const validFrom = new Date(discount.valid_from);
    const validTo = new Date(discount.valid_to);

    // Set time to start/end of day for proper comparison
    validFrom.setHours(0, 0, 0, 0);
    validTo.setHours(23, 59, 59, 999);

    if (now < validFrom) {
      return new Response(
        JSON.stringify({
          valid: false,
          message: 'This discount code is not yet valid'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (now > validTo) {
      return new Response(
        JSON.stringify({
          valid: false,
          message: 'This discount code has expired'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check usage limit (optional - for future extensibility)
    if (discount.max_uses && discount.current_uses >= discount.max_uses) {
      return new Response(
        JSON.stringify({
          valid: false,
          message: 'This discount code has reached its usage limit'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Valid discount code
    return new Response(
      JSON.stringify({
        valid: true,
        message: 'Discount code applied successfully',
        data: {
          id: discount.id,
          code: discount.code,
          discount_percentage: discount.discount_percentage
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error validating discount code:', error);
    return new Response(
      JSON.stringify({
        valid: false,
        message: 'An error occurred while validating the discount code'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
