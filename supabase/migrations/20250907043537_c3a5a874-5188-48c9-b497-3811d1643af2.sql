-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'jama_user');

-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN role public.app_role NOT NULL DEFAULT 'jama_user';

-- Add subscription status and company info for super admin tracking
ALTER TABLE public.profiles 
ADD COLUMN subscription_status TEXT DEFAULT 'active',
ADD COLUMN subscription_start_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN monthly_fee NUMERIC DEFAULT 1000,
ADD COLUMN company_name TEXT,
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Super admin policies for viewing all profiles (for user management)
CREATE POLICY "Super admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'super_admin'));

-- Super admin policies for viewing all loans
CREATE POLICY "Super admins can view all loans" 
ON public.loans 
FOR SELECT 
USING (public.has_role(auth.uid(), 'super_admin'));

-- Super admin policies for viewing all collections
CREATE POLICY "Super admins can view all collections" 
ON public.collections 
FOR SELECT 
USING (public.has_role(auth.uid(), 'super_admin'));

-- Update handle_new_user function to set default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;