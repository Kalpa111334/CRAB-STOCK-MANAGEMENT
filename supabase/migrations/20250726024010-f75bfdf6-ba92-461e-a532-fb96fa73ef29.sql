-- Create sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_number TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL DEFAULT 'cash',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Create policies for sale users
CREATE POLICY "Sale users can manage sales" 
ON public.sales 
FOR ALL 
USING (get_user_role(auth.uid()) = ANY (ARRAY['sale'::user_role, 'admin'::user_role]));

CREATE POLICY "All authenticated users can view sales" 
ON public.sales 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create sequence for sale numbers
CREATE SEQUENCE IF NOT EXISTS sale_number_seq START 1;

-- Create function to generate sale numbers
CREATE OR REPLACE FUNCTION public.generate_sale_number()
RETURNS TEXT AS $$
DECLARE
    year TEXT;
    month TEXT;
    sequence INT;
    new_sale_number TEXT;
BEGIN
    year := TO_CHAR(CURRENT_DATE, 'YY');
    month := TO_CHAR(CURRENT_DATE, 'MM');
    sequence := nextval('sale_number_seq');
    new_sale_number := 'SALE' || year || month || LPAD(sequence::TEXT, 4, '0');
    RETURN new_sale_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to set sale number
CREATE OR REPLACE FUNCTION public.set_sale_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sale_number IS NULL THEN
        NEW.sale_number := generate_sale_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic sale number generation
CREATE TRIGGER trigger_set_sale_number
BEFORE INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.set_sale_number();

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sales_updated_at
BEFORE UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();