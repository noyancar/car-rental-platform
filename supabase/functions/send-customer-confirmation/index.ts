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
        return_location:locations!return_location_id(label)
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
    
    // Check if customer email exists (try both email and customer_email columns)
    const customerEmail = booking.email || booking.customer_email;
    if (!customerEmail) {
      return new Response(
        JSON.stringify({ message: 'No customer email found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Extract names from customer_name if first_name/last_name don't exist
    const firstName = booking.first_name || booking.customer_name?.split(' ')[0] || 'Valued Customer';
    const lastName = booking.last_name || booking.customer_name?.split(' ').slice(1).join(' ') || '';
    
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
    const returnLocationName = booking.return_location?.label || pickupLocationName; // Default to pickup if not specified
    
    // Customer confirmation email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
            .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
            .booking-ref { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0; }
            .booking-ref-number { font-size: 32px; font-weight: bold; letter-spacing: 2px; }
            .booking-ref-label { font-size: 14px; opacity: 0.9; margin-top: 5px; }
            .section { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .section-title { color: #374151; font-size: 18px; font-weight: 600; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
            .detail-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            table { width: 100%; border-collapse: collapse; }
            td.label { width: 40%; font-weight: 500; color: #6b7280; }
            td.value { text-align: right; color: #111827; font-weight: 500; }
            .detail-row:last-child { border-bottom: none; }
            .label { font-weight: 500; color: #6b7280; }
            .value { color: #111827; font-weight: 500; }
            .highlight { color: #667eea; font-weight: 600; }
            .total { font-size: 24px; font-weight: bold; color: #059669; }
            .checklist { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 25px 0; }
            .checklist h3 { margin: 0 0 15px 0; color: #92400e; }
            .checklist ul { margin: 10px 0; padding-left: 20px; }
            .checklist li { margin: 8px 0; color: #78350f; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; padding: 14px 30px; text-decoration: none !important; border-radius: 8px; margin: 20px 0; font-weight: 600; }
            .button:hover { background: linear-gradient(135deg, #5a67d8 0%, #6b4299 100%); color: #ffffff !important; text-decoration: none !important; }
            .footer { text-align: center; color: #6b7280; font-size: 13px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            .footer a { color: #667eea; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 Booking Confirmed!</h1>
            </div>
            <div class="content">
              <div class="greeting">
                Dear ${firstName},
              </div>
              
              <p>Thank you for choosing our premium car rental service! Your booking has been successfully confirmed and payment has been processed.</p>
              
              <div class="booking-ref">
                <div class="booking-ref-number">#${booking.id.slice(0, 8).toUpperCase()}</div>
                <div class="booking-ref-label">YOUR BOOKING REFERENCE</div>
              </div>
              
              <div class="section">
                <div class="section-title">🚙 Vehicle Information</div>
                <div class="detail-row">
                  <span class="label">Vehicle:</span>
                  <span class="value highlight">${booking.car.make} ${booking.car.model} ${booking.car.year}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Category:</span>
                  <span class="value">${booking.car.category.charAt(0).toUpperCase() + booking.car.category.slice(1)}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Transmission:</span>
                  <span class="value">${booking.car.transmission || 'Automatic'}</span>
                </div>
                ${booking.car.license_plate ? `
                <div class="detail-row">
                  <span class="label">License Plate:</span>
                  <span class="value">${booking.car.license_plate}</span>
                </div>
                ` : ''}
              </div>
              
              <div class="section">
                <div class="section-title">📅 Rental Period</div>
                <div class="detail-row">
                  <span class="label">Pick-up Date & Time:</span>
                  <span class="value highlight">${startDate} at ${pickupTime}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Return Date & Time:</span>
                  <span class="value highlight">${endDate} at ${returnTime}</span>
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
                ` : `
                <div class="detail-row">
                  <span class="label">Return Location:</span>
                  <span class="value">Same as pick-up location</span>
                </div>
                `}
              </div>
              
              <div class="section">
                <div class="section-title">💳 Payment Summary</div>
                <table style="width: 100%;">
                  <tr class="detail-row">
                    <td class="label">Car Rental:</td>
                    <td class="value">$${(booking.base_price || booking.total_price).toFixed(2)}</td>
                  </tr>
                ${booking.extras_total && booking.extras_total > 0 ? `
                  <tr class="detail-row">
                    <td class="label">Additional Services:</td>
                    <td class="value">$${booking.extras_total.toFixed(2)}</td>
                  </tr>
                ` : ''}
                ${booking.pickup_delivery_fee && booking.pickup_delivery_fee > 0 ? `
                  <tr class="detail-row">
                    <td class="label">Pick-up Delivery Fee:</td>
                    <td class="value">$${booking.pickup_delivery_fee.toFixed(2)}</td>
                  </tr>
                ` : ''}
                ${booking.return_delivery_fee && booking.return_delivery_fee > 0 ? `
                <div class="detail-row">
                  <span class="label">Return Delivery Fee:</span>
                  <span class="value">$${booking.return_delivery_fee.toFixed(2)}</span>
                </div>
                ` : ''}
                ${booking.discount_amount && booking.discount_amount > 0 ? `
                <div class="detail-row">
                  <span class="label">Discount Applied:</span>
                  <span class="value" style="color: #059669;">-$${booking.discount_amount.toFixed(2)}</span>
                </div>
                ` : ''}
                  <tr class="detail-row" style="border-top: 2px solid #374151;">
                    <td class="label" style="font-size: 18px; padding-top: 10px;">Total Paid:</td>
                    <td class="value total" style="padding-top: 10px;">$${(booking.grand_total || booking.total_price).toFixed(2)}</td>
                  </tr>
                  <tr class="detail-row">
                    <td class="label">Payment Status:</td>
                    <td class="value" style="color: #059669;">✅ Successfully Paid</td>
                  </tr>
                </table>
              </div>
              
              <div class="checklist">
                <h3>📋 Important: What to Bring at Pick-up</h3>
                <ul>
                  <li><strong>Valid driver's license</strong> (must be valid for entire rental period)</li>
                  <li><strong>Credit card</strong> for security deposit (in main driver's name)</li>
                  <li><strong>Booking reference:</strong> #${booking.id.slice(0, 8).toUpperCase()}</li>
                  <li><strong>Passport or government-issued ID</strong></li>
                  ${booking.additional_driver ? '<li><strong>Additional driver\'s license</strong> (if applicable)</li>' : ''}
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/bookings/${booking.id}" class="button">
                  View Booking Details
                </a>
              </div>
              
              <div class="section">
                <div class="section-title">ℹ️ Additional Information</div>
                <p style="margin: 10px 0;">
                  <strong>Office Hours:</strong> Our office is open from 8:00 AM to 8:00 PM daily.
                </p>
                <p style="margin: 10px 0;">
                  <strong>Fuel Policy:</strong> The vehicle will be provided with a full tank. Please return it with a full tank to avoid refueling charges.
                </p>
                <p style="margin: 10px 0;">
                  <strong>Mileage:</strong> ${booking.car.mileage_type || '200 miles/day included'}.
                </p>
                <p style="margin: 10px 0;">
                  <strong>Insurance:</strong> Basic insurance is included. Additional coverage options available at pick-up.
                </p>
              </div>
              
              <div class="footer">
                <p><strong>Need to modify or cancel your booking?</strong></p>
                <p>Please contact us at least 24 hours before your pick-up time.</p>
                <p style="margin-top: 20px;">
                  <a href="mailto:support@carrentalcompany.com">support@carrentalcompany.com</a> | 
                  <a href="tel:+1234567890">+1 (234) 567-890</a>
                </p>
                <p style="margin-top: 30px; font-size: 11px; color: #9ca3af;">
                  This is an automated confirmation email. Please do not reply directly to this message.<br>
                  © 2025 Car Rental Company. All rights reserved.
                </p>
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
          to: customerEmail,
          subject: `Booking Confirmation - #${booking.id.slice(0, 8).toUpperCase()}`,
          html: emailHtml,
        }),
      })
      
      if (!resendResponse.ok) {
        const error = await resendResponse.text()
        console.error('Resend API error:', error)
        throw new Error('Failed to send confirmation email')
      }
      
      const result = await resendResponse.json()
      
      console.log('Confirmation email sent to customer:', customerEmail)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          emailId: result.id,
          recipient: customerEmail 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // If Resend is not configured, just log (for development)
      console.log('Confirmation email would be sent to:', customerEmail)
      console.log('Booking reference:', booking.id.slice(0, 8).toUpperCase())
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email notification logged (Resend not configured)',
          recipient: customerEmail,
          bookingRef: booking.id.slice(0, 8).toUpperCase()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
  } catch (error) {
    console.error('Error in send-customer-confirmation:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})