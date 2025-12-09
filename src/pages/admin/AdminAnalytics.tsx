import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  Eye,
  MousePointer,
  TrendingUp,
  ShoppingCart,
  CheckCircle,
  Table,
} from 'lucide-react';

interface KPIData {
  totalSessions: number;
  totalPageViews: number;
  totalClicks: number;
  funnelConversions: number;
  avgSessionDuration: number;
  bounceRate: number;
}

interface FunnelStageData {
  stage: string;
  users: number;
  dropOffRate: number;
}

interface DeviceBreakdown {
  name: string;
  value: number;
}

interface PageViewData {
  date: string;
  views: number;
}

interface TopPage {
  page_path: string;
  views: number;
  avgDuration: number;
}

interface TopCar {
  car_make: string;
  car_model: string;
  views: number;
  avgTimeSpent: number;
}

interface TopClickedElement {
  elementText: string;
  elementType: string;
  clicks: number;
  page: string;
}

interface TrafficSource {
  source: string;
  sessions: number;
  percentage: number;
}

interface ScrollDepthStats {
  depth: string;
  users: number;
  percentage: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface FilterOption {
  source: string;
  campaigns: string[];
}

const AdminAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState<{
    sources: string[];
    campaigns: string[];
  }>({
    sources: [],
    campaigns: [],
  });
  const [availableFilters, setAvailableFilters] = useState<FilterOption[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [kpis, setKpis] = useState<KPIData>({
    totalSessions: 0,
    totalPageViews: 0,
    totalClicks: 0,
    funnelConversions: 0,
    avgSessionDuration: 0,
    bounceRate: 0,
  });
  const [funnelData, setFunnelData] = useState<FunnelStageData[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceBreakdown[]>([]);
  const [pageViewTrend, setPageViewTrend] = useState<PageViewData[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [topCars, setTopCars] = useState<TopCar[]>([]);
  const [topClicks, setTopClicks] = useState<TopClickedElement[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [scrollDepth, setScrollDepth] = useState<ScrollDepthStats[]>([]);
  const [selectedScrollPage, setSelectedScrollPage] = useState<string>('all');
  const [availableScrollPages, setAvailableScrollPages] = useState<string[]>([]);

  useEffect(() => {
    loadAvailableFilters();
    loadAvailableScrollPages();
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedFilters]);

  useEffect(() => {
    loadScrollDepth();
  }, [selectedScrollPage, selectedFilters]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadKPIs(),
        loadFunnelData(),
        loadDeviceBreakdown(),
        loadPageViewTrend(),
        loadTopPages(),
        loadTopCars(),
        loadTopClicks(),
        loadTrafficSources(),
        loadScrollDepth(),
      ]);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load available sources and campaigns from database
  const loadAvailableFilters = async () => {
    const { data } = await supabase
      .from('analytics_sessions' as any)
      .select('utm_source, utm_campaign');

    if (!data) return;

    // Group campaigns by source
    const sourceMap: Record<string, Set<string>> = {};

    data.forEach((session: any) => {
      const source = session.utm_source || 'Organic';
      const campaign = session.utm_campaign;

      if (!sourceMap[source]) {
        sourceMap[source] = new Set();
      }

      if (campaign) {
        sourceMap[source].add(campaign);
      }
    });

    // Convert to FilterOption array
    const filters: FilterOption[] = Object.entries(sourceMap).map(([source, campaigns]) => ({
      source,
      campaigns: Array.from(campaigns).sort(),
    }));

    setAvailableFilters(filters.sort((a, b) => a.source.localeCompare(b.source)));
  };

  // Load available pages from scroll depth data
  const loadAvailableScrollPages = async () => {
    const { data } = await supabase
      .from('analytics_scroll_depth' as any)
      .select('page_path');

    if (!data) return;

    const uniquePages = [...new Set(data.map((d: any) => d.page_path).filter((p: string) => p))];
    setAvailableScrollPages(uniquePages.sort());
  };

  // Helper: Get session IDs based on selected filters
  const getFilteredSessionIds = async (): Promise<string[]> => {
    const hasSourceFilter = selectedFilters.sources.length > 0;
    const hasCampaignFilter = selectedFilters.campaigns.length > 0;

    if (!hasSourceFilter && !hasCampaignFilter) {
      return []; // No filtering - return empty array to indicate "all"
    }

    let query = supabase
      .from('analytics_sessions' as any)
      .select('session_id');

    // Apply source filter
    if (hasSourceFilter) {
      const organicSelected = selectedFilters.sources.includes('Organic');
      const namedSources = selectedFilters.sources.filter(s => s !== 'Organic');

      if (organicSelected && namedSources.length > 0) {
        // Both organic and named sources selected - use OR logic
        // This requires a more complex query - for now, fetch all and filter in JS
        const { data } = await supabase
          .from('analytics_sessions' as any)
          .select('session_id, utm_source');

        return data
          ?.filter((s: any) =>
            (s.utm_source === null && organicSelected) ||
            (namedSources.includes(s.utm_source))
          )
          .map((s: any) => s.session_id) || [];
      } else if (organicSelected) {
        // Only organic selected
        query = query.is('utm_source', null);
      } else {
        // Only named sources selected
        query = query.in('utm_source', namedSources);
      }
    }

    // Apply campaign filter
    if (hasCampaignFilter) {
      query = query.in('utm_campaign', selectedFilters.campaigns);
    }

    const { data } = await query;
    return data?.map((s: any) => s.session_id) || [];
  };

  // Toggle source filter
  const toggleSource = (source: string) => {
    setSelectedFilters(prev => {
      const isSelected = prev.sources.includes(source);
      if (isSelected) {
        return {
          ...prev,
          sources: prev.sources.filter(s => s !== source),
        };
      } else {
        return {
          ...prev,
          sources: [...prev.sources, source],
        };
      }
    });
  };

  // Toggle campaign filter
  const toggleCampaign = (campaign: string) => {
    setSelectedFilters(prev => {
      const isSelected = prev.campaigns.includes(campaign);
      if (isSelected) {
        return {
          ...prev,
          campaigns: prev.campaigns.filter(c => c !== campaign),
        };
      } else {
        return {
          ...prev,
          campaigns: [...prev.campaigns, campaign],
        };
      }
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedFilters({ sources: [], campaigns: [] });
  };

  const loadKPIs = async () => {
    // Get filtered session IDs if source filter is active
    const sessionIds = await getFilteredSessionIds();
    const hasFilter = sessionIds.length > 0 || selectedFilters.sources.length > 0 || selectedFilters.campaigns.length > 0;

    // Total sessions (directly filter by sources/campaigns)
    let sessionQuery = supabase
      .from('analytics_sessions' as any)
      .select('*', { count: 'exact', head: true });

    // Apply source/campaign filters directly to sessions table
    if (selectedFilters.sources.length > 0) {
      const organicSelected = selectedFilters.sources.includes('Organic');
      const namedSources = selectedFilters.sources.filter(s => s !== 'Organic');

      if (organicSelected && namedSources.length === 0) {
        sessionQuery = sessionQuery.is('utm_source', null);
      } else if (!organicSelected && namedSources.length > 0) {
        sessionQuery = sessionQuery.in('utm_source', namedSources);
      }
      // If both, we need to use the sessionIds approach
    }

    if (selectedFilters.campaigns.length > 0) {
      sessionQuery = sessionQuery.in('utm_campaign', selectedFilters.campaigns);
    }

    const { count: sessionCount } = await sessionQuery;

    // Total page views (filtered by session IDs)
    let pageViewQuery = supabase
      .from('analytics_page_views')
      .select('*', { count: 'exact', head: true });

    if (hasFilter && sessionIds.length > 0) {
      pageViewQuery = pageViewQuery.in('session_id', sessionIds);
    }

    const { count: pageViewCount } = await pageViewQuery;

    // Total clicks (filtered by session IDs)
    let clickQuery = supabase
      .from('analytics_click_events')
      .select('*', { count: 'exact', head: true });

    if (hasFilter && sessionIds.length > 0) {
      clickQuery = clickQuery.in('session_id', sessionIds);
    }

    const { count: clickCount } = await clickQuery;

    // Funnel conversions (filtered by session IDs)
    let conversionQuery = supabase
      .from('analytics_funnel_events')
      .select('*', { count: 'exact', head: true })
      .eq('funnel_stage', 'confirmation')
      .eq('completed', true);

    if (hasFilter && sessionIds.length > 0) {
      conversionQuery = conversionQuery.in('session_id', sessionIds);
    }

    const { count: conversionCount } = await conversionQuery;

    // Average session duration (filtered by source/campaigns)
    let sessionDataQuery = supabase
      .from('analytics_sessions' as any)
      .select('first_seen, last_seen')
      .not('last_seen', 'is', null)
      .limit(1000);

    if (selectedFilters.sources.length > 0) {
      const organicSelected = selectedFilters.sources.includes('Organic');
      const namedSources = selectedFilters.sources.filter(s => s !== 'Organic');

      if (organicSelected && namedSources.length === 0) {
        sessionDataQuery = sessionDataQuery.is('utm_source', null);
      } else if (!organicSelected && namedSources.length > 0) {
        sessionDataQuery = sessionDataQuery.in('utm_source', namedSources);
      }
    }

    if (selectedFilters.campaigns.length > 0) {
      sessionDataQuery = sessionDataQuery.in('utm_campaign', selectedFilters.campaigns);
    }

    const { data: sessionData } = await sessionDataQuery;

    let totalDuration = 0;
    let validSessions = 0;

    sessionData?.forEach((s) => {
      if (s.first_seen && s.last_seen) {
        const start = new Date(s.first_seen).getTime();
        const end = new Date(s.last_seen).getTime();
        const duration = (end - start) / 1000; // seconds
        if (duration >= 0) {
          totalDuration += duration;
          validSessions++;
        }
      }
    });

    const avgDuration = validSessions > 0 ? totalDuration / validSessions : 0;

    // Bounce rate (sessions with only 1 page view, filtered by session IDs)
    let bounceRateQuery = supabase
      .from('analytics_page_views')
      .select('session_id')
      .limit(1000);

    if (hasFilter && sessionIds.length > 0) {
      bounceRateQuery = bounceRateQuery.in('session_id', sessionIds);
    }

    const { data: singlePageSessions } = await bounceRateQuery;

    const sessionPageCounts: Record<string, number> = {};
    singlePageSessions?.forEach((pv) => {
      sessionPageCounts[pv.session_id] = (sessionPageCounts[pv.session_id] || 0) + 1;
    });

    const totalTrackedSessions = Object.keys(sessionPageCounts).length;
    const bouncedSessions = Object.values(sessionPageCounts).filter((count) => count === 1).length;
    
    const bounceRate = totalTrackedSessions > 0 
      ? (bouncedSessions / totalTrackedSessions) * 100 
      : 0;

    setKpis({
      totalSessions: sessionCount || 0,
      totalPageViews: pageViewCount || 0,
      totalClicks: clickCount || 0,
      funnelConversions: conversionCount || 0,
      avgSessionDuration: Math.round(avgDuration),
      bounceRate: Math.round(bounceRate),
    });
  };

  const loadFunnelData = async () => {
    const stages = ['homepage', 'listing', 'car_details', 'checkout', 'payment', 'confirmation'];
    const stageLabels: Record<string, string> = {
      homepage: 'Homepage',
      listing: 'Search Results',
      car_details: 'Car Details',
      checkout: 'Checkout',
      payment: 'Payment',
      confirmation: 'Confirmation',
    };

    const funnelCounts: FunnelStageData[] = [];

    // Get filtered session IDs if source filter is active
    const sessionIds = await getFilteredSessionIds();
    const hasFilter = sessionIds.length > 0;

    // Fetch funnel events (filtered by session IDs if needed)
    let funnelQuery = supabase
      .from('analytics_funnel_events' as any)
      .select('session_id, funnel_stage');

    if (hasFilter) {
      funnelQuery = funnelQuery.in('session_id', sessionIds);
    }

    const { data: allEvents } = await funnelQuery;

    if (!allEvents) return;

    for (let i = 0; i < stages.length; i++) {
      const stageName = stages[i];
      
      // BU AŞAMADAKİ "TEKİL" OTURUMLARI FİLTRELE
      // Aynı session_id bu aşamada 50 kere de olsa Set sayesinde 1 sayılacak.
      const uniqueSessionsInStage = new Set(
        allEvents
          .filter(e => e.funnel_stage === stageName)
          .map(e => e.session_id)
      );

      const count = uniqueSessionsInStage.size;

      const dropOffRate =
        i > 0 && funnelCounts[i - 1].users > 0
          ? ((funnelCounts[i - 1].users - count) / funnelCounts[i - 1].users) * 100
          : 0;

      funnelCounts.push({
        stage: stageLabels[stageName] || stageName,
        users: count,
        dropOffRate: Math.round(dropOffRate),
      });
    }

    setFunnelData(funnelCounts);
  };

  const loadDeviceBreakdown = async () => {
    // Filter by traffic source/campaign
    let deviceQuery = supabase
      .from('analytics_sessions' as any)
      .select('device_type')
      .limit(1000);

    if (selectedFilters.sources.length > 0) {
      const organicSelected = selectedFilters.sources.includes('Organic');
      const namedSources = selectedFilters.sources.filter(s => s !== 'Organic');

      if (organicSelected && namedSources.length === 0) {
        deviceQuery = deviceQuery.is('utm_source', null);
      } else if (!organicSelected && namedSources.length > 0) {
        deviceQuery = deviceQuery.in('utm_source', namedSources);
      }
    }

    if (selectedFilters.campaigns.length > 0) {
      deviceQuery = deviceQuery.in('utm_campaign', selectedFilters.campaigns);
    }

    const { data } = await deviceQuery;

    const deviceCounts: Record<string, number> = {};
    data?.forEach((session) => {
      const device = session.device_type || 'unknown';
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    });

    const breakdown: DeviceBreakdown[] = Object.entries(deviceCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

    setDeviceData(breakdown);
  };

  const loadPageViewTrend = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get filtered session IDs
    const sessionIds = await getFilteredSessionIds();
    const hasFilter = sessionIds.length > 0;

    // Fetch page views (filtered by session IDs if needed)
    let pageViewQuery = supabase
      .from('analytics_page_views' as any)
      .select('timestamp')
      .gte('timestamp', thirtyDaysAgo.toISOString())
      .order('timestamp', { ascending: true });

    if (hasFilter) {
      pageViewQuery = pageViewQuery.in('session_id', sessionIds);
    }

    const { data } = await pageViewQuery;

    // Group by date
    const dateCounts: Record<string, number> = {};
    data?.forEach((pv) => {
      const date = new Date(pv.timestamp).toISOString().split('T')[0];
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    const trend: PageViewData[] = Object.entries(dateCounts)
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // Last 14 days

    setPageViewTrend(trend);
  };

  const loadTopPages = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get filtered session IDs
    const sessionIds = await getFilteredSessionIds();
    const hasFilter = sessionIds.length > 0;

    // Fetch page views (filtered by session IDs if needed)
    let pageViewQuery = supabase
      .from('analytics_page_views' as any)
      .select('page_path, time_on_page')
      .gte('timestamp', thirtyDaysAgo.toISOString())
      .order('timestamp', { ascending: false });

    if (hasFilter) {
      pageViewQuery = pageViewQuery.in('session_id', sessionIds);
    }

    const { data } = await pageViewQuery;

    const pageCounts: Record<string, { views: number; totalDuration: number }> = {};
    
    data?.forEach((pv) => {
      // Url parametrelerini temizle (örn: /cars?id=123 -> /cars)
      // Bu sayede aynı sayfanın farklı parametreli halleri bölünmez.
      const path = pv.page_path ? pv.page_path.split('?')[0] : '/';
      
      if (!pageCounts[path]) {
        pageCounts[path] = { views: 0, totalDuration: 0 };
      }
      pageCounts[path].views += 1;
      pageCounts[path].totalDuration += pv.time_on_page || 0;
    });

    const pages: TopPage[] = Object.entries(pageCounts)
      .map(([page_path, stats]) => ({
        page_path,
        views: stats.views,
        avgDuration: stats.views > 0 ? Math.round(stats.totalDuration / stats.views) : 0,
      }))
      .sort((a, b) => b.views - a.views) // En çok görüntülenene göre sırala
      .slice(0, 10); // İlk 10'u al

    setTopPages(pages);
  };

const loadTopCars = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get filtered session IDs
    const sessionIds = await getFilteredSessionIds();
    const hasFilter = sessionIds.length > 0;

    // Fetch car views (filtered by session IDs if needed)
    let carViewQuery = supabase
      .from('analytics_car_views' as any)
      .select(`
        view_duration,
        timestamp,
        session_id,
        cars (
          make,
          model
        )
      `)
      .gte('timestamp', thirtyDaysAgo.toISOString())
      .order('timestamp', { ascending: false });

    if (hasFilter) {
      carViewQuery = carViewQuery.in('session_id', sessionIds);
    }

    const { data } = await carViewQuery;

    // Veriyi işlemek için geçici bir yapı
    // Anahtar: "Marka Model", Değer: { TekilSessionlarSeti, ToplamSure }
    const carStats: Record<string, { sessions: Set<string>; totalTime: number }> = {};
    
    data?.forEach((cv: any) => {
      // Eğer araç silinmişse (null) işlem yapma
      if (cv.cars) {
        const key = `${cv.cars.make} ${cv.cars.model}`;
        
        if (!carStats[key]) {
          carStats[key] = { sessions: new Set(), totalTime: 0 };
        }
        
        // KRİTİK NOKTA: session_id'yi Set'e ekliyoruz.
        // Set yapısı, aynı ID'yi 50 kere ekleseniz bile içinde sadece 1 tane tutar.
        // Bu sayede o milisaniyelik çift kayıtlar otomatikman elenir.
        if (cv.session_id) {
            carStats[key].sessions.add(cv.session_id);
        }
        
        // Süreyi topluyoruz (null kontrolü ile)
        carStats[key].totalTime += cv.view_duration || 0;
      }
    });

    // İstatistikleri tablo formatına çevir
    const cars: TopCar[] = Object.entries(carStats)
      .map(([car, stats]) => {
        // İsimden Marka ve Modeli ayrıştır
        const parts = car.split(' ');
        const car_make = parts[0];
        const car_model = parts.slice(1).join(' ');
        
        // Görüntülenme sayısı olarak Satır Sayısını DEĞİL, Set'in boyutunu alıyoruz.
        // Bu bize "Tekil Ziyaretçi" sayısını verir.
        const uniqueViews = stats.sessions.size;

        return {
          car_make,
          car_model,
          views: uniqueViews, 
          avgTimeSpent: uniqueViews > 0 ? Math.round(stats.totalTime / uniqueViews) : 0,
        };
      })
      .sort((a, b) => b.views - a.views) // En çok bakılana göre sırala


    setTopCars(cars);
  };

  const loadTopClicks = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get filtered session IDs
    const sessionIds = await getFilteredSessionIds();
    const hasFilter = sessionIds.length > 0;

    // Fetch click events (filtered by session IDs if needed)
    let clickQuery = supabase
      .from('analytics_click_events' as any)
      .select('element_text, event_type, page_path, timestamp')
      .gte('timestamp', thirtyDaysAgo.toISOString())
      .order('timestamp', { ascending: false });

    if (hasFilter) {
      clickQuery = clickQuery.in('session_id', sessionIds);
    }

    const { data } = await clickQuery;

    // Group by element_text and count
    const clickCounts: Record<string, { count: number; type: string; page: string }> = {};

    data?.forEach((click) => {
      const text = click.element_text || 'Unknown';
      if (!clickCounts[text]) {
        clickCounts[text] = {
          count: 0,
          type: click.event_type || 'click',
          page: click.page_path || '/',
        };
      }
      clickCounts[text].count += 1;
    });

    const clicks: TopClickedElement[] = Object.entries(clickCounts)
      .map(([elementText, stats]) => ({
        elementText,
        elementType: stats.type,
        clicks: stats.count,
        page: stats.page,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    setTopClicks(clicks);
  };

  const loadTrafficSources = async () => {
    const { data } = await supabase
      .from('analytics_sessions')
      .select('utm_source')
      .limit(1000);

    const sourceCounts: Record<string, number> = {};
    let totalWithSource = 0;

    data?.forEach((session) => {
      const source = session.utm_source || 'Organic';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      totalWithSource += 1;
    });

    const sources: TrafficSource[] = Object.entries(sourceCounts)
      .map(([source, sessions]) => ({
        source,
        sessions,
        percentage: totalWithSource > 0 ? Math.round((sessions / totalWithSource) * 100) : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions);

    setTrafficSources(sources);
  };

  const loadScrollDepth = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get filtered session IDs
    const sessionIds = await getFilteredSessionIds();
    const hasFilter = sessionIds.length > 0;

    // Fetch scroll depth (filtered by session IDs if needed)
    let scrollQuery = supabase
      .from('analytics_scroll_depth' as any)
      .select('session_id, max_scroll_percentage, reached_25, reached_50, reached_75, reached_100, timestamp, page_path')
      .gte('timestamp', thirtyDaysAgo.toISOString());

    if (hasFilter) {
      scrollQuery = scrollQuery.in('session_id', sessionIds);
    }

    // Filter by selected page
    if (selectedScrollPage !== 'all') {
      scrollQuery = scrollQuery.eq('page_path', selectedScrollPage);
    }

    const { data } = await scrollQuery;

    if (!data || data.length === 0) {
      setScrollDepth([
        { depth: '0-25%', users: 0, percentage: 0 },
        { depth: '25-50%', users: 0, percentage: 0 },
        { depth: '50-75%', users: 0, percentage: 0 },
        { depth: '75-100%', users: 0, percentage: 0 },
      ]);
      return;
    }

    // Count unique sessions by scroll depth ranges
    const depthRanges: Record<string, Set<string>> = {
      '0-25%': new Set(),
      '25-50%': new Set(),
      '50-75%': new Set(),
      '75-100%': new Set(),
    };

    data.forEach((scroll: any) => {
      const sessionId = scroll.session_id;
      const maxPct = scroll.max_scroll_percentage || 0;

      // Categorize by maximum scroll depth reached
      if (maxPct >= 75 && scroll.reached_100) {
        depthRanges['75-100%'].add(sessionId);
      } else if (maxPct >= 50 && scroll.reached_75) {
        depthRanges['50-75%'].add(sessionId);
      } else if (maxPct >= 25 && scroll.reached_50) {
        depthRanges['25-50%'].add(sessionId);
      } else if (scroll.reached_25) {
        depthRanges['0-25%'].add(sessionId);
      } else {
        depthRanges['0-25%'].add(sessionId);
      }
    });

    const totalSessions = data.length;

    const stats: ScrollDepthStats[] = Object.entries(depthRanges).map(([depth, sessions]) => ({
      depth,
      users: sessions.size,
      percentage: totalSessions > 0 ? Math.round((sessions.size / totalSessions) * 100) : 0,
    }));

    setScrollDepth(stats);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-800"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Marketing insights and user behavior analytics</p>
        </div>
        <button
          onClick={() => navigate('/admin/analytics/details')}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Table className="w-5 h-5" />
          <span>User Details</span>
        </button>
      </div>

      {/* Traffic Source Filter Panel */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Traffic Source Filter</h2>
            {(selectedFilters.sources.length > 0 || selectedFilters.campaigns.length > 0) && (
              <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                {selectedFilters.sources.length + selectedFilters.campaigns.length} active
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {(selectedFilters.sources.length > 0 || selectedFilters.campaigns.length > 0) && (
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              {showFilterPanel ? 'Hide' : 'Show'} Filters
            </button>
          </div>
        </div>

        {showFilterPanel && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {availableFilters.map((filter) => (
                <div key={filter.source} className="border rounded-lg p-3">
                  {/* Source Checkbox */}
                  <label className="flex items-center gap-2 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedFilters.sources.includes(filter.source)}
                      onChange={() => toggleSource(filter.source)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span>{filter.source}</span>
                    {filter.campaigns.length > 0 && (
                      <span className="text-xs text-gray-500">({filter.campaigns.length})</span>
                    )}
                  </label>

                  {/* Campaign Checkboxes (nested) */}
                  {filter.campaigns.length > 0 && (
                    <div className="ml-6 mt-2 space-y-1">
                      {filter.campaigns.map((campaign) => (
                        <label
                          key={campaign}
                          className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFilters.campaigns.includes(campaign)}
                            onChange={() => toggleCampaign(campaign)}
                            className="w-3 h-3 text-primary-600 rounded focus:ring-primary-500"
                          />
                          <span className="truncate" title={campaign}>
                            {campaign}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {availableFilters.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No traffic sources available. Data will appear once analytics are tracked.
              </p>
            )}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard
          icon={<Users className="w-6 h-6" />}
          title="Total Sessions"
          value={kpis.totalSessions.toLocaleString()}
          color="blue"
        />
        <KPICard
          icon={<Eye className="w-6 h-6" />}
          title="Page Views"
          value={kpis.totalPageViews.toLocaleString()}
          color="green"
        />
        <KPICard
          icon={<MousePointer className="w-6 h-6" />}
          title="Total Clicks"
          value={kpis.totalClicks.toLocaleString()}
          color="purple"
        />
        <KPICard
          icon={<CheckCircle className="w-6 h-6" />}
          title="Conversions"
          value={kpis.funnelConversions.toLocaleString()}
          color="orange"
        />
        <KPICard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Avg Session (sec)"
          value={kpis.avgSessionDuration.toLocaleString()}
          color="indigo"
        />
        <KPICard
          icon={<ShoppingCart className="w-6 h-6" />}
          title="Bounce Rate"
          value={`${kpis.bounceRate}%`}
          color="red"
        />
      </div>

      {/* Funnel Visualization */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Booking Funnel</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={funnelData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stage" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="users" fill="#0088FE" name="Users" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {funnelData.map((stage, index) => (
            <div key={stage.stage} className="text-center">
              <p className="text-sm text-gray-600">{stage.stage}</p>
              <p className="text-2xl font-bold text-gray-900">{stage.users}</p>
              {index > 0 && (
                <p className="text-xs text-red-600">-{stage.dropOffRate}% drop-off</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Page View Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Page Views (Last 14 Days)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={pageViewTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="views" stroke="#00C49F" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Device Breakdown</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={deviceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {deviceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Top Pages</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Page
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Views
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Avg Time (s)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topPages.map((page, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900 truncate max-w-[200px]" title={page.page_path}>
                        {page.page_path}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">{page.views}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{page.avgDuration}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Cars */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Most Viewed Cars</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Car
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Views
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Avg Time (s)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topCars.map((car, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {car.car_make} {car.car_model}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">{car.views}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{car.avgTimeSpent}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Traffic Sources</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={trafficSources}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ source, percentage }) => `${source} ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="sessions"
              >
                {trafficSources.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {trafficSources.map((source, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm text-gray-700">{source.source}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {source.sessions} ({source.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Depth */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Scroll Depth</h2>

          {/* Page Filter */}
          <div className="mb-4">
            <label htmlFor="scroll-page-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Page:
            </label>
            <select
              id="scroll-page-filter"
              value={selectedScrollPage}
              onChange={(e) => setSelectedScrollPage(e.target.value)}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Pages</option>
              {availableScrollPages.map((page) => (
                <option key={page} value={page}>
                  {page}
                </option>
              ))}
            </select>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={scrollDepth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="depth" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="users" fill="#FFBB28" name="Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Most Clicked Elements */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Most Clicked Elements</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Element
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Page
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Clicks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topClicks.map((click, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 text-sm text-gray-900 truncate max-w-[300px]" title={click.elementText}>
                    {click.elementText}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">{click.elementType}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 truncate max-w-[150px]" title={click.page}>
                    {click.page}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 font-semibold">{click.clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

interface KPICardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: string;
}

const KPICard: React.FC<KPICardProps> = ({ icon, title, value, color }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
};

export default AdminAnalytics;