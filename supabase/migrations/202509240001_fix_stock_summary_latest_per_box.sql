-- Recreate stock_summary to aggregate only the latest non-released entry per box
-- and ensure released entries are excluded from all totals

BEGIN;

DROP VIEW IF EXISTS public.stock_summary;

-- We first determine, per box_number, the latest entry that has not been released
-- Then aggregate by category and report_type from only those rows
CREATE VIEW public.stock_summary AS
WITH latest_box AS (
  SELECT DISTINCT ON (box_number)
    id,
    box_number,
    category,
    report_type,
    weight_kg,
    male_count,
    female_count,
    health_status,
    updated_at
  FROM public.crab_entries
  WHERE status IS NULL OR status != 'released'
  ORDER BY box_number, updated_at DESC, created_at DESC
)
SELECT 
  category,
  report_type,
  COALESCE(SUM(weight_kg), 0)::numeric AS total_weight,
  COALESCE(SUM(male_count + female_count), 0)::integer AS total_pieces,
  COALESCE(SUM(CASE WHEN health_status = 'healthy' THEN male_count + female_count ELSE 0 END), 0)::integer AS healthy_pieces,
  COALESCE(SUM(CASE WHEN health_status = 'damaged' THEN male_count + female_count ELSE 0 END), 0)::integer AS damaged_pieces,
  COUNT(*) AS total_entries,
  MAX(updated_at) AS last_updated
FROM latest_box
GROUP BY category, report_type;

COMMENT ON VIEW public.stock_summary IS 'Aggregates latest non-released crab entry per box by category/report';

COMMIT;


