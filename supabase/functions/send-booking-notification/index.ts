import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const adminEmail = 'nynrentals@gmail.com'
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get booking data from request
    const { bookingId } = await req.json()
    
    if (!bookingId) {
      throw new Error('Booking ID is required')
    }
    
    // Fetch booking details with car info and locations
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        car:cars(*),
        pickup_location:locations!pickup_location_id(label),
        return_location:locations!return_location_id(label),
        booking_extras(
          quantity,
          total_price,
          extras(name, price)
        )
      `)
      .eq('id', bookingId)
      .single()
    
    if (bookingError || !booking) {
      throw new Error('Booking not found')
    }
    
    // Only send email for confirmed bookings
    if (booking.status !== 'confirmed') {
      return new Response(
        JSON.stringify({ message: 'Email only sent for confirmed bookings' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Extract names from customer_name if first_name/last_name don't exist
    const firstName = booking.first_name || booking.customer_name?.split(' ')[0] || '';
    const lastName = booking.last_name || booking.customer_name?.split(' ').slice(1).join(' ') || '';
    const customerEmail = booking.email || booking.customer_email || 'N/A';

    // Customer display name (show 'Customer' if name not available)
    const customerName = (firstName && lastName)
      ? `${firstName} ${lastName}`
      : firstName
      ? firstName
      : 'Customer';
    
    // Get customer phone - check multiple possible fields
    const customerPhone = booking.phone || booking.customer_phone || 'N/A';
    
    // Get pickup and return times
    const pickupTime = booking.pickup_time || '10:00';
    const returnTime = booking.return_time || '10:00';
    
    // Format dates for English locale
    const startDate = new Date(booking.start_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const endDate = new Date(booking.end_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    // Calculate rental days
    const days = Math.ceil(
      (new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / 
      (1000 * 60 * 60 * 24)
    )
    
    // Get location names
    const pickupLocationName = booking.pickup_location?.label || 'Location to be confirmed';
    const returnLocationName = booking.return_location?.label || pickupLocationName;
    
    // Format extras list
    let extrasListHtml = '';
    if (booking.booking_extras && booking.booking_extras.length > 0) {
      extrasListHtml = booking.booking_extras.map(item => 
        `<li>${item.extras.name} (x${item.quantity}) - $${item.total_price.toFixed(2)}</li>`
      ).join('');
    }
    
    // Email HTML template for Admin - Simple and Clean
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .info-row { display: flex; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
            .info-row:last-child { border-bottom: none; }
            .info-label { font-weight: 600; color: #666; min-width: 150px; }
            .info-value { color: #111; flex: 1; }
            .extras-list { margin: 5px 0 0 0; padding-left: 20px; }
            .extras-list li { margin: 3px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 New Booking</h1>
            </div>
            <div class="content">
              <div class="info-row">
                <div class="info-label">Booking No:</div>
                <div class="info-value"><strong>#${booking.id.slice(0, 8).toUpperCase()}</strong></div>
              </div>

              <div class="info-row">
                <div class="info-label">Vehicle:</div>
                <div class="info-value">${booking.car.make} ${booking.car.model} ${booking.car.year}</div>
              </div>

              <div class="info-row">
                <div class="info-label">Customer Name:</div>
                <div class="info-value">${customerName}</div>
              </div>

              ${customerEmail !== 'N/A' ? `
              <div class="info-row">
                <div class="info-label">Email:</div>
                <div class="info-value">${customerEmail}</div>
              </div>
              ` : ''}

              ${customerPhone !== 'N/A' ? `
              <div class="info-row">
                <div class="info-label">Phone:</div>
                <div class="info-value">${customerPhone}</div>
              </div>
              ` : ''}

              <div class="info-row">
                <div class="info-label">Pick-up:</div>
                <div class="info-value">${startDate} - ${pickupTime}</div>
              </div>

              <div class="info-row">
                <div class="info-label">Pick-up Location:</div>
                <div class="info-value">${pickupLocationName}</div>
              </div>

              <div class="info-row">
                <div class="info-label">Return:</div>
                <div class="info-value">${endDate} - ${returnTime}</div>
              </div>

              <div class="info-row">
                <div class="info-label">Return Location:</div>
                <div class="info-value">${returnLocationName}</div>
              </div>

              <div class="info-row">
                <div class="info-label">Extras:</div>
                <div class="info-value">
                  ${booking.booking_extras && booking.booking_extras.length > 0 ? `
                    <ul class="extras-list">
                      ${booking.booking_extras.map(item =>
                        `<li>${item.extras.name} (x${item.quantity})</li>`
                      ).join('')}
                    </ul>
                  ` : 'No extras'}
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
    
    // Send email using Resend API (if configured)
    if (resendApiKey) {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'bookings@nynrentals.com', // Resend verified domain
          to: adminEmail,
          subject: `New Booking - ${customerName}`,
          html: emailHtml,
        }),
      })
      
      if (!resendResponse.ok) {
        const error = await resendResponse.text()
        console.error('Resend API error:', error)
        throw new Error('Failed to send email')
      }
      
      const result = await resendResponse.json()
      
      
      return new Response(
        JSON.stringify({ success: true, emailId: result.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // If Resend is not configured, just log (for development)
      console.log('Email would be sent to:', adminEmail)
      console.log('Booking details:', booking)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email notification logged (Resend not configured)',
          adminEmail: adminEmail,
          bookingId: booking.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
  } catch (error) {
    console.error('Error in send-booking-notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})