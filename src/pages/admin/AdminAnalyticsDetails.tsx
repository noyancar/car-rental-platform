import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ChevronDown, ChevronUp, ArrowLeft, Clock, MousePointer, Eye, Search, ShoppingCart } from 'lucide-react';

interface FilterOption {
  source: string;
  campaigns: string[];
}

interface SessionData {
  session_id: string;
  first_seen: string;
  last_seen: string;
  device_type: string;
  utm_source: string | null;
  utm_campaign: string | null;
  landing_page: string;
  country: string;
}

interface ActivityEvent {
  type: 'page_view' | 'click' | 'car_view' | 'search' | 'funnel' | 'scroll';
  timestamp: string;
  details: any;
}

const AdminAnalyticsDetails: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sessionActivities, setSessionActivities] = useState<Record<string, ActivityEvent[]>>({});
  const [loadingActivities, setLoadingActivities] = useState<string | null>(null);

  // Traffic source filters
  const [selectedFilters, setSelectedFilters] = useState<{
    sources: string[];
    campaigns: string[];
  }>({
    sources: [],
    campaigns: [],
  });
  const [availableFilters, setAvailableFilters] = useState<FilterOption[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  useEffect(() => {
    loadAvailableFilters();
  }, []);

  useEffect(() => {
    loadSessions();
  }, [selectedFilters]);

  const loadAvailableFilters = async () => {
    const { data } = await supabase
      .from('analytics_sessions' as any)
      .select('utm_source, utm_campaign');

    if (!data) return;

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

    const filters: FilterOption[] = Object.entries(sourceMap).map(([source, campaigns]) => ({
      source,
      campaigns: Array.from(campaigns).sort(),
    }));

    setAvailableFilters(filters.sort((a, b) => a.source.localeCompare(b.source)));
  };

  const loadSessions = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('analytics_sessions' as any)
        .select('session_id, first_seen, last_seen, device_type, utm_source, utm_campaign, landing_page, country')
        .order('first_seen', { ascending: false })
        .limit(50);

      // Apply filters
      if (selectedFilters.sources.length > 0) {
        const organicSelected = selectedFilters.sources.includes('Organic');
        const namedSources = selectedFilters.sources.filter(s => s !== 'Organic');

        if (organicSelected && namedSources.length === 0) {
          query = query.is('utm_source', null);
        } else if (!organicSelected && namedSources.length > 0) {
          query = query.in('utm_source', namedSources);
        }
      }

      if (selectedFilters.campaigns.length > 0) {
        query = query.in('utm_campaign', selectedFilters.campaigns);
      }

      const { data } = await query;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionActivities = async (sessionId: string) => {
    if (sessionActivities[sessionId]) {
      return; // Already loaded
    }

    try {
      setLoadingActivities(sessionId);

      const activities: ActivityEvent[] = [];

      // Load page views
      const { data: pageViews } = await supabase
        .from('analytics_page_views' as any)
        .select('timestamp, page_path, time_on_page')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false });

      pageViews?.forEach((pv: any) => {
        activities.push({
          type: 'page_view',
          timestamp: pv.timestamp,
          details: {
            page: pv.page_path,
            duration: pv.time_on_page || 0,
          },
        });
      });

      // Load click events
      const { data: clicks } = await supabase
        .from('analytics_click_events' as any)
        .select('timestamp, element_text, page_path, event_type')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false });

      clicks?.forEach((click: any) => {
        activities.push({
          type: 'click',
          timestamp: click.timestamp,
          details: {
            element: click.element_text || 'Unknown',
            page: click.page_path,
            eventType: click.event_type,
          },
        });
      });

      // Load car views
      const { data: carViews } = await supabase
        .from('analytics_car_views' as any)
        .select('timestamp, car_id, view_duration, cars(make, model)')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false });

      carViews?.forEach((cv: any) => {
        activities.push({
          type: 'car_view',
          timestamp: cv.timestamp,
          details: {
            car: cv.cars ? `${cv.cars.make} ${cv.cars.model}` : 'Unknown Car',
            duration: cv.view_duration || 0,
          },
        });
      });

      // Load search events
      const { data: searches } = await supabase
        .from('analytics_search' as any)
        .select('timestamp, search_type, results_count, pickup_location, return_location')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false });

      searches?.forEach((search: any) => {
        activities.push({
          type: 'search',
          timestamp: search.timestamp,
          details: {
            searchType: search.search_type,
            results: search.results_count,
            pickup: search.pickup_location,
            return: search.return_location,
          },
        });
      });

      // Load funnel events
      const { data: funnelEvents } = await supabase
        .from('analytics_funnel_events' as any)
        .select('timestamp, funnel_stage, completed')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false });

      funnelEvents?.forEach((fe: any) => {
        activities.push({
          type: 'funnel',
          timestamp: fe.timestamp,
          details: {
            stage: fe.funnel_stage,
            completed: fe.completed,
          },
        });
      });

      // Sort all activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setSessionActivities(prev => ({
        ...prev,
        [sessionId]: activities,
      }));
    } catch (error) {
      console.error('Error loading session activities:', error);
    } finally {
      setLoadingActivities(null);
    }
  };

  const toggleSession = async (sessionId: string) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
    } else {
      setExpandedSession(sessionId);
      await loadSessionActivities(sessionId);
    }
  };

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

  const clearFilters = () => {
    setSelectedFilters({ sources: [], campaigns: [] });
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'page_view':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'click':
        return <MousePointer className="w-4 h-4 text-green-500" />;
      case 'car_view':
        return <Eye className="w-4 h-4 text-purple-500" />;
      case 'search':
        return <Search className="w-4 h-4 text-orange-500" />;
      case 'funnel':
        return <ShoppingCart className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
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
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/analytics')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900">User Session Details</h1>
        <p className="text-gray-600 mt-1">Detailed view of recent user sessions and activities</p>
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
                No traffic sources available.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Recent Sessions ({sessions.length})</h2>
        </div>

        <div className="divide-y">
          {sessions.map((session) => (
            <div key={session.session_id} className="border-b">
              {/* Session Header Row */}
              <div
                onClick={() => toggleSession(session.session_id)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      {expandedSession === session.session_id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 grid grid-cols-6 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Session ID</p>
                        <p className="text-sm font-mono">{session.session_id.substring(0, 8)}...</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">First Seen</p>
                        <p className="text-sm">{formatTimestamp(session.first_seen)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Device</p>
                        <p className="text-sm capitalize">{session.device_type || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Source</p>
                        <p className="text-sm">{session.utm_source || 'Organic'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Landing Page</p>
                        <p className="text-sm truncate" title={session.landing_page}>{session.landing_page}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Country</p>
                        <p className="text-sm">{session.country || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Activities */}
              {expandedSession === session.session_id && (
                <div className="bg-gray-50 p-6 border-t">
                  {loadingActivities === session.session_id ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>

                      {sessionActivities[session.session_id]?.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No activities recorded</p>
                      ) : (
                        sessionActivities[session.session_id]?.map((activity, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                            <div className="mt-1">{getActivityIcon(activity.type)}</div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm capitalize">{activity.type.replace('_', ' ')}</span>
                                <span className="text-xs text-gray-500">{formatTimestamp(activity.timestamp)}</span>
                              </div>
                              <div className="mt-1 text-sm text-gray-600">
                                {activity.type === 'page_view' && (
                                  <span>
                                    Viewed <span className="font-medium">{activity.details.page}</span>
                                    {activity.details.duration > 0 && (
                                      <span className="text-gray-500"> • {formatDuration(activity.details.duration)}</span>
                                    )}
                                  </span>
                                )}
                                {activity.type === 'click' && (
                                  <span>
                                    Clicked <span className="font-medium">{activity.details.element}</span> on {activity.details.page}
                                  </span>
                                )}
                                {activity.type === 'car_view' && (
                                  <span>
                                    Viewed car <span className="font-medium">{activity.details.car}</span>
                                    {activity.details.duration > 0 && (
                                      <span className="text-gray-500"> • {formatDuration(activity.details.duration)}</span>
                                    )}
                                  </span>
                                )}
                                {activity.type === 'search' && (
                                  <span>
                                    Searched for cars • {activity.details.results} results
                                    {activity.details.pickup && (
                                      <span className="text-gray-500"> • {activity.details.pickup}</span>
                                    )}
                                  </span>
                                )}
                                {activity.type === 'funnel' && (
                                  <span>
                                    {activity.details.completed ? 'Completed' : 'Entered'} <span className="font-medium">{activity.details.stage}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {sessions.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No sessions found. Try adjusting your filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalyticsDetails;
