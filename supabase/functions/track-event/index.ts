import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

// ================================================
// CORS Configuration (Dynamic based on origin)
// ================================================
const allowedOrigins = [
  "https://www.nynrentals.com",
  "https://nynrentals.com",
  //"http://localhost:5173",
  //"http://localhost:3000",
  //"http://127.0.0.1:5173",
  //"http://127.0.0.1:3000",
];

function getCorsHeaders(origin: string | null) {
  const isAllowed = origin && allowedOrigins.includes(origin);
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
  };
}

// ================================================
// Main Handler
// ================================================
serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Initialize Supabase client with SERVICE_ROLE key (bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    let eventType, sessionId, userId, data;

    try {
      const body = await req.json();
      eventType = body.eventType;
      sessionId = body.sessionId;
      userId = body.userId || null;
      data = body.data;
    } catch (parseError) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON body" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    if (!eventType || !sessionId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Extract IP address (for geolocation)
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Extract User-Agent (for device/browser detection)
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Bot detection (simple check)
    const isBot = /bot|crawler|spider|scraper|headless/i.test(userAgent);
    if (isBot) {
      console.log("Bot detected, not tracking:", userAgent);
      return new Response(
        JSON.stringify({ success: true, message: "Bot detected, not tracked" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Parse user-agent for device info
    const deviceInfo = parseUserAgent(userAgent);

    console.log(
      `Processing event: ${eventType} for session: ${sessionId.substring(0, 8)}...`
    );

    // Get geolocation for session init (only fetch for new sessions to save API calls)
    let geoLocation = null;
    if (eventType === "init_session") {
      geoLocation = await getGeoLocation(ipAddress);
      console.log(`Geolocation for ${ipAddress}:`, geoLocation);
    }

    // Route to appropriate handler based on eventType
    let result;
    switch (eventType) {
      case "init_session":
        result = await handleSessionInit(
          supabaseAdmin,
          sessionId,
          userId,
          data,
          ipAddress,
          deviceInfo,
          geoLocation
        );
        break;
      case "page_view":
        result = await handlePageView(
          supabaseAdmin,
          sessionId,
          userId,
          data
        );
        break;
      case "page_exit":
        result = await handlePageExit(
          supabaseAdmin,
          sessionId,
          data
        );
        break;
      case "click":
        result = await handleClick(supabaseAdmin, sessionId, userId, data);
        break;
      case "funnel_stage":
        result = await handleFunnelStage(
          supabaseAdmin,
          sessionId,
          userId,
          data
        );
        break;
      case "form_interaction":
        result = await handleFormInteraction(
          supabaseAdmin,
          sessionId,
          userId,
          data
        );
        break;
      case "car_view":
        result = await handleCarView(supabaseAdmin, sessionId, userId, data);
        break;
      case "search":
        result = await handleSearch(supabaseAdmin, sessionId, userId, data);
        break;
      case "scroll_depth":
        result = await handleScrollDepth(supabaseAdmin, sessionId, data);
        break;
      case "exit_intent":
        result = await handleExitIntent(supabaseAdmin, sessionId, data);
        break;
      default:
        throw new Error(`Unknown event type: ${eventType}`);
    }

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Analytics tracking error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

// ================================================
// Helper: Get Geolocation from IP
// ================================================
interface GeoLocation {
  country: string;
  countryCode: string;
  city: string;
  region: string;
}

async function getGeoLocation(ipAddress: string): Promise<GeoLocation | null> {
  // Skip for localhost/private IPs
  if (
    ipAddress === "unknown" ||
    ipAddress === "127.0.0.1" ||
    ipAddress.startsWith("192.168.") ||
    ipAddress.startsWith("10.") ||
    ipAddress.startsWith("172.")
  ) {
    return null;
  }

  try {
    // Using ip-api.com (free, no API key required, 45 requests/minute limit)
    const response = await fetch(
      `http://ip-api.com/json/${ipAddress}?fields=status,country,countryCode,region,regionName,city`
    );

    if (!response.ok) {
      console.error("Geolocation API error:", response.status);
      return null;
    }

    const data = await response.json();

    if (data.status === "success") {
      return {
        country: data.country || "Unknown",
        countryCode: data.countryCode || "",
        city: data.city || "Unknown",
        region: data.regionName || "",
      };
    }

    return null;
  } catch (error) {
    console.error("Geolocation fetch error:", error);
    return null;
  }
}

// ================================================
// Helper: Parse User-Agent
// ================================================
function parseUserAgent(ua: string) {
  const isMobile = /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry/i.test(ua);
  const isTablet = /iPad|Tablet|PlayBook/i.test(ua);

  let deviceType = "desktop";
  if (isTablet) deviceType = "tablet";
  else if (isMobile) deviceType = "mobile";

  // Extract browser (simplified)
  let browser = "Unknown";
  let browserVersion = "";
  if (ua.includes("Edg/")) {
    browser = "Edge";
    browserVersion = ua.match(/Edg\/([0-9.]+)/)?.[1] || "";
  } else if (ua.includes("Chrome/")) {
    browser = "Chrome";
    browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || "";
  } else if (ua.includes("Safari/") && !ua.includes("Chrome")) {
    browser = "Safari";
    browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || "";
  } else if (ua.includes("Firefox/")) {
    browser = "Firefox";
    browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || "";
  }

  // Extract OS (simplified)
  let os = "Unknown";
  let osVersion = "";
  if (ua.includes("Windows NT")) {
    os = "Windows";
    osVersion = ua.match(/Windows NT ([0-9.]+)/)?.[1] || "";
  } else if (ua.includes("Mac OS X")) {
    os = "macOS";
    osVersion = ua.match(/Mac OS X ([0-9_]+)/)?.[1]?.replace(/_/g, ".") || "";
  } else if (ua.includes("Android")) {
    os = "Android";
    osVersion = ua.match(/Android ([0-9.]+)/)?.[1] || "";
  } else if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) {
    os = "iOS";
    osVersion = ua.match(/OS ([0-9_]+)/)?.[1]?.replace(/_/g, ".") || "";
  } else if (ua.includes("Linux")) {
    os = "Linux";
  }

  return { deviceType, browser, browserVersion, os, osVersion };
}

// ================================================
// Handler: Session Init
// ================================================
async function handleSessionInit(
  supabase: any,
  sessionId: string,
  userId: string | null,
  data: any,
  ipAddress: string,
  deviceInfo: any,
  geoLocation: GeoLocation | null
) {
  // Check if session exists
  const { data: existingSession } = await supabase
    .from("analytics_sessions")
    .select("id")
    .eq("session_id", sessionId)
    .single();

  if (existingSession) {
    // Update existing session
    const { error } = await supabase
      .from("analytics_sessions")
      .update({
        last_seen: new Date().toISOString(),
        user_id: userId,
      })
      .eq("session_id", sessionId);

    if (error) throw error;
    return { action: "updated", sessionId };
  } else {
    // Create new session with IP and geolocation
    const { error } = await supabase
      .from("analytics_sessions")
      .insert({
        session_id: sessionId,
        user_id: userId,
        device_type: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        browser_version: deviceInfo.browserVersion,
        os: deviceInfo.os,
        os_version: deviceInfo.osVersion,
        screen_resolution: data.screenResolution,
        language: data.language,
        timezone: data.timezone,
        // IP and Geolocation data
        ip_address: ipAddress,
        country: geoLocation?.country || data.country || "Unknown",
        country_code: geoLocation?.countryCode || "",
        city: geoLocation?.city || "",
        region: geoLocation?.region || "",
        // UTM parameters
        utm_source: data.utmSource,
        utm_medium: data.utmMedium,
        utm_campaign: data.utmCampaign,
        utm_content: data.utmContent,
        utm_term: data.utmTerm,
        referrer: data.referrer,
        landing_page: data.landingPage,
      });

    if (error) throw error;
    return { action: "created", sessionId, ipAddress, geoLocation };
  }
}

// ================================================
// Handler: Page View
// ================================================
async function handlePageView(
  supabase: any,
  sessionId: string,
  userId: string | null,
  data: any
) {
  // Insert current page view
  const { error } = await supabase.from("analytics_page_views").insert({
    session_id: sessionId,
    user_id: userId,
    page_url: data.pageUrl,
    page_title: data.pageTitle,
    page_path: data.pagePath,
    entry_page: data.entryPage,
    referrer: data.referrer,
    previous_page: data.previousPage,
  });

  if (error) throw error;

  // Update previous page's time_on_page if provided
  if (data.previousPage && data.timeOnPreviousPage) {
    await supabase
      .from("analytics_page_views")
      .update({ time_on_page: data.timeOnPreviousPage })
      .eq("session_id", sessionId)
      .eq("page_path", new URL(data.previousPage, "http://dummy").pathname)
      .is("time_on_page", null)
      .order("timestamp", { ascending: false })
      .limit(1);
  }

  return { tracked: "page_view" };
}

// ================================================
// Handler: Page Exit
// ================================================
async function handlePageExit(
  supabase: any,
  sessionId: string,
  data: any
) {
  // Update the most recent page view's time_on_page
  if (data.pageUrl && data.timeOnPage) {
    await supabase
      .from("analytics_page_views")
      .update({ time_on_page: data.timeOnPage })
      .eq("session_id", sessionId)
      .eq("page_path", data.pagePath)
      .is("time_on_page", null)
      .order("timestamp", { ascending: false })
      .limit(1);
  }

  return { tracked: "page_exit" };
}

// ================================================
// Handler: Click Event
// ================================================
async function handleClick(
  supabase: any,
  sessionId: string,
  userId: string | null,
  data: any
) {
  const { error } = await supabase.from("analytics_click_events").insert({
    session_id: sessionId,
    user_id: userId,
    event_type: data.eventType,
    event_category: data.eventCategory,
    event_label: data.eventLabel,
    element_id: data.elementId,
    element_class: data.elementClass,
    element_text: data.elementText,
    element_href: data.elementHref,
    page_url: data.pageUrl,
    page_path: data.pagePath,
    click_x: data.clickX,
    click_y: data.clickY,
    viewport_width: data.viewportWidth,
    viewport_height: data.viewportHeight,
  });

  if (error) throw error;
  return { tracked: "click" };
}

// ================================================
// Handler: Funnel Stage
// ================================================
async function handleFunnelStage(
  supabase: any,
  sessionId: string,
  userId: string | null,
  data: any
) {
  if (data.action === "enter") {
    // Track funnel stage entry
    const { error } = await supabase.from("analytics_funnel_events").insert({
      session_id: sessionId,
      user_id: userId,
      funnel_stage: data.stage,
      funnel_step: data.step,
      car_id: data.carId,
      metadata: data.metadata,
    });

    if (error) throw error;
    return { tracked: "funnel_enter", stage: data.stage };
  } else if (data.action === "complete") {
    // Mark most recent funnel stage as completed
    const { data: recentEvent, error: fetchError } = await supabase
      .from("analytics_funnel_events")
      .select("id, entered_at")
      .eq("session_id", sessionId)
      .eq("funnel_stage", data.stage)
      .order("entered_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      console.error("Error fetching recent funnel event:", fetchError);
      return { tracked: "funnel_complete", found: false };
    }

    if (recentEvent) {
      const timeSpent = Math.floor(
        (new Date().getTime() - new Date(recentEvent.entered_at).getTime()) /
          1000
      );

      const { error: updateError } = await supabase
        .from("analytics_funnel_events")
        .update({
          exited_at: new Date().toISOString(),
          time_spent: timeSpent,
          completed: true,
        })
        .eq("id", recentEvent.id);

      if (updateError) throw updateError;
      return { tracked: "funnel_complete", stage: data.stage, timeSpent };
    }

    return { tracked: "funnel_complete", found: false };
  }
}

// ================================================
// Handler: Form Interaction
// ================================================
async function handleFormInteraction(
  supabase: any,
  sessionId: string,
  userId: string | null,
  data: any
) {
  const { error } = await supabase.from("analytics_form_interactions").insert({
    session_id: sessionId,
    user_id: userId,
    form_name: data.formName,
    field_name: data.fieldName,
    interaction_type: data.interactionType,
    field_value: data.fieldValue,
    error_message: data.errorMessage,
    page_url: data.pageUrl,
    page_path: data.pagePath,
  });

  if (error) throw error;
  return { tracked: "form_interaction" };
}

// ================================================
// Handler: Car View
// ================================================
async function handleCarView(
  supabase: any,
  sessionId: string,
  userId: string | null,
  data: any
) {
  if (data.action === "start") {
    // Track car view start
    const { error } = await supabase.from("analytics_car_views").insert({
      session_id: sessionId,
      user_id: userId,
      car_id: data.carId,
      from_search: data.fromSearch,
      from_direct_link: data.fromDirectLink,
      search_filters: data.searchFilters,
    });

    if (error) throw error;
    return { tracked: "car_view_start" };
  } else if (data.action === "end") {
    // Update most recent car view with duration
    const { data: recentView, error: fetchError } = await supabase
      .from("analytics_car_views")
      .select("id, timestamp")
      .eq("session_id", sessionId)
      .eq("car_id", data.carId)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      console.error("Error fetching recent car view:", fetchError);
      return { tracked: "car_view_end", found: false };
    }

    if (recentView) {
      const viewDuration = Math.floor(
        (new Date().getTime() - new Date(recentView.timestamp).getTime()) /
          1000
      );

      const { error: updateError } = await supabase
        .from("analytics_car_views")
        .update({
          view_duration: viewDuration,
          clicked_book_button: data.clickedBookButton,
        })
        .eq("id", recentView.id);

      if (updateError) throw updateError;
      return { tracked: "car_view_end", viewDuration };
    }

    return { tracked: "car_view_end", found: false };
  }
}

// ================================================
// Handler: Search
// ================================================
async function handleSearch(
  supabase: any,
  sessionId: string,
  userId: string | null,
  data: any
) {
  const { error } = await supabase.from("analytics_searches").insert({
    session_id: sessionId,
    user_id: userId,
    search_type: data.searchType,
    start_date: data.startDate,
    end_date: data.endDate,
    pickup_location: data.pickupLocation,
    return_location: data.returnLocation,
    category: data.category,
    price_min: data.priceMin,
    price_max: data.priceMax,
    features: data.features,
    results_count: data.resultsCount,
  });

  if (error) throw error;
  return { tracked: "search" };
}

// ================================================
// Handler: Scroll Depth
// ================================================
async function handleScrollDepth(
  supabase: any,
  sessionId: string,
  data: any
) {
  const { error } = await supabase.from("analytics_scroll_depth").upsert(
    {
      session_id: sessionId,
      page_url: data.pageUrl,
      page_path: data.pagePath,
      max_scroll_percentage: data.percentage,
      reached_25: data.percentage >= 25,
      reached_50: data.percentage >= 50,
      reached_75: data.percentage >= 75,
      reached_100: data.percentage >= 100,
    },
    { onConflict: "session_id,page_path" }
  );

  if (error) throw error;
  return { tracked: "scroll_depth", percentage: data.percentage };
}

// ================================================
// Handler: Exit Intent
// ================================================
async function handleExitIntent(supabase: any, sessionId: string, data: any) {
  const { error } = await supabase.from("analytics_exit_intent").insert({
    session_id: sessionId,
    page_url: data.pageUrl,
    page_path: data.pagePath,
    exit_type: data.exitType,
    time_on_page_before_exit: data.timeOnPage,
  });

  if (error) throw error;
  return { tracked: "exit_intent", exitType: data.exitType };
}
