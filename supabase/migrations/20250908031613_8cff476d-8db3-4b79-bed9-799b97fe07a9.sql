-- Critical Security Fixes

-- 1. Create a proper super admin assignment function (removes hardcoded dependency)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- 2. Enhanced RLS policy for loans - ensure customer data is only accessible to loan owners and super admins
DROP POLICY IF EXISTS "Users can view their own loans" ON public.loans;
CREATE POLICY "Users can view their own loans" 
ON public.loans 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- 3. Enhanced RLS policy for collections - protect customer collection data
DROP POLICY IF EXISTS "Users can view their own collections" ON public.collections;
CREATE POLICY "Users can view their own collections" 
ON public.collections 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- 4. Add audit logging table for sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "Super admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (true);

-- 5. Enhanced analytics policy - restrict user data access
DROP POLICY IF EXISTS "Users can insert their own analytics" ON public.ad_analytics;
CREATE POLICY "Users can insert their own analytics" 
ON public.ad_analytics 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR 
  user_id IS NULL
);

-- 6. Add trigger for audit logging on profile updates
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log when super admin updates other users' profiles
  IF auth.uid() != NEW.user_id AND has_role(auth.uid(), 'super_admin'::app_role) THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      'UPDATE',
      'profiles',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for profile audit logging
DROP TRIGGER IF EXISTS audit_profile_updates ON public.profiles;
CREATE TRIGGER audit_profile_updates
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_changes();