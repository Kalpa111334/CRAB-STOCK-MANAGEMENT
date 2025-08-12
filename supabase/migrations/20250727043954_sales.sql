-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index on sale_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_sales_sale_number ON sales(sale_number);

-- Create index on customer_name for faster searches
CREATE INDEX IF NOT EXISTS idx_sales_customer_name ON sales(customer_name);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON sales
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON sales
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON sales
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS set_sale_number ON sales;
DROP FUNCTION IF EXISTS generate_sale_number();

-- Create function to generate sale number
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.sale_number := 'SALE-' || TO_CHAR(NEW.created_at, 'YYYYMMDD') || '-' || 
                      LPAD(CAST(
                          (SELECT COALESCE(MAX(CAST(SPLIT_PART(sale_number, '-', 3) AS INTEGER)), 0) + 1
                           FROM sales
                           WHERE sale_number LIKE 'SALE-' || TO_CHAR(NEW.created_at, 'YYYYMMDD') || '-%')
                          AS TEXT), 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_sale_number
    BEFORE INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION generate_sale_number(); 