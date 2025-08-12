-- Ensure dead_crabs table exists with correct schema
-- Drop existing table if it exists to recreate with correct schema
DROP TABLE IF EXISTS public.dead_crabs CASCADE;

-- Create dead_crabs table with correct schema
CREATE TABLE public.dead_crabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  box_number TEXT NOT NULL,
  category crab_category NOT NULL,
  weight_kg DECIMAL(10,2) NOT NULL CHECK (weight_kg > 0),
  cause_of_death TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.dead_crabs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies that directly check the user's role in the users table
CREATE POLICY "Quality control and admin can manage dead crab entries" ON public.dead_crabs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('quality_control', 'admin')
    )
  );

CREATE POLICY "All authenticated users can view dead crab entries" ON public.dead_crabs
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_dead_crabs_updated_at
  BEFORE UPDATE ON public.dead_crabs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_dead_crabs_date ON public.dead_crabs(date);
CREATE INDEX idx_dead_crabs_box_number ON public.dead_crabs(box_number);
