-- Add new fields to loans table to support the enhanced loan form
ALTER TABLE public.loans 
ADD COLUMN IF NOT EXISTS disbursement_type TEXT DEFAULT 'full',
ADD COLUMN IF NOT EXISTS cutting_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS disbursed_amount NUMERIC,
ADD COLUMN IF NOT EXISTS repayment_type TEXT DEFAULT 'daily',
ADD COLUMN IF NOT EXISTS installment_amount NUMERIC,
ADD COLUMN IF NOT EXISTS duration_unit TEXT DEFAULT 'days',
ADD COLUMN IF NOT EXISTS total_collection NUMERIC,
ADD COLUMN IF NOT EXISTS profit_interest NUMERIC;

-- Add check constraints for valid values
ALTER TABLE public.loans 
ADD CONSTRAINT check_disbursement_type CHECK (disbursement_type IN ('full', 'cutting')),
ADD CONSTRAINT check_repayment_type CHECK (repayment_type IN ('daily', 'weekly', 'monthly')),
ADD CONSTRAINT check_duration_unit CHECK (duration_unit IN ('days', 'weeks', 'months'));

-- Add comments for clarity
COMMENT ON COLUMN public.loans.disbursement_type IS 'Type of disbursement: full or cutting';
COMMENT ON COLUMN public.loans.cutting_amount IS 'Amount to be deducted if disbursement_type is cutting';
COMMENT ON COLUMN public.loans.disbursed_amount IS 'Actual amount disbursed (principal - cutting if applicable)';
COMMENT ON COLUMN public.loans.repayment_type IS 'Frequency of repayment: daily, weekly, or monthly';
COMMENT ON COLUMN public.loans.installment_amount IS 'Amount per installment';
COMMENT ON COLUMN public.loans.duration_unit IS 'Unit for duration: days, weeks, or months';
COMMENT ON COLUMN public.loans.total_collection IS 'Total amount to be collected (installment_amount * duration_months)';
COMMENT ON COLUMN public.loans.profit_interest IS 'Profit/Interest (total_collection - disbursed_amount)';