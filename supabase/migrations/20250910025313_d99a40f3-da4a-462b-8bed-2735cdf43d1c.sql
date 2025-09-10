-- Fix security issue: Customer Financial Data Could Be Stolen by Hackers
-- 
-- Solution: Create a separate customers table and implement proper access controls
-- with audit logging for sensitive data access

-- Step 1: Create customers table for sensitive data separation
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_mobile TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Step 2: Create RLS policies for customers table
CREATE POLICY "Users can view their own customers" 
ON public.customers 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own customers" 
ON public.customers 
FOR UPDATE 
USING (auth.uid() = created_by);

-- Step 3: Add customer_id to loans table
ALTER TABLE public.loans 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id);

-- Step 4: Create function to securely audit admin access
CREATE OR REPLACE FUNCTION public.audit_admin_access(
  table_name_param TEXT,
  record_id_param UUID,
  action_param TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Step 5: Update loans table RLS policies with secure admin access
-- Drop the existing super admin policy
DROP POLICY IF EXISTS "Super admins can view all loans" ON public.loans;

-- Create new restrictive policy for super admins
CREATE POLICY "Super admins can view loans with audit logging" 
ON public.loans 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (has_role(auth.uid(), 'super_admin'::app_role) AND audit_admin_access('loans', id, 'ADMIN_VIEW_LOAN'))
);

-- Step 6: Add similar protection to customers table for admin access
CREATE POLICY "Super admins can view customers with audit logging" 
ON public.customers 
FOR SELECT 
USING (
  (auth.uid() = created_by) OR 
  (has_role(auth.uid(), 'super_admin'::app_role) AND audit_admin_access('customers', id, 'ADMIN_VIEW_CUSTOMER'))
);

-- Step 7: Create function to migrate existing customer data
CREATE OR REPLACE FUNCTION migrate_customer_data()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Step 8: Execute the migration
SELECT migrate_customer_data();

-- Step 9: Add timestamp trigger for customers table
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Step 10: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON public.customers(created_by);
CREATE INDEX IF NOT EXISTS idx_loans_customer_id ON public.loans(customer_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON public.audit_logs(user_id, action);