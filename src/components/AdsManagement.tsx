import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Edit, Trash2, BarChart3, Calendar, Play, Pause } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreateAdModal } from './CreateAdModal';
import { EditAdModal } from './EditAdModal';
import { AdAnalytics } from './AdAnalytics';

interface AdsManagementProps {
  onBack: () => void;
}

interface Ad {
  id: string;
  title: string;
  description: string;
  image_url: string;
  video_url: string;
  target_audience: any;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_recurring: boolean;
  recurring_type: string;
  created_at: string;
}

export const AdsManagement = ({ onBack }: AdsManagementProps) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit' | 'analytics'>('list');
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds(data || []);
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

  const toggleAdStatus = async (adId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('ads')
        .update({ is_active: !currentStatus })
        .eq('id', adId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Ad ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });

      fetchAds();
    } catch (error) {
      console.error('Error updating ad status:', error);
      toast({
        title: "Error",
        description: "Failed to update ad status",
        variant: "destructive",
      });
    }
  };

  const deleteAd = async (adId: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;

    try {
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', adId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ad deleted successfully",
      });

      fetchAds();
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast({
        title: "Error",
        description: "Failed to delete ad",
        variant: "destructive",
      });
    }
  };

  const isAdActive = (ad: Ad) => {
    const now = new Date();
    const startDate = new Date(ad.start_date);
    const endDate = ad.end_date ? new Date(ad.end_date) : null;
    
    return ad.is_active && 
           startDate <= now && 
           (!endDate || endDate >= now);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (currentView === 'create') {
    return (
      <CreateAdModal
        onClose={() => setCurrentView('list')}
        onSuccess={() => {
          setCurrentView('list');
          fetchAds();
        }}
      />
    );
  }

  if (currentView === 'edit' && selectedAd) {
    return (
      <EditAdModal
        ad={selectedAd}
        onClose={() => {
          setCurrentView('list');
          setSelectedAd(null);
        }}
        onSuccess={() => {
          setCurrentView('list');
          setSelectedAd(null);
          fetchAds();
        }}
      />
    );
  }

  if (currentView === 'analytics') {
    return (
      <AdAnalytics 
        onBack={() => setCurrentView('list')}
        selectedAdId={selectedAd?.id}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Ads Management</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCurrentView('analytics')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={() => setCurrentView('create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Ad
          </Button>
        </div>
      </div>

      {/* Ad Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Ads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ads.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Ads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ads.filter(isAdActive).length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Ads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ads.filter(ad => new Date(ad.start_date) > new Date()).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recurring Ads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ads.filter(ad => ad.is_recurring).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Ads List */}
      <Card>
        <CardHeader>
          <CardTitle>All Advertisements</CardTitle>
          <CardDescription>Manage your ad campaigns and monitor their performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No ads created yet. Create your first ad to get started.
              </div>
            ) : (
              ads.map((ad) => (
                <div key={ad.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{ad.title}</h3>
                      <Badge variant={isAdActive(ad) ? "default" : "secondary"}>
                        {isAdActive(ad) ? "Active" : "Inactive"}
                      </Badge>
                      {ad.is_recurring && (
                        <Badge variant="outline">
                          Recurring ({ad.recurring_type})
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{ad.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span>Start: {new Date(ad.start_date).toLocaleDateString()}</span>
                      {ad.end_date && (
                        <span>End: {new Date(ad.end_date).toLocaleDateString()}</span>
                      )}
                      <span>Created: {new Date(ad.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAd(ad);
                        setCurrentView('analytics');
                      }}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAd(ad);
                        setCurrentView('edit');
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAdStatus(ad.id, ad.is_active)}
                    >
                      {ad.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteAd(ad.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};