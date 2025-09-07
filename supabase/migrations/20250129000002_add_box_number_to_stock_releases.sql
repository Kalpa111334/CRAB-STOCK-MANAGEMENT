-- Add box_number column to stock_releases table
-- This column is needed for tracking which specific boxes were released

-- Add the box_number column
ALTER TABLE stock_releases 
ADD COLUMN IF NOT EXISTS box_number TEXT;

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_stock_releases_box_number ON stock_releases(box_number);

-- Update the table comment to document the new column
COMMENT ON COLUMN stock_releases.box_number IS 'Box number associated with the stock release';
