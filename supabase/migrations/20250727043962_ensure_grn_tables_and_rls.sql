-- Ensure GRN tables exist and have proper RLS policies
-- Create category enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE crab_category AS ENUM ('Boil', 'Large', 'XL', 'XXL', 'Jumbo');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create GRN table if it doesn't exist
CREATE TABLE IF NOT EXISTS grn (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    grn_number TEXT UNIQUE NOT NULL,
    supplier_name TEXT NOT NULL,
    delivered_by TEXT NOT NULL,
    received_condition TEXT NOT NULL,
    date DATE NOT NULL,
    receiving_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create GRN items table if it doesn't exist
CREATE TABLE IF NOT EXISTS grn_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    grn_id UUID REFERENCES grn(id) ON DELETE CASCADE,
    item TEXT NOT NULL,
    category crab_category NOT NULL,
    quantity_pieces INTEGER,
    quantity_kg DECIMAL(10,2),
    price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_grn_number ON grn(grn_number);
CREATE INDEX IF NOT EXISTS idx_grn_items_grn_id ON grn_items(grn_id);

-- Create trigger functions if they don't exist
CREATE OR REPLACE FUNCTION update_grn_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_grn_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION generate_grn_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.grn_number := 'GRN-' || TO_CHAR(NEW.date, 'YYYYMMDD') || '-' || 
                      LPAD(CAST(
                          (SELECT COALESCE(MAX(CAST(SPLIT_PART(grn_number, '-', 3) AS INTEGER)), 0) + 1
                           FROM grn
                           WHERE grn_number LIKE 'GRN-' || TO_CHAR(NEW.date, 'YYYYMMDD') || '-%')
                          AS TEXT), 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers if they don't exist
DROP TRIGGER IF EXISTS update_grn_updated_at ON grn;
CREATE TRIGGER update_grn_updated_at
    BEFORE UPDATE ON grn
    FOR EACH ROW
    EXECUTE FUNCTION update_grn_updated_at();

DROP TRIGGER IF EXISTS update_grn_items_updated_at ON grn_items;
CREATE TRIGGER update_grn_items_updated_at
    BEFORE UPDATE ON grn_items
    FOR EACH ROW
    EXECUTE FUNCTION update_grn_items_updated_at();

DROP TRIGGER IF EXISTS set_grn_number ON grn;
CREATE TRIGGER set_grn_number
    BEFORE INSERT ON grn
    FOR EACH ROW
    EXECUTE FUNCTION generate_grn_number();

-- Enable Row Level Security
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

-- Create RLS policies for GRN table
CREATE POLICY "Enable all operations for authenticated users" ON grn
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create RLS policies for GRN items table
CREATE POLICY "Enable all operations for authenticated users" ON grn_items
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
