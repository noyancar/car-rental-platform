import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// In-memory cache for HTML template and metadata
const htmlCache = new Map<string, { content: string, timestamp: number }>()
const metaCache = new Map<string, { data: any, timestamp: number }>()
const HTML_CACHE_TTL = 60 * 60 * 1000 // 1 hour
const META_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface MetaData {
  title: string
  description: string
  image: string
  url: string
  type?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    // Strip both local and production path prefixes
    const path = url.pathname
      .replace(/^\/functions\/v1\/inject-meta-tags/, '') // Production
      .replace(/^\/inject-meta-tags/, '') // Local
      || '/'

    console.log(`[inject-meta-tags] Processing path: ${path}`)

    // Safety: If static file somehow reaches here, redirect to origin
    if (/\.(js|css|png|jpg|jpeg|gif|svg|ico|json|woff|woff2|ttf|eot|txt|html)$/i.test(path)) {
      return Response.redirect(`https://nynrentals.com${path}`, 302)
    }

    // Get metadata based on path
    const metaData = await getMetaData(path)

    // Get base HTML template
    const baseHTML = await getBaseHTML()

    // Inject meta tags
    const finalHTML = injectMetaTags(baseHTML, metaData)

    return new Response(finalHTML, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('[inject-meta-tags] Error:', error)

    // Fallback: serve basic HTML with generic meta tags
    const fallbackHTML = await getFallbackHTML()
    return new Response(fallbackHTML, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  }
})

