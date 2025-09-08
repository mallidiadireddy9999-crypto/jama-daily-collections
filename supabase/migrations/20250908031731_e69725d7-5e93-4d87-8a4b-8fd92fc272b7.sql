-- Critical Security Fixes (Fixed)

-- 1. Enhanced RLS policy for loans - ensure customer data is only accessible to loan owners and super admins
DROP POLICY IF EXISTS "Users can view their own loans" ON public.loans;
CREATE POLICY "Users can view their own loans" 
ON public.loans 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- 2. Enhanced RLS policy for collections - protect customer collection data
DROP POLICY IF EXISTS "Users can view their own collections" ON public.collections;
CREATE POLICY "Users can view their own collections" 
ON public.collections 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- 3. Add audit logging table for sensitive operations (if not exists)
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

-- Drop and recreate audit log policies to ensure clean state
DROP POLICY IF EXISTS "Super admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "Super admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (true);

-- 4. Enhanced analytics policy - restrict user data access
DROP POLICY IF EXISTS "Users can insert their own analytics" ON public.ad_analytics;
CREATE POLICY "Users can insert their own analytics" 
ON public.ad_analytics 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR 
  user_id IS NULL
);