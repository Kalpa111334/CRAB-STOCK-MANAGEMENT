-- Add status column to crab_entries table for tracking release status
-- This column will help track which crab entries have been released

-- Add the status column
ALTER TABLE crab_entries 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available' CHECK (status IN ('available', 'released', 'damaged', 'dead'));

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_crab_entries_status ON crab_entries(status);

-- Update the table comment to document the new column
COMMENT ON COLUMN crab_entries.status IS 'Status of the crab entry: available, released, damaged, or dead';
