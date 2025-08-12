-- Add RLS policies to existing GRN tables
-- Enable Row Level Security if not already enabled
ALTER TABLE grn ENABLE ROW LEVEL SECURITY;
ALTER TABLE grn_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON grn;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON grn;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON grn;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON grn;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON grn_items;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON grn_items;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON grn_items;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON grn_items;

-- Create RLS policies for GRN table that allow authenticated users to manage GRN records
CREATE POLICY "Enable all operations for authenticated users" ON grn
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create RLS policies for GRN items table
CREATE POLICY "Enable all operations for authenticated users" ON grn_items
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
