-- Quick fix for stock release functionality
-- Run this SQL in your Supabase SQL editor to fix the stock release errors

-- 1. Create stock_releases table if it doesn't exist
CREATE TABLE IF NOT EXISTS stock_releases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  quantity_kg DECIMAL(10,2) NOT NULL,
  pieces_count INTEGER NOT NULL,
  destination TEXT NOT NULL,
  release_date DATE NOT NULL,
  notes TEXT,
  box_number TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add status column to crab_entries if it doesn't exist
ALTER TABLE crab_entries 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available' CHECK (status IN ('available', 'released', 'damaged', 'dead'));

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_releases_category ON stock_releases(category);
CREATE INDEX IF NOT EXISTS idx_stock_releases_date ON stock_releases(release_date);
CREATE INDEX IF NOT EXISTS idx_stock_releases_box_number ON stock_releases(box_number);
CREATE INDEX IF NOT EXISTS idx_crab_entries_status ON crab_entries(status);

-- 4. Enable RLS on stock_releases
ALTER TABLE stock_releases ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for stock_releases
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON stock_releases;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON stock_releases;

CREATE POLICY "Enable read access for authenticated users" ON stock_releases
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON stock_releases
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 6. Create stock_alerts table if it doesn't exist
CREATE TABLE IF NOT EXISTS stock_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  current_kg DECIMAL(10,2) NOT NULL,
  min_stock_kg DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('low', 'critical', 'normal')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES auth.users(id)
);

-- 7. Enable RLS on stock_alerts
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for stock_alerts
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON stock_alerts;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON stock_alerts;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON stock_alerts;

CREATE POLICY "Enable read access for authenticated users" ON stock_alerts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON stock_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON stock_alerts
  FOR UPDATE
  TO authenticated
  USING (true);
