-- Drop existing functions and triggers first
DROP TRIGGER IF EXISTS update_grn_updated_at ON grn;
DROP FUNCTION IF EXISTS update_grn_updated_at();
DROP TRIGGER IF EXISTS set_grn_number ON grn;
DROP FUNCTION IF EXISTS generate_grn_number();

-- Drop existing table if exists
DROP TABLE IF EXISTS grn;

-- Create category enum type
DO $$ BEGIN
    CREATE TYPE crab_category AS ENUM ('Boil', 'Large', 'XL', 'XXL', 'Jumbo');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create GRN table
CREATE TABLE IF NOT EXISTS grn (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    grn_number TEXT UNIQUE NOT NULL,
    supplier_name TEXT NOT NULL,
    item TEXT NOT NULL,
    category crab_category NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total_value DECIMAL(10,2) NOT NULL,
    delivered_by TEXT NOT NULL,
    received_condition TEXT NOT NULL,
    date DATE NOT NULL,
    receiving_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index on grn_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_grn_number ON grn(grn_number);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_grn_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_grn_updated_at
    BEFORE UPDATE ON grn
    FOR EACH ROW
    EXECUTE FUNCTION update_grn_updated_at();

-- Create function to generate GRN number
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

CREATE TRIGGER set_grn_number
    BEFORE INSERT ON grn
    FOR EACH ROW
    EXECUTE FUNCTION generate_grn_number(); 