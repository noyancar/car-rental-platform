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
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@yourcarrental.com'
    
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
    const firstName = booking.first_name || booking.customer_name?.split(' ')[0] || 'Customer';
    const lastName = booking.last_name || booking.customer_name?.split(' ').slice(1).join(' ') || '';
    const customerEmail = booking.email || booking.customer_email || 'N/A';
    
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
    
    // Email HTML template for Admin (English)
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .label { font-weight: bold; color: #6b7280; }
            .value { color: #111827; }
            .total { font-size: 24px; font-weight: bold; color: #059669; }
            .button { display: inline-block; background: #1e40af; color: #ffffff !important; padding: 12px 30px; text-decoration: none !important; border-radius: 6px; margin-top: 20px; font-weight: 600; }
            .button:hover { background: #1e3a8a; color: #ffffff !important; text-decoration: none !important; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
            .extras-list { margin: 0; padding-left: 20px; }
            .extras-list li { margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 New Booking Confirmed!</h1>
            </div>
            <div class="content">
              <p>A new car rental booking has been confirmed and payment received.</p>
              
              <div class="booking-details">
                <h2>Booking Details</h2>
                <div class="detail-row">
                  <span class="label">Booking ID:</span>
                  <span class="value">#${booking.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Customer:</span>
                  <span class="value">${firstName} ${lastName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Email:</span>
                  <span class="value">${customerEmail}</span>
                </div>
                ${customerPhone !== 'N/A' ? `
                <div class="detail-row">
                  <span class="label">Phone:</span>
                  <span class="value">${customerPhone}</span>
                </div>
                ` : ''}
              </div>
              
              <div class="booking-details">
                <h2>Car Information</h2>
                <div class="detail-row">
                  <span class="label">Vehicle:</span>
                  <span class="value">${booking.car.make} ${booking.car.model} ${booking.car.year}</span>
                </div>
                <div class="detail-row">
                  <span class="label">License Plate:</span>
                  <span class="value">${booking.car.license_plate || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Category:</span>
                  <span class="value">${booking.car.category.charAt(0).toUpperCase() + booking.car.category.slice(1)}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Transmission:</span>
                  <span class="value">${booking.car.transmission || 'Automatic'}</span>
                </div>
              </div>
              
              <div class="booking-details">
                <h2>Rental Period</h2>
                <div class="detail-row">
                  <span class="label">Pick-up:</span>
                  <span class="value">${startDate} at ${pickupTime}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Return:</span>
                  <span class="value">${endDate} at ${returnTime}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Duration:</span>
                  <span class="value">${days} ${days === 1 ? 'day' : 'days'}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Pick-up Location:</span>
                  <span class="value">${pickupLocationName}</span>
                </div>
                ${returnLocationName !== pickupLocationName ? `
                <div class="detail-row">
                  <span class="label">Return Location:</span>
                  <span class="value">${returnLocationName}</span>
                </div>
                ` : ''}
              </div>
              
              <div class="booking-details">
                <h2>Payment Information</h2>
                <div class="detail-row">
                  <span class="label">Car Rental:</span>
                  <span class="value">$${(booking.base_price || booking.car_rental_subtotal || booking.total_price)?.toFixed(2)}</span>
                </div>
                ${booking.extras_total && booking.extras_total > 0 ? `
                <div class="detail-row">
                  <span class="label">Extras:</span>
                  <span class="value">$${booking.extras_total.toFixed(2)}</span>
                </div>
                ${extrasListHtml ? `
                <div class="detail-row">
                  <span class="label"></span>
                  <span class="value">
                    <ul class="extras-list">
                      ${extrasListHtml}
                    </ul>
                  </span>
                </div>
                ` : ''}
                ` : ''}
                ${booking.pickup_delivery_fee && booking.pickup_delivery_fee > 0 ? `
                <div class="detail-row">
                  <span class="label">Pick-up Delivery Fee:</span>
                  <span class="value">$${booking.pickup_delivery_fee.toFixed(2)}</span>
                </div>
                ` : ''}
                ${booking.return_delivery_fee && booking.return_delivery_fee > 0 ? `
                <div class="detail-row">
                  <span class="label">Return Delivery Fee:</span>
                  <span class="value">$${booking.return_delivery_fee.toFixed(2)}</span>
                </div>
                ` : ''}
                ${booking.discount_amount && booking.discount_amount > 0 ? `
                <div class="detail-row">
                  <span class="label">Discount:</span>
                  <span class="value">-$${booking.discount_amount.toFixed(2)}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                  <span class="label">Total Paid:</span>
                  <span class="value total">$${(booking.grand_total || booking.total_price).toFixed(2)}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Payment Method:</span>
                  <span class="value">Stripe (${booking.stripe_payment_status || 'Paid'})</span>
                </div>
              </div>
              
              <center>
                <a href="${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/admin/bookings" class="button">
                  View in Admin Panel
                </a>
              </center>
              
              <div class="footer">
                <p>This is an automated notification from your car rental system.</p>
                <p>Booking created at: ${new Date(booking.created_at).toLocaleString('en-US')}</p>
                <p>© 2025 Car Rental Company</p>
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
          from: 'onboarding@resend.dev', // Resend test email
          to: adminEmail,
          subject: `New Booking - ${firstName} ${lastName}`,
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