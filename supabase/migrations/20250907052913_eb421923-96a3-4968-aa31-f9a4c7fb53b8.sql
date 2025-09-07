-- Create ads table
CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  target_audience JSONB DEFAULT '{}',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  is_recurring BOOLEAN DEFAULT false,
  recurring_type TEXT CHECK (recurring_type IN ('daily', 'weekly', 'monthly')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad analytics table
CREATE TABLE public.ad_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id UUID,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click')),
  village TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad notifications table
CREATE TABLE public.ad_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id UUID,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('new_ad', 'important_ad')),
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ads
CREATE POLICY "Super admins can manage all ads" 
ON public.ads 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view active ads" 
ON public.ads 
FOR SELECT 
USING (is_active = true AND start_date <= now() AND (end_date IS NULL OR end_date >= now()));

-- RLS Policies for ad_analytics
CREATE POLICY "Super admins can view all analytics" 
ON public.ad_analytics 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can insert their own analytics" 
ON public.ad_analytics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ad_notifications
CREATE POLICY "Super admins can manage all notifications" 
ON public.ad_notifications 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view their own notifications" 
ON public.ad_notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_ads_updated_at
BEFORE UPDATE ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for ads media
INSERT INTO storage.buckets (id, name, public) VALUES ('ads', 'ads', true);

-- Create storage policies for ads
CREATE POLICY "Super admins can upload ads media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'ads' AND has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Ads media is publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'ads');

CREATE POLICY "Super admins can update ads media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'ads' AND has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete ads media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'ads' AND has_role(auth.uid(), 'super_admin'::app_role));