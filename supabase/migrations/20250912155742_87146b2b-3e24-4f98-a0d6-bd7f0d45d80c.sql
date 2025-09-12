-- Fix the security issues - properly handle existing views

-- 1. Drop all existing views that might exist
DROP VIEW IF EXISTS public.masked_profiles CASCADE;
DROP VIEW IF EXISTS public.masked_customers CASCADE;
DROP VIEW IF EXISTS public.secure_profiles CASCADE;
DROP VIEW IF EXISTS public.secure_customers CASCADE;

-- 2. Fix the migrate_customer_data function search path (this might have been done already but let's ensure)
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

-- 3. The main security fixes are already in place:
-- - All functions now have proper search_path set
-- - Enhanced audit logging is enabled
-- - Data masking functions are available
-- - Better RLS policies with audit logging are active
-- - Data validation constraints are added
-- - Audit log cleanup function is available

-- 4. Add a comment to document the security improvements
COMMENT ON FUNCTION public.mask_mobile_number IS 'Masks sensitive mobile numbers for privacy protection';
COMMENT ON FUNCTION public.mask_financial_amount IS 'Masks financial amounts for privacy protection';
COMMENT ON FUNCTION public.cleanup_old_audit_logs IS 'Removes audit logs older than 1 year for data retention compliance';