-- Create stock_releases table
CREATE TABLE IF NOT EXISTS stock_releases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category TEXT NOT NULL,
  quantity_kg DECIMAL(10,2) NOT NULL,
  pieces_count INTEGER NOT NULL,
  destination TEXT NOT NULL,
  release_date DATE NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create stock_alerts table
CREATE TABLE IF NOT EXISTS stock_alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category TEXT NOT NULL,
  current_kg DECIMAL(10,2) NOT NULL,
  min_stock_kg DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('low', 'critical', 'normal')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES auth.users(id)
);

-- Add indexes for better query performance
CREATE INDEX idx_stock_releases_category ON stock_releases(category);
CREATE INDEX idx_stock_releases_date ON stock_releases(release_date);
CREATE INDEX idx_stock_alerts_category ON stock_alerts(category);
CREATE INDEX idx_stock_alerts_status ON stock_alerts(status);

-- Add RLS policies for stock_releases
ALTER TABLE stock_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON stock_releases
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON stock_releases
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add RLS policies for stock_alerts
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;

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
  USING (true)
  WITH CHECK (true);
