-- Drop existing types if they exist
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.crab_category CASCADE;
DROP TYPE IF EXISTS public.crab_status CASCADE;
DROP TYPE IF EXISTS public.health_status CASCADE;
DROP TYPE IF EXISTS public.report_type CASCADE;

-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'quality_control', 'purchasing');

-- Create crab category enum
CREATE TYPE public.crab_category AS ENUM ('Boil', 'Large', 'XL', 'XXL', 'Jumbo');

-- Create crab status enum
CREATE TYPE public.crab_status AS ENUM (
  'Without one claw', 
  'Without two claw', 
  'Without one leg', 
  'Without two leg', 
  'Without three legs', 
  'Without four legs', 
  'Shell damage'
);

-- Create health status enum
CREATE TYPE public.health_status AS ENUM ('healthy', 'damaged');

-- Create report type enum
CREATE TYPE public.report_type AS ENUM ('TSF', 'Dutch_Trails');

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS public.purchases CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.crab_entries CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table for profiles
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'quality_control',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create crab_entries table
CREATE TABLE public.crab_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier TEXT NOT NULL,
  box_number TEXT NOT NULL,
  weight_kg DECIMAL(10,4) NOT NULL CHECK (weight_kg > 0),
  category crab_category NOT NULL,
  male_count INTEGER NOT NULL DEFAULT 0 CHECK (male_count >= 0),
  female_count INTEGER NOT NULL DEFAULT 0 CHECK (female_count >= 0),
  crab_status crab_status[],
  health_status health_status NOT NULL DEFAULT 'healthy',
  damaged_details TEXT,
  report_type report_type NOT NULL DEFAULT 'TSF',
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create stock_summary view for real-time aggregation
CREATE VIEW public.stock_summary AS
SELECT 
  category,
  report_type,
  SUM(weight_kg) as total_weight,
  SUM(male_count + female_count) as total_pieces,
  SUM(CASE WHEN health_status = 'healthy' THEN male_count + female_count ELSE 0 END) as healthy_pieces,
  SUM(CASE WHEN health_status = 'damaged' THEN male_count + female_count ELSE 0 END) as damaged_pieces,
  COUNT(*) as total_entries,
  MAX(updated_at) as last_updated
FROM public.crab_entries
GROUP BY category, report_type;

-- Create sales table
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_name TEXT NOT NULL,
  category crab_category NOT NULL,
  quantity_kg DECIMAL(10,2) NOT NULL CHECK (quantity_kg > 0),
  pieces_count INTEGER NOT NULL CHECK (pieces_count > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity_kg * unit_price) STORED,
  report_type report_type NOT NULL DEFAULT 'TSF',
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier_name TEXT NOT NULL,
  category crab_category NOT NULL,
  quantity_kg DECIMAL(10,2) NOT NULL CHECK (quantity_kg > 0),
  pieces_count INTEGER NOT NULL CHECK (pieces_count > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity_kg * unit_price) STORED,
  report_type report_type NOT NULL DEFAULT 'TSF',
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crab_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "System can create users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.users;

-- Temporarily disable RLS to ensure it's not causing issues
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Create a single policy that allows all operations for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON public.users
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crab_entries table
CREATE POLICY "Quality control can manage crab entries" ON public.crab_entries
  FOR ALL USING (
    public.get_user_role(auth.uid()) IN ('quality_control', 'admin')
  );

CREATE POLICY "All authenticated users can view crab entries" ON public.crab_entries
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for sales table
CREATE POLICY "Admins can manage sales" ON public.sales
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "All authenticated users can view sales" ON public.sales
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for purchases table
CREATE POLICY "Admins and purchasing can manage purchases" ON public.purchases
  FOR ALL USING (
    public.get_user_role(auth.uid()) IN ('admin', 'purchasing')
  );

CREATE POLICY "All authenticated users can view purchases" ON public.purchases
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_crab_entries_updated_at ON public.crab_entries;
DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;
DROP TRIGGER IF EXISTS update_purchases_updated_at ON public.purchases;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'quality_control'::user_role)
  );
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crab_entries_updated_at
  BEFORE UPDATE ON public.crab_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_crab_entries_date ON public.crab_entries(date);
CREATE INDEX idx_crab_entries_category ON public.crab_entries(category);
CREATE INDEX idx_crab_entries_report_type ON public.crab_entries(report_type);
CREATE INDEX idx_crab_entries_health_status ON public.crab_entries(health_status);
CREATE INDEX idx_sales_date ON public.sales(date);
CREATE INDEX idx_purchases_date ON public.purchases(date);