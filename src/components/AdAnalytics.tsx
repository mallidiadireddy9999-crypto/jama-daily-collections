import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Eye, MousePointer, Users, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AdAnalyticsProps {
  onBack: () => void;
  selectedAdId?: string;
}

interface Analytics {
  ad_id: string;
  ad_title: string;
  views: number;
  clicks: number;
  villages: { [key: string]: number };
  users: { [key: string]: number };
  daily_stats: { [key: string]: { views: number; clicks: number } };
}

interface Ad {
  id: string;
  title: string;
}

export const AdAnalytics = ({ onBack, selectedAdId }: AdAnalyticsProps) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [selectedAd, setSelectedAd] = useState(selectedAdId || '');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7'); // days
  const { toast } = useToast();

  useEffect(() => {
    fetchAds();
  }, []);

  useEffect(() => {
    if (selectedAd) {
      fetchAnalytics();
    }
  }, [selectedAd, dateRange]);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('id, title')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds(data || []);
      
      if (data && data.length > 0 && !selectedAd) {
        setSelectedAd(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast({
        title: "Error",
        description: "Failed to load ads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!selectedAd) return;

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      // Fetch analytics data
      const { data: analyticsData, error } = await supabase
        .from('ad_analytics')
        .select('event_type, village, user_id, created_at')
        .eq('ad_id', selectedAd)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Fetch ad title
      const { data: adData, error: adError } = await supabase
        .from('ads')
        .select('title')
        .eq('id', selectedAd)
        .single();

      if (adError) throw adError;

      // Process analytics data
      const views = analyticsData?.filter(a => a.event_type === 'view').length || 0;
      const clicks = analyticsData?.filter(a => a.event_type === 'click').length || 0;

      const villages: { [key: string]: number } = {};
      const users: { [key: string]: number } = {};
      const daily_stats: { [key: string]: { views: number; clicks: number } } = {};

      analyticsData?.forEach(item => {
        // Village stats
        if (item.village) {
          villages[item.village] = (villages[item.village] || 0) + 1;
        }

        // User stats
        if (item.user_id) {
          users[item.user_id] = (users[item.user_id] || 0) + 1;
        }

        // Daily stats
        const date = new Date(item.created_at).toDateString();
        if (!daily_stats[date]) {
          daily_stats[date] = { views: 0, clicks: 0 };
        }
        if (item.event_type === 'view') {
          daily_stats[date].views++;
        } else if (item.event_type === 'click') {
          daily_stats[date].clicks++;
        }
      });

      setAnalytics({
        ad_id: selectedAd,
        ad_title: adData.title,
        views,
        clicks,
        villages,
        users,
        daily_stats
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = () => {
    if (!analytics) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text(`Analytics Report: ${analytics.ad_title}`, 20, 30);
    
    // Summary
    doc.setFontSize(12);
    doc.text(`Date Range: Last ${dateRange} days`, 20, 50);
    doc.text(`Total Views: ${analytics.views}`, 20, 60);
    doc.text(`Total Clicks: ${analytics.clicks}`, 20, 70);
    doc.text(`Click-through Rate: ${analytics.views > 0 ? ((analytics.clicks / analytics.views) * 100).toFixed(2) : 0}%`, 20, 80);

    // Village-wise data
    if (Object.keys(analytics.villages).length > 0) {
      const villageData = Object.entries(analytics.villages).map(([village, count]) => [village, count]);
      autoTable(doc, {
        head: [['Village', 'Interactions']],
        body: villageData,
        startY: 100,
        headStyles: { fillColor: [41, 128, 185] },
      });
    }

    doc.save(`${analytics.ad_title}-analytics.pdf`);
    
    toast({
      title: "Success",
      description: "Analytics report exported successfully",
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const ctr = analytics && analytics.views > 0 ? ((analytics.clicks / analytics.views) * 100).toFixed(2) : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Ad Analytics</h1>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportToPDF} disabled={!analytics}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Ad Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Advertisement</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedAd} onValueChange={setSelectedAd}>
            <SelectTrigger>
              <SelectValue placeholder="Select an ad to view analytics" />
            </SelectTrigger>
            <SelectContent>
              {ads.map((ad) => (
                <SelectItem key={ad.id} value={ad.id}>
                  {ad.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {analytics && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.views}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.clicks}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click-through Rate</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ctr}%</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Villages</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Object.keys(analytics.villages).length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Village-wise Performance */}
          {Object.keys(analytics.villages).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Village-wise Reach</CardTitle>
                <CardDescription>Ad performance by village</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(analytics.villages)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([village, count]) => (
                      <div key={village} className="flex justify-between items-center p-2 border rounded">
                        <span className="font-medium">{village}</span>
                        <Badge variant="secondary">{count} interactions</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Performance</CardTitle>
              <CardDescription>Views and clicks over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(analytics.daily_stats)
                  .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                  .slice(0, 7)
                  .map(([date, stats]) => (
                    <div key={date} className="flex justify-between items-center p-2 border rounded">
                      <span className="font-medium">{new Date(date).toLocaleDateString()}</span>
                      <div className="flex gap-4">
                        <span className="text-sm">Views: {stats.views}</span>
                        <span className="text-sm">Clicks: {stats.clicks}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};