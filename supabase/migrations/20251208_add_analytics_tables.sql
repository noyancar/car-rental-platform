-- ================================================
-- Marketing Analytics Tables Migration
-- Created: 2024-12-08
-- Purpose: Server-side analytics tracking system
-- Tables: 10 analytics tables for comprehensive tracking
-- ================================================

-- ================================================
-- 1. ANALYTICS_SESSIONS
-- Purpose: Track unique visitor sessions
-- ================================================
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL, -- FingerprintJS visitor ID
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_page_views INTEGER DEFAULT 0,

  -- Device Info (parsed server-side from user-agent)
  device_type TEXT, -- mobile, desktop, tablet
  browser TEXT,
  browser_version TEXT,
  os TEXT,
  os_version TEXT,
  screen_resolution TEXT,
  language TEXT,
  timezone TEXT,

  -- Location (IP-based, parsed server-side)
  country TEXT,
  city TEXT,

  -- UTM Parameters (Marketing Source Tracking)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  -- Referrer
  referrer TEXT,
  landing_page TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics_sessions
CREATE INDEX idx_analytics_sessions_session_id ON analytics_sessions(session_id);
CREATE INDEX idx_analytics_sessions_user_id ON analytics_sessions(user_id);
CREATE INDEX idx_analytics_sessions_utm_source ON analytics_sessions(utm_source);
CREATE INDEX idx_analytics_sessions_utm_campaign ON analytics_sessions(utm_campaign);
CREATE INDEX idx_analytics_sessions_created_at ON analytics_sessions(created_at DESC);
CREATE INDEX idx_analytics_sessions_device_type ON analytics_sessions(device_type);

-- ================================================
-- 2. ANALYTICS_PAGE_VIEWS
-- Purpose: Track individual page views
-- ================================================
CREATE TABLE IF NOT EXISTS analytics_page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  page_url TEXT NOT NULL,
  page_title TEXT,
  page_path TEXT, -- extracted from URL

  entry_page BOOLEAN DEFAULT FALSE,
  exit_page BOOLEAN DEFAULT FALSE,

  time_on_page INTEGER, -- seconds

  referrer TEXT,
  previous_page TEXT,

  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics_page_views
CREATE INDEX idx_analytics_page_views_session_id ON analytics_page_views(session_id);
CREATE INDEX idx_analytics_page_views_user_id ON analytics_page_views(user_id);
CREATE INDEX idx_analytics_page_views_page_path ON analytics_page_views(page_path);
CREATE INDEX idx_analytics_page_views_timestamp ON analytics_page_views(timestamp DESC);
CREATE INDEX idx_analytics_page_views_entry_page ON analytics_page_views(entry_page) WHERE entry_page = true;
CREATE INDEX idx_analytics_page_views_exit_page ON analytics_page_views(exit_page) WHERE exit_page = true;

-- ================================================
-- 3. ANALYTICS_CLICK_EVENTS
-- Purpose: Track click events for heatmap and CTA analysis
-- ================================================
CREATE TABLE IF NOT EXISTS analytics_click_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  event_type TEXT NOT NULL, -- 'button_click', 'link_click', 'cta_click', 'nav_click'
  event_category TEXT, -- 'booking', 'navigation', 'search', 'filter'
  event_label TEXT, -- Button text or identifier

  element_id TEXT,
  element_class TEXT,
  element_text TEXT,
  element_href TEXT, -- For link clicks

  page_url TEXT NOT NULL,
  page_path TEXT,

  -- Heatmap coordinates
  click_x INTEGER,
  click_y INTEGER,
  viewport_width INTEGER,
  viewport_height INTEGER,

  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics_click_events
CREATE INDEX idx_analytics_click_events_session_id ON analytics_click_events(session_id);
CREATE INDEX idx_analytics_click_events_event_type ON analytics_click_events(event_type);
CREATE INDEX idx_analytics_click_events_event_category ON analytics_click_events(event_category);
CREATE INDEX idx_analytics_click_events_page_path ON analytics_click_events(page_path);
CREATE INDEX idx_analytics_click_events_timestamp ON analytics_click_events(timestamp DESC);

-- ================================================
-- 4. ANALYTICS_FUNNEL_EVENTS
-- Purpose: Track booking funnel progression
-- ================================================
CREATE TABLE IF NOT EXISTS analytics_funnel_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  funnel_stage TEXT NOT NULL, -- 'homepage', 'listing', 'car_details', 'checkout', 'payment', 'confirmation'
  funnel_step INTEGER, -- 1, 2, 3, 4, 5, 6

  car_id UUID REFERENCES cars(id) ON DELETE SET NULL,

  entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exited_at TIMESTAMP WITH TIME ZONE,
  time_spent INTEGER, -- seconds

  completed BOOLEAN DEFAULT FALSE, -- Did they proceed to next step?
  drop_off BOOLEAN DEFAULT FALSE, -- Did they leave at this step?

  metadata JSONB -- Extra data (filters used, price viewed, etc.)
);

-- Indexes for analytics_funnel_events
CREATE INDEX idx_analytics_funnel_events_session_id ON analytics_funnel_events(session_id);
CREATE INDEX idx_analytics_funnel_events_funnel_stage ON analytics_funnel_events(funnel_stage);
CREATE INDEX idx_analytics_funnel_events_funnel_step ON analytics_funnel_events(funnel_step);
CREATE INDEX idx_analytics_funnel_events_car_id ON analytics_funnel_events(car_id);
CREATE INDEX idx_analytics_funnel_events_entered_at ON analytics_funnel_events(entered_at DESC);
CREATE INDEX idx_analytics_funnel_events_completed ON analytics_funnel_events(completed);

-- ================================================
-- 5. ANALYTICS_FORM_INTERACTIONS
-- Purpose: Track form field interactions and errors
-- ================================================
CREATE TABLE IF NOT EXISTS analytics_form_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  form_name TEXT NOT NULL, -- 'search_form', 'checkout_form', 'profile_form', 'contact_form'
  field_name TEXT NOT NULL,

  interaction_type TEXT NOT NULL, -- 'focus', 'blur', 'change', 'validation_error', 'submit'

  field_value TEXT, -- Only for errors or categorized values (don't store PII)
  error_message TEXT,

  page_url TEXT NOT NULL,
  page_path TEXT,

  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics_form_interactions
CREATE INDEX idx_analytics_form_interactions_session_id ON analytics_form_interactions(session_id);
CREATE INDEX idx_analytics_form_interactions_form_name ON analytics_form_interactions(form_name);
CREATE INDEX idx_analytics_form_interactions_field_name ON analytics_form_interactions(field_name);
CREATE INDEX idx_analytics_form_interactions_interaction_type ON analytics_form_interactions(interaction_type);
CREATE INDEX idx_analytics_form_interactions_timestamp ON analytics_form_interactions(timestamp DESC);

-- ================================================
-- 6. ANALYTICS_CAR_VIEWS
-- Purpose: Track car detail page views (product analytics)
-- ================================================
CREATE TABLE IF NOT EXISTS analytics_car_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,

  view_duration INTEGER, -- seconds

  from_search BOOLEAN DEFAULT FALSE,
  from_direct_link BOOLEAN DEFAULT FALSE,

  search_filters JSONB, -- What filters were applied when finding this car?

  clicked_book_button BOOLEAN DEFAULT FALSE,

  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics_car_views
CREATE INDEX idx_analytics_car_views_session_id ON analytics_car_views(session_id);
CREATE INDEX idx_analytics_car_views_car_id ON analytics_car_views(car_id);
CREATE INDEX idx_analytics_car_views_timestamp ON analytics_car_views(timestamp DESC);
CREATE INDEX idx_analytics_car_views_clicked_book ON analytics_car_views(clicked_book_button) WHERE clicked_book_button = true;

-- ================================================
-- 7. ANALYTICS_SEARCHES
-- Purpose: Track search queries and patterns
-- ================================================
CREATE TABLE IF NOT EXISTS analytics_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  search_type TEXT, -- 'main_search', 'filter_search', 'advanced_search'

  -- Search criteria
  start_date DATE,
  end_date DATE,
  pickup_location TEXT,
  return_location TEXT,
  category TEXT,
  price_min NUMERIC,
  price_max NUMERIC,
  features JSONB,

  results_count INTEGER,

  clicked_result BOOLEAN DEFAULT FALSE,
  clicked_car_id UUID REFERENCES cars(id) ON DELETE SET NULL,

  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics_searches
CREATE INDEX idx_analytics_searches_session_id ON analytics_searches(session_id);
CREATE INDEX idx_analytics_searches_search_type ON analytics_searches(search_type);
CREATE INDEX idx_analytics_searches_timestamp ON analytics_searches(timestamp DESC);
CREATE INDEX idx_analytics_searches_clicked_result ON analytics_searches(clicked_result) WHERE clicked_result = true;

-- ================================================
-- 8. ANALYTICS_SCROLL_DEPTH
-- Purpose: Track scroll engagement on pages
-- ================================================
CREATE TABLE IF NOT EXISTS analytics_scroll_depth (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,

  page_url TEXT NOT NULL,
  page_path TEXT,

  max_scroll_percentage INTEGER, -- 0-100

  reached_25 BOOLEAN DEFAULT FALSE,
  reached_50 BOOLEAN DEFAULT FALSE,
  reached_75 BOOLEAN DEFAULT FALSE,
  reached_100 BOOLEAN DEFAULT FALSE,

  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(session_id, page_path)
);

-- Indexes for analytics_scroll_depth
CREATE INDEX idx_analytics_scroll_depth_session_id ON analytics_scroll_depth(session_id);
CREATE INDEX idx_analytics_scroll_depth_page_path ON analytics_scroll_depth(page_path);
CREATE INDEX idx_analytics_scroll_depth_percentage ON analytics_scroll_depth(max_scroll_percentage);

-- ================================================
-- 9. ANALYTICS_EXIT_INTENT
-- Purpose: Track when users are about to leave
-- ================================================
CREATE TABLE IF NOT EXISTS analytics_exit_intent (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,

  page_url TEXT NOT NULL,
  page_path TEXT,

  exit_type TEXT NOT NULL, -- 'mouse_leave', 'back_button', 'close_tab', 'inactivity', 'tab_hidden'

  time_on_page_before_exit INTEGER, -- seconds

  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics_exit_intent
CREATE INDEX idx_analytics_exit_intent_session_id ON analytics_exit_intent(session_id);
CREATE INDEX idx_analytics_exit_intent_exit_type ON analytics_exit_intent(exit_type);
CREATE INDEX idx_analytics_exit_intent_page_path ON analytics_exit_intent(page_path);
CREATE INDEX idx_analytics_exit_intent_timestamp ON analytics_exit_intent(timestamp DESC);

-- ================================================
-- 10. ANALYTICS_UTM_PERFORMANCE
-- Purpose: Aggregated UTM campaign performance (optional materialized view)
-- ================================================
CREATE TABLE IF NOT EXISTS analytics_utm_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  date DATE NOT NULL,

  sessions_count INTEGER DEFAULT 0,
  page_views_count INTEGER DEFAULT 0,
  bookings_count INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0,

  avg_session_duration INTEGER, -- seconds
  bounce_rate NUMERIC, -- percentage
  conversion_rate NUMERIC, -- percentage

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(utm_source, utm_medium, utm_campaign, date)
);

-- Indexes for analytics_utm_performance
CREATE INDEX idx_analytics_utm_performance_date ON analytics_utm_performance(date DESC);
CREATE INDEX idx_analytics_utm_performance_utm_source ON analytics_utm_performance(utm_source);
CREATE INDEX idx_analytics_utm_performance_utm_campaign ON analytics_utm_performance(utm_campaign);

-- ================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Enable RLS on all analytics tables
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_form_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_car_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_scroll_depth ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_exit_intent ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_utm_performance ENABLE ROW LEVEL SECURITY;

-- ================================================
-- RLS POLICIES: Admin-only SELECT access
-- (INSERT/UPDATE/DELETE handled by Edge Function with service_role key)
-- ================================================

-- Analytics Sessions
CREATE POLICY "Admin read access" ON analytics_sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Analytics Page Views
CREATE POLICY "Admin read access" ON analytics_page_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Analytics Click Events
CREATE POLICY "Admin read access" ON analytics_click_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Analytics Funnel Events
CREATE POLICY "Admin read access" ON analytics_funnel_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Analytics Form Interactions
CREATE POLICY "Admin read access" ON analytics_form_interactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Analytics Car Views
CREATE POLICY "Admin read access" ON analytics_car_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Analytics Searches
CREATE POLICY "Admin read access" ON analytics_searches FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Analytics Scroll Depth
CREATE POLICY "Admin read access" ON analytics_scroll_depth FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Analytics Exit Intent
CREATE POLICY "Admin read access" ON analytics_exit_intent FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Analytics UTM Performance
CREATE POLICY "Admin full access" ON analytics_utm_performance FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- ================================================
-- TRIGGERS
-- ================================================

-- Trigger to update last_seen and total_page_views in sessions
CREATE OR REPLACE FUNCTION update_session_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE analytics_sessions
  SET last_seen = NOW(),
      total_page_views = total_page_views + 1,
      updated_at = NOW()
  WHERE session_id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_last_seen
AFTER INSERT ON analytics_page_views
FOR EACH ROW
EXECUTE FUNCTION update_session_last_seen();

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_analytics_sessions_updated_at
BEFORE UPDATE ON analytics_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_analytics_utm_performance_updated_at
BEFORE UPDATE ON analytics_utm_performance
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- COMMENTS (Documentation)
-- ================================================

COMMENT ON TABLE analytics_sessions IS 'Tracks unique visitor sessions with device and UTM data';
COMMENT ON TABLE analytics_page_views IS 'Individual page view events with timing data';
COMMENT ON TABLE analytics_click_events IS 'Click events for heatmap and CTA analysis';
COMMENT ON TABLE analytics_funnel_events IS 'Booking funnel progression tracking';
COMMENT ON TABLE analytics_form_interactions IS 'Form field interactions and validation errors';
COMMENT ON TABLE analytics_car_views IS 'Car detail page views (product analytics)';
COMMENT ON TABLE analytics_searches IS 'Search queries and result interactions';
COMMENT ON TABLE analytics_scroll_depth IS 'Page scroll engagement metrics';
COMMENT ON TABLE analytics_exit_intent IS 'User exit behavior tracking';
COMMENT ON TABLE analytics_utm_performance IS 'Aggregated UTM campaign performance metrics';

-- ================================================
-- END OF MIGRATION
-- ================================================
