import { useState, useEffect, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import useEmblaCarousel from 'embla-carousel-react';

interface Ad {
  id: string;
  title: string;
  description: string;
  image_url: string;
  is_active: boolean;
}

interface BannerCarouselProps {
  className?: string;
}

export const BannerCarousel = ({ className = "" }: BannerCarouselProps) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    skipSnaps: false,
  });

  const fetchBannerAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('id, title, description, image_url, is_active')
        .eq('is_active', true)
        .not('image_url', 'is', null)
        .not('image_url', 'eq', '')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Error fetching banner ads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBannerAds();
  }, []);

  // Manual autoplay implementation
  useEffect(() => {
    if (!emblaApi || ads.length <= 1) return;

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 4000);

    return () => clearInterval(interval);
  }, [emblaApi, ads.length]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  if (loading) {
    return (
      <div className={`relative w-full ${className}`}>
        <Card className="w-full h-48 md:h-64 lg:h-80 bg-muted/20 animate-pulse">
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading banners...</div>
          </div>
        </Card>
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className={`relative w-full ${className}`}>
        <Card className="w-full h-48 md:h-64 lg:h-80 border-dashed border-2 border-muted-foreground/20 bg-muted/5">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">No Banner Ads Available</p>
              <p className="text-sm">Banner advertisements will appear here</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`relative w-full group ${className}`}>
      {/* Embla Carousel Container */}
      <div className="overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="flex">
          {ads.map((ad, index) => (
            <div key={ad.id} className="flex-[0_0_100%] min-w-0">
              <Card className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 mx-2">
                {/* Background Image */}
                {ad.image_url && (
                  <div className="absolute inset-0">
                    <img
                      src={ad.image_url}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>
                )}
                
                {/* Content Overlay */}
                <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8">
                  <div className="space-y-3">
                    <Badge 
                      variant="secondary" 
                      className="bg-background/90 backdrop-blur-sm border border-border/50 text-foreground font-medium w-fit"
                    >
                      Advertisement
                    </Badge>
                    
                    <div className="space-y-2">
                      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg leading-tight">
                        {ad.title}
                      </h2>
                      
                      {ad.description && (
                        <p className="text-lg md:text-xl text-white/90 drop-shadow-md leading-relaxed line-clamp-2">
                          {ad.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {ads.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 p-0 bg-background/80 hover:bg-background/90 backdrop-blur-sm border border-border/50 opacity-0 group-hover:opacity-100 transition-all duration-200"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 p-0 bg-background/80 hover:bg-background/90 backdrop-blur-sm border border-border/50 opacity-0 group-hover:opacity-100 transition-all duration-200"
            onClick={scrollNext}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Dot Indicators */}
      {ads.length > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          {ads.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === selectedIndex 
                  ? 'bg-primary w-6' 
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              onClick={() => scrollTo(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};