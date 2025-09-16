-- Update stock_summary view to exclude released crabs
-- This ensures that crabs with status='released' are not counted in available stock

-- Drop the existing view
DROP VIEW IF EXISTS public.stock_summary;

-- Recreate the view with status filtering
CREATE VIEW public.stock_summary AS
SELECT 
  category,
  report_type,
  SUM(weight_kg) as total_weight,
  SUM(male_count + female_count) as total_pieces,
  SUM(CASE WHEN health_status = 'healthy' THEN male_count + female_count ELSE 0 END) as healthy_pieces,
  SUM(CASE WHEN health_status = 'damaged' THEN male_count + female_count ELSE 0 END) as damaged_pieces,
  COUNT(*) as total_entries,
  MAX(updated_at) as last_updated
FROM public.crab_entries
WHERE status IS NULL OR status != 'released'  -- Exclude released crabs
GROUP BY category, report_type;

-- Add comment to document the change
COMMENT ON VIEW public.stock_summary IS 'Real-time stock aggregation excluding released crabs';
