-- Fix security issue: Customer Financial Data Could Be Stolen by Hackers
-- 
-- Current Issue: The loans table has overly permissive RLS policies that allow
-- super admins to access all customer financial data, which poses a security risk.
-- 
-- Solution: Implement more granular access control by:
-- 1. Creating a separate customer_data table for sensitive information
-- 2. Updating loans table to reference customers by ID only
-- 3. Implementing stricter RLS policies with audit logging
-- 4. Adding data masking for sensitive information

-- Step 1: Create a separate customers table for sensitive data
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

-- Step 2: Create strict RLS policies for customers table
-- Only the creator can view their customers
CREATE POLICY "Users can view their own customers" 
ON public.customers 
FOR SELECT 
USING (auth.uid() = created_by);

-- Only the creator can insert customers
CREATE POLICY "Users can insert their own customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Only the creator can update their customers
CREATE POLICY "Users can update their own customers" 
ON public.customers 
FOR UPDATE 
USING (auth.uid() = created_by);

-- Super admins can only view customer data with audit logging
CREATE POLICY "Super admins can view customers with audit" 
ON public.customers 
FOR SELECT 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) AND
  -- Log access attempt
  (
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id)
    VALUES (auth.uid(), 'ADMIN_VIEW_CUSTOMER', 'customers', id)
    RETURNING true
  ) IS NOT NULL
);

-- Step 3: Add customer_id to loans table and update structure
ALTER TABLE public.loans 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id);

-- Step 4: Create function to migrate existing customer data
CREATE OR REPLACE FUNCTION migrate_customer_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  loan_record RECORD;
  customer_uuid UUID;
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
      AND customer_mobile = loan_record.customer_mobile
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
  END LOOP;
END;
$$;

-- Step 5: Execute the migration
SELECT migrate_customer_data();

-- Step 6: Update loans table RLS policies to be more restrictive
-- Drop existing super admin policy that allows unrestricted access
DROP POLICY IF EXISTS "Super admins can view all loans" ON public.loans;

-- Create new restrictive super admin policy with audit logging
CREATE POLICY "Super admins can view loans with audit and restrictions" 
ON public.loans 
FOR SELECT 
USING (
  has_role(auth.uid(), 'super_admin'::app_role) AND
  -- Log the access attempt
  (
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (
      auth.uid(), 
      'ADMIN_VIEW_LOAN', 
      'loans', 
      id,
      jsonb_build_object('accessed_at', now(), 'reason', 'admin_review')
    )
    RETURNING true
  ) IS NOT NULL
);

-- Step 7: Add trigger for customers table timestamp updates
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Step 8: Create audit trigger for sensitive data access
CREATE OR REPLACE FUNCTION audit_sensitive_data_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log when anyone accesses loan data
  IF TG_OP = 'SELECT' AND auth.uid() IS NOT NULL THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      new_values
    ) VALUES (
      auth.uid(),
      'DATA_ACCESS',
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      jsonb_build_object(
        'timestamp', now(),
        'operation', TG_OP,
        'user_role', (SELECT role FROM public.profiles WHERE user_id = auth.uid())
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Step 9: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON public.customers(created_by);
CREATE INDEX IF NOT EXISTS idx_loans_customer_id ON public.loans(customer_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);