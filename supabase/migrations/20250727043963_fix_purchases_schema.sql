-- Fix purchases table schema to match the code expectations
-- Drop existing table to recreate with correct schema
DROP TABLE IF EXISTS public.purchases CASCADE;

-- Create purchases table with the correct schema
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier_name TEXT NOT NULL,
  supplier_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  order_number TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'LKR',
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  payment_terms TEXT NOT NULL DEFAULT 'Net 30',
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for purchases table
CREATE POLICY "Admins and purchasing can manage purchases" ON public.purchases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'purchasing')
    )
  );

CREATE POLICY "All authenticated users can view purchases" ON public.purchases
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_purchases_date ON public.purchases(date);
CREATE INDEX idx_purchases_supplier_name ON public.purchases(supplier_name);
CREATE INDEX idx_purchases_status ON public.purchases(status);
CREATE INDEX idx_purchases_order_number ON public.purchases(order_number);
