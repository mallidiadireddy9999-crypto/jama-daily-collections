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
  const [dismissedAds, setDismissedAds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchActiveAds();
    
    // Load dismissed ads from localStorage
    const dismissed = localStorage.getItem('dismissedAds');
    if (dismissed) {
      setDismissedAds(new Set(JSON.parse(dismissed)));
    }
  }, []);

  const fetchActiveAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .lte('start_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(maxAds);

      if (error) throw error;

      // Filter ads that haven't been dismissed and match target audience
      const relevantAds = (data || []).filter(ad => {
        // Check if ad is dismissed
        if (dismissedAds.has(ad.id)) return false;

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

  const dismissAd = (adId: string) => {
    const newDismissed = new Set([...dismissedAds, adId]);
    setDismissedAds(newDismissed);
    localStorage.setItem('dismissedAds', JSON.stringify([...newDismissed]));
    
    setAds(prev => prev.filter(ad => ad.id !== adId));
    
    // Track ad interaction (optional analytics)
    trackAdInteraction(adId, 'dismiss');
  };

  const trackAdInteraction = async (adId: string, action: 'view' | 'click' | 'dismiss') => {
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

  if (loading || ads.length === 0) {
    return null;
  }

  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return "mb-4";
      case 'bottom':
        return "mt-4";
      case 'side':
        return "fixed right-4 top-20 z-50 w-80 max-w-sm";
      case 'inline':
        return "my-4";
      default:
        return "";
    }
  };

  return (
    <div className={`${getPositionStyles()} ${className}`}>
      {ads.map((ad, index) => (
        <Card 
          key={ad.id}
          className={`
            relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg
            ${position === 'side' ? 'mb-4 bg-background/95 backdrop-blur-sm border-primary/20' : ''}
            ${position === 'top' || position === 'bottom' ? 'bg-gradient-to-r from-primary/5 to-primary/10' : ''}
            ${position === 'inline' ? 'bg-muted/30' : ''}
          `}
          onClick={() => handleAdClick(ad)}
        >
          {/* Dismiss Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 z-10 h-6 w-6 p-0 hover:bg-background/80"
            onClick={(e) => {
              e.stopPropagation();
              dismissAd(ad.id);
            }}
          >
            <X className="h-3 w-3" />
          </Button>

          <div className="p-4">
            <div className="flex items-start space-x-3">
              {/* Ad Image */}
              {ad.image_url && (
                <div className="flex-shrink-0">
                  <img
                    src={ad.image_url}
                    alt={ad.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                </div>
              )}
              
              {/* Ad Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-sm text-foreground truncate">
                    {ad.title}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    Ad
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {ad.description}
                </p>

                {/* Action Button */}
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-7 text-xs px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdClick(ad);
                  }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              </div>
            </div>
          </div>

          {/* Subtle gradient overlay for visual appeal */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 pointer-events-none" />
        </Card>
      ))}
    </div>
  );
};