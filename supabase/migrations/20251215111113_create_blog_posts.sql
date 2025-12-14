-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- SEO fields
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[], -- Array of keywords for targeting

  -- Blog specific fields
  category TEXT DEFAULT 'general',
  tags TEXT[], -- Array of tags
  read_time_minutes INTEGER,
  views_count INTEGER DEFAULT 0,

  CONSTRAINT blog_posts_slug_check CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);

-- Create index on published status and date
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published, published_at DESC);

-- Create index on keywords for search
CREATE INDEX IF NOT EXISTS idx_blog_posts_keywords ON blog_posts USING GIN(keywords);

-- Create index on category
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);

-- Enable Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published posts
CREATE POLICY "Anyone can read published blog posts"
  ON blog_posts
  FOR SELECT
  USING (published = true);

-- Policy: Admins can read all posts (including drafts)
CREATE POLICY "Admins can read all blog posts"
  ON blog_posts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can insert posts
CREATE POLICY "Admins can insert blog posts"
  ON blog_posts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update posts
CREATE POLICY "Admins can update blog posts"
  ON blog_posts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can delete posts
CREATE POLICY "Admins can delete blog posts"
  ON blog_posts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_blog_posts_updated_at_trigger
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_blog_post_views(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE blog_posts
  SET views_count = views_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