async function getMetaData(path: string): Promise<MetaData> {
  // Check cache first
  const cached = metaCache.get(path)
  if (cached && (Date.now() - cached.timestamp < META_CACHE_TTL)) {
    console.log(`[Cache HIT] Meta data for: ${path}`)
    return cached.data
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  let metaData: MetaData

  // Homepage
  if (path === '/' || path === '') {
    metaData = {
      title: 'NYN Rentals | Premium Car Rental in Honolulu, Oahu, Hawaii',
      description: 'Rent the perfect car for your Oahu adventure with NYN Rentals. Wide selection of vehicles, transparent pricing, island-wide delivery. Daily, weekly, and monthly rentals available in Honolulu and across Hawaii.',
      image: 'https://nynrentals.com/og-home.jpg',
      url: 'https://nynrentals.com',
      type: 'website'
    }
  }
  // Blog post
  else if (path === '/blog' || path === '/blog/' || path.startsWith('/blog/')) {
    const slug = path.replace('/blog/', '').replace('/blog', '').replace(/\/$/, '')

    if (slug === '' || slug === 'blog') {
      // Blog listing page
      metaData = {
        title: 'NYN Rentals Blog | Hawaii Travel Tips & Car Rental Guides',
        description: 'Discover the best of Oahu with our travel guides, car rental tips, and local insights. Your ultimate resource for exploring Hawaii.',
        image: 'https://nynrentals.com/og-blog.jpg',
        url: 'https://nynrentals.com/blog',
        type: 'website'
      }
    } else {
      // Individual blog post
      const { data, error } = await supabase
        .from('blog_posts')
        .select('title, meta_title, meta_description, excerpt, featured_image_url')
        .eq('slug', slug)
        .eq('published', true)
        .single()

      if (error || !data) {
        console.error(`[Blog] Post not found: ${slug}`, error)
        metaData = getDefaultMeta()
      } else {
        metaData = {
          title: data.meta_title || data.title,
          description: data.meta_description || data.excerpt || data.title,
          image: data.featured_image_url || 'https://nynrentals.com/og-blog.jpg',
          url: `https://nynrentals.com/blog/${slug}`,
          type: 'article'
        }
      }
    }
  }
  // Car detail page
  else if (path.startsWith('/cars/') && path.length > 7) {
    const carId = path.replace('/cars/', '').replace(/\/$/, '')

    const { data, error } = await supabase
      .from('cars')
      .select('make, model, year, daily_rate, images, description')
      .eq('id', carId)
      .single()

    if (error || !data) {
      console.error(`[Car] Not found: ${carId}`, error)
      metaData = getDefaultMeta()
    } else {
      const carImage = Array.isArray(data.images) && data.images.length > 0
        ? data.images[0]
        : 'https://nynrentals.com/og-car.jpg'

      metaData = {
        title: `${data.year} ${data.make} ${data.model} | Rent in Honolulu | NYN Rentals`,
        description: data.description || `Rent ${data.year} ${data.make} ${data.model} in Honolulu, Oahu. From $${data.daily_rate}/day. Book your perfect car rental for your Hawaii adventure.`,
        image: carImage,
        url: `https://nynrentals.com/cars/${carId}`,
        type: 'product'
      }
    }
  }
  // Cars listing page
  else if (path === '/cars' || path === '/cars/') {
    metaData = {
      title: 'Browse All Cars | NYN Rentals Oahu',
      description: 'Browse our full fleet of rental cars in Honolulu, Oahu. From economy to luxury vehicles, find the perfect car for your Hawaii vacation.',
      image: 'https://nynrentals.com/og-cars.jpg',
      url: 'https://nynrentals.com/cars',
      type: 'website'
    }
  }
  // Deals page
  else if (path === '/deals' || path === '/deals/') {
    metaData = {
      title: 'Special Deals & Offers | NYN Rentals Oahu',
      description: 'Check out our latest car rental deals and special offers in Honolulu, Oahu. Save big on your Hawaii car rental today!',
      image: 'https://nynrentals.com/og-deals.jpg',
      url: 'https://nynrentals.com/deals',
      type: 'website'
    }
  }
  // How it works
  else if (path === '/how-it-works' || path === '/how-it-works/') {
    metaData = {
      title: 'How It Works | NYN Rentals Oahu',
      description: 'Learn how easy it is to rent a car with NYN Rentals in Honolulu, Oahu. Simple booking, transparent pricing, and exceptional service.',
      image: 'https://nynrentals.com/og-how.jpg',
      url: 'https://nynrentals.com/how-it-works',
      type: 'website'
    }
  }
  // NYN Cars page
  else if (path === '/nyncars' || path === '/nyncars/') {
    metaData = {
      title: 'NYN Cars | Our Fleet | NYN Rentals',
      description: 'Explore the NYN Rentals fleet. Quality, well-maintained vehicles perfect for exploring Oahu and Hawaii.',
      image: 'https://nynrentals.com/og-nyncars.jpg',
      url: 'https://nynrentals.com/nyncars',
      type: 'website'
    }
  }
  // Default fallback
  else {
    metaData = getDefaultMeta()
  }

  // Cache the result
  metaCache.set(path, { data: metaData, timestamp: Date.now() })

  return metaData
}

function getDefaultMeta(): MetaData {
  return {
    title: 'NYN Rentals | Premium Car Rental in Honolulu, Oahu, Hawaii',
    description: 'Rent the perfect car for your Oahu adventure. Wide selection, transparent pricing, exceptional service.',
    image: 'https://nynrentals.com/og-default.jpg',
    url: 'https://nynrentals.com',
    type: 'website'
  }
}

async function getBaseHTML(): Promise<string> {
  // Check cache
  const cached = htmlCache.get('base')
  if (cached && (Date.now() - cached.timestamp < HTML_CACHE_TTL)) {
    return cached.content
  }

  try {
    // Fetch from production
    const response = await fetch('https://nynrentals.com/index.html')
    if (!response.ok) {
      throw new Error(`Failed to fetch HTML: ${response.status}`)
    }
    const html = await response.text()

    // Cache it
    htmlCache.set('base', { content: html, timestamp: Date.now() })

    return html
  } catch (error) {
    console.error('[HTML] Failed to fetch base HTML:', error)
    return getFallbackHTML()
  }
}

async function getFallbackHTML(): Promise<string> {
  return `<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NYN Rentals | Car Rental Made Easy</title>
  <meta name="description" content="Premium car rental service in Honolulu, Oahu, Hawaii.">
</head>
<body>
  <h1>NYN Rentals</h1>
  <p>Loading...</p>
  <script>window.location.href = 'https://nynrentals.com';</script>
</body>
</html>`
}

function injectMetaTags(html: string, meta: MetaData): string {
  // Escape special characters in meta content
  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  const title = escapeHtml(meta.title)
  const description = escapeHtml(meta.description)
  const image = escapeHtml(meta.image)
  const url = escapeHtml(meta.url)
  const type = meta.type || 'website'

  const metaTags = `
    <!-- SEO Meta Tags (Injected by Edge Function) -->
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${url}" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${type}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="NYN Rentals" />
    <meta property="og:locale" content="en_US" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${url}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:site" content="@nynrentals" />
    <meta name="twitter:creator" content="@nynrentals" />
  `

  // Replace existing title tag
  let modifiedHTML = html.replace(/<title>.*?<\/title>/i, '')

  // Inject before </head>
  modifiedHTML = modifiedHTML.replace('</head>', metaTags + '\n  </head>')

  return modifiedHTML
}
