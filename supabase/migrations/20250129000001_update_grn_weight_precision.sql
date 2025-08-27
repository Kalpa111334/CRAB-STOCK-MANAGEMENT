-- Update GRN items table to support higher precision for weight
ALTER TABLE grn_items 
ALTER COLUMN quantity_kg TYPE DECIMAL(15,6);

-- Update price column to also support higher precision 
ALTER TABLE grn_items 
ALTER COLUMN price TYPE DECIMAL(15,6);
