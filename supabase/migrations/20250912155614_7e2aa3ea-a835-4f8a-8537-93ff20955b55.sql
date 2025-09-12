-- Fix the security issues created in the previous migration

-- 1. Drop the problematic security definer views and replace with regular views
DROP VIEW IF EXISTS public.secure_profiles;
DROP VIEW IF EXISTS public.secure_customers;

-- 2. Fix the migrate_customer_data function search path
CREATE OR REPLACE FUNCTION public.migrate_customer_data()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  loan_record RECORD;
  customer_uuid UUID;
  migrated_count INTEGER := 0;
BEGIN
  -- Migrate existing customer data from loans to customers table
  FOR loan_record IN 
    SELECT DISTINCT customer_name, customer_mobile, user_id, id as loan_id
    FROM public.loans 
    WHERE customer_id IS NULL AND customer_name IS NOT NULL
  LOOP
    -- Check if customer already exists for this user
    SELECT id INTO customer_uuid
    FROM public.customers
    WHERE customer_name = loan_record.customer_name 
      AND COALESCE(customer_mobile, '') = COALESCE(loan_record.customer_mobile, '')
      AND created_by = loan_record.user_id;
    
    -- If customer doesn't exist, create new customer
    IF customer_uuid IS NULL THEN
      INSERT INTO public.customers (customer_name, customer_mobile, created_by)
      VALUES (loan_record.customer_name, loan_record.customer_mobile, loan_record.user_id)
      RETURNING id INTO customer_uuid;
    END IF;
    
    -- Update loan to reference customer
    UPDATE public.loans 
    SET customer_id = customer_uuid
    WHERE id = loan_record.loan_id;
    
    migrated_count := migrated_count + 1;
  END LOOP;
  
  RETURN 'Migrated ' || migrated_count || ' customer records';
END;
$function$;

-- 3. Create regular views without security definer for data access
-- These views will respect normal RLS policies
CREATE VIEW public.masked_profiles AS
SELECT 
  id,
  user_id,
  full_name,
  CASE 
    WHEN auth.uid() = user_id 
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

CREATE VIEW public.masked_customers AS
SELECT 
  id,
  customer_name,
  CASE 
    WHEN auth.uid() = created_by 
    THEN customer_mobile
    ELSE mask_mobile_number(customer_mobile)
  END as customer_mobile,
  created_by,
  created_at,
  updated_at
FROM public.customers;

-- 4. Enable RLS on the views (they inherit from base tables but let's be explicit)
ALTER VIEW public.masked_profiles SET (security_invoker = on);
ALTER VIEW public.masked_customers SET (security_invoker = on);

-- 5. Grant appropriate permissions on the new views
GRANT SELECT ON public.masked_profiles TO authenticated;
GRANT SELECT ON public.masked_customers TO authenticated;