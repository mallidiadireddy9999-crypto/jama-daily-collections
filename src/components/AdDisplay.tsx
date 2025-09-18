import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, ExternalLink, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
}

interface AdDisplayProps {
  position?: 'top' | 'side' | 'bottom' | 'inline';
  maxAds?: number;
  className?: string;
}

export const AdDisplay = ({ 
  position = 'side', 
  maxAds = 1,
  className = ""
}: AdDisplayProps) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return "mb-6 w-full";
      case 'bottom':
        return "mt-6 w-full";
      case 'side':
        return "hidden lg:block fixed right-4 top-1/2 -translate-y-1/2 z-40 w-80 max-w-md";
      case 'inline':
        return "my-8 w-full";
      default:
        return "w-full";
    }
  };

  useEffect(() => {
    fetchActiveAds();
  }, []);

  const fetchActiveAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(maxAds);

      if (error) throw error;

      // Filter ads that match target audience
      const relevantAds = (data || []).filter(ad => {
        // Check target audience (if specified)
        if (ad.target_audience && Array.isArray(ad.target_audience) && ad.target_audience.length > 0) {
          // For now, show to all users since we don't have village/user targeting implemented
          return true;
        }
        
        return true;
      });

      setAds(relevantAds);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackAdInteraction = async (adId: string, action: 'view' | 'click') => {
    try {
      await supabase
        .from('ad_analytics')
        .insert({
          ad_id: adId,
          user_id: user?.id || 'anonymous',
          event_type: action,
          village: 'default'
        });
    } catch (error) {
      // Silently fail - analytics shouldn't break the app
      console.log('Analytics tracking error:', error);
    }
  };

  const handleAdClick = (ad: Ad) => {
    trackAdInteraction(ad.id, 'click');
    // You can add click behavior here (open modal, redirect, etc.)
  };

  // Track view when ad is displayed
  useEffect(() => {
    ads.forEach(ad => {
      trackAdInteraction(ad.id, 'view');
    });
  }, [ads]);

  if (loading) {
    return (
      <div className={`${getPositionStyles()} ${className}`}>
        <Card className="p-4 animate-pulse bg-muted/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-muted rounded"></div>
            <div className="flex-1">
              <div className="h-3 bg-muted rounded mb-2"></div>
              <div className="h-2 bg-muted rounded"></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show placeholder for super admin or when no ads available
  if (ads.length === 0) {
    return (
      <div className={`${getPositionStyles()} ${className}`}>
        <Card className={`
          p-3 border-dashed border-2 border-muted-foreground/20 bg-muted/5
          ${position === 'side' ? 'shadow-md' : ''}
        `}>
          <div className="flex items-center space-x-3 text-muted-foreground">
            <div className="w-8 h-8 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Eye className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">Ad Space - {position}</p>
              <p className="text-xs opacity-75">Admin ads appear here</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${getPositionStyles()} ${className}`}>
      {ads.map((ad, index) => (
        <Card 
          key={ad.id}
          className={`
            relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl group
            ${position === 'side' ? 'mb-4 bg-gradient-to-br from-background via-background to-primary/5 backdrop-blur border-primary/20 shadow-lg min-h-[280px]' : ''}
            ${position === 'top' || position === 'bottom' ? 'bg-gradient-to-r from-primary/10 via-background to-primary/10 border-primary/20 min-h-[200px] lg:min-h-[250px]' : ''}
            ${position === 'inline' ? 'bg-gradient-to-br from-background to-primary/5 border-primary/10 min-h-[240px] lg:min-h-[300px]' : ''}
            animate-fade-in
          `}
          onClick={() => handleAdClick(ad)}
        >

          {/* Billboard Layout */}
          <div className="relative h-full">
            {/* Background Image */}
            {ad.image_url && (
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                <img
                  src={ad.image_url}
                  alt={ad.title}
                  className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>
            )}
            
            {/* Content Overlay */}
            <div className="relative z-10 h-full flex flex-col justify-between p-6">
              {/* Content Section */}
              <div className="flex flex-col justify-end h-full">
                <div>
                  <h3 className={`
                    font-bold text-white drop-shadow-lg leading-tight
                    ${position === 'side' ? 'text-lg' : 'text-xl lg:text-2xl'}
                  `}>
                    {ad.title}
                  </h3>
                  
                  {ad.description && (
                    <p className={`
                      text-white/90 drop-shadow-md mt-2 leading-relaxed
                      ${position === 'side' ? 'text-sm line-clamp-2' : 'text-base lg:text-lg line-clamp-3'}
                    `}>
                      {ad.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </Card>
      ))}
    </div>
  );
};