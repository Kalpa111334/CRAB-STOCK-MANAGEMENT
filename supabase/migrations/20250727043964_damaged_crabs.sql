-- Create damaged_crabs table
CREATE TABLE IF NOT EXISTS public.damaged_crabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  box_number TEXT NOT NULL,
  category crab_category NOT NULL,
  weight_kg DECIMAL(10,4) NOT NULL CHECK (weight_kg > 0),
  damage_type TEXT NOT NULL,
  damage_description TEXT,
  action_taken TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Update existing table if it exists with old precision
ALTER TABLE public.damaged_crabs ALTER COLUMN weight_kg TYPE DECIMAL(10,4);

-- Enable Row Level Security
ALTER TABLE public.damaged_crabs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for damaged_crabs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'damaged_crabs' 
    AND policyname = 'Quality control and admin can manage damaged crab entries'
  ) THEN
    CREATE POLICY "Quality control and admin can manage damaged crab entries" ON public.damaged_crabs
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.users 
          WHERE users.id = auth.uid() 
          AND users.role IN ('quality_control', 'admin')
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'damaged_crabs' 
    AND policyname = 'All authenticated users can view damaged crab entries'
  ) THEN
    CREATE POLICY "All authenticated users can view damaged crab entries" ON public.damaged_crabs
      FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Create trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_damaged_crabs_updated_at'
  ) THEN
    CREATE TRIGGER update_damaged_crabs_updated_at
      BEFORE UPDATE ON public.damaged_crabs
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_damaged_crabs_date ON public.damaged_crabs(date);
CREATE INDEX IF NOT EXISTS idx_damaged_crabs_box_number ON public.damaged_crabs(box_number);
CREATE INDEX IF NOT EXISTS idx_damaged_crabs_damage_type ON public.damaged_crabs(damage_type);
