-- Drop existing table if exists
DROP TABLE IF EXISTS grn_items;

-- Create GRN items table
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

-- Create index on grn_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_grn_items_grn_id ON grn_items(grn_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_grn_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_grn_items_updated_at
    BEFORE UPDATE ON grn_items
    FOR EACH ROW
    EXECUTE FUNCTION update_grn_items_updated_at();