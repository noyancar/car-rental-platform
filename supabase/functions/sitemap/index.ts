import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const baseUrl = 'https://nynrentals.com' 
    const urls: any[] = []

    // Static pages
    urls.push({
      url: '',
      changefreq: 'daily',
      priority: '1.0',
      lastmod: new Date().toISOString().split('T')[0]
    })

    urls.push({
      url: '/cars',
      changefreq: 'daily',
      priority: '0.9'
    })

    urls.push({
      url: '/how-it-works',
      changefreq: 'weekly',
      priority: '0.8'
    })

    urls.push({
      url: '/deals',
      changefreq: 'daily',
      priority: '0.8'
    })

    urls.push({
      url: '/nyncars',
      changefreq: 'daily',
      priority: '0.8'
    })

    urls.push({
      url: '/blog',
      changefreq: 'daily',
      priority: '0.8'
    })

    urls.push({
      url: '/privacy',
      changefreq: 'monthly',
      priority: '0.3'
    })

    urls.push({
      url: '/terms',
      changefreq: 'monthly',
      priority: '0.3'
    })

    // Dynamic car pages
    const { data: cars, error } = await supabase
      .from('cars')
      .select('id, created_at, status')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) {
      console.error('Error fetching cars:', error)
    }

    if (cars && cars.length > 0) {
      cars.forEach(car => {
        urls.push({
          url: `/cars/${car.id}`,
          changefreq: 'weekly',
          priority: '0.7',
          lastmod: new Date(car.created_at).toISOString().split('T')[0]
        })
      })
    }

    // Dynamic blog posts
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(1000)

    if (blogError) {
      console.error('Error fetching blog posts:', blogError)
    }

    if (blogPosts && blogPosts.length > 0) {
      blogPosts.forEach(post => {
        urls.push({
          url: `/blog/${post.slug}`,
          changefreq: 'weekly',
          priority: '0.7',
          lastmod: new Date(post.updated_at).toISOString().split('T')[0]
        })
      })
    }

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    ${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ''}
    ${page.changefreq ? `<changefreq>${page.changefreq}</changefreq>` : ''}
    ${page.priority ? `<priority>${page.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
      },
    })
  } catch (error) {
    console.error('Sitemap generation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
