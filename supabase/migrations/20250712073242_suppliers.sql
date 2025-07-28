-- Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  rating DECIMAL(3,1) NOT NULL DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins and purchasing can manage suppliers" ON public.suppliers
  FOR ALL USING (
    public.get_user_role(auth.uid()) IN ('admin', 'purchasing')
  );

CREATE POLICY "All authenticated users can view suppliers" ON public.suppliers
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create updated_at trigger
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column(); 