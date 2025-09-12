-- Fix security issues identified in the scan (safe version)

-- 1. Fix function search_path issues by updating existing functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, mobile_number, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'mobile_number',
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'jama_user')
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.audit_admin_access(table_name_param text, record_id_param uuid, action_param text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only log if user is a super admin
  IF has_role(auth.uid(), 'super_admin'::app_role) THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      new_values
    ) VALUES (
      auth.uid(),
      action_param,
      table_name_param,
      record_id_param,
      jsonb_build_object(
        'accessed_at', now(),
        'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for',
        'user_agent', current_setting('request.headers', true)::json->>'user-agent'
      )
    );
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1
$function$;

CREATE OR REPLACE FUNCTION public.audit_profile_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- 2. Create data masking functions for sensitive data protection
CREATE OR REPLACE FUNCTION public.mask_mobile_number(mobile_number text)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN mobile_number IS NULL THEN NULL
    WHEN LENGTH(mobile_number) < 4 THEN '***'
    ELSE LEFT(mobile_number, 2) || REPEAT('*', LENGTH(mobile_number) - 4) || RIGHT(mobile_number, 2)
  END
$function$;

CREATE OR REPLACE FUNCTION public.mask_financial_amount(amount numeric)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN amount IS NULL THEN NULL
    WHEN amount = 0 THEN '0'
    ELSE '₹***'
  END
$function$;

-- 3. Create secure views for sensitive data access
CREATE OR REPLACE VIEW public.secure_profiles AS
SELECT 
  id,
  user_id,
  full_name,
  CASE 
    WHEN auth.uid() = user_id OR has_role(auth.uid(), 'super_admin'::app_role) 
    THEN mobile_number
    ELSE mask_mobile_number(mobile_number)
  END as mobile_number,
  role,
  company_name,
  subscription_status,
  monthly_fee,
  subscription_start_date,
  is_active,
  created_at,
  updated_at,
  referral_id
FROM public.profiles;

CREATE OR REPLACE VIEW public.secure_customers AS
SELECT 
  id,
  customer_name,
  CASE 
    WHEN auth.uid() = created_by OR has_role(auth.uid(), 'super_admin'::app_role) 
    THEN customer_mobile
    ELSE mask_mobile_number(customer_mobile)
  END as customer_mobile,
  created_by,
  created_at,
  updated_at
FROM public.customers;

-- 4. Add triggers for audit logging on profile updates
DROP TRIGGER IF EXISTS audit_profile_changes_trigger ON public.profiles;
CREATE TRIGGER audit_profile_changes_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_profile_changes();

-- 5. Create function to enforce data retention policies
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Keep audit logs for only 1 year
  DELETE FROM public.audit_logs 
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$function$;

-- 6. Grant permissions on secure views
GRANT SELECT ON public.secure_profiles TO authenticated;
GRANT SELECT ON public.secure_customers TO authenticated;