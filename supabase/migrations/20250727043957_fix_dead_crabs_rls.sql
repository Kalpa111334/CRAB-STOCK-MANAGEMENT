-- Fix RLS policies for dead_crabs table
-- Drop existing policies
DROP POLICY IF EXISTS "Quality control can manage dead crab entries" ON public.dead_crabs;
DROP POLICY IF EXISTS "All authenticated users can view dead crab entries" ON public.dead_crabs;

-- Create new policies that directly check the user's role in the users table
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
