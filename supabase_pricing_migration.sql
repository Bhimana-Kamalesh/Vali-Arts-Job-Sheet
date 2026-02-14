-- Create pricing configuration table
CREATE TABLE IF NOT EXISTS pricing_config (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL, -- e.g., 'Flex', 'Vinyl', 'Visiting Card'
  product_name TEXT NOT NULL, -- e.g., 'Normal Flex', 'Star Flex'
  price NUMERIC NOT NULL, -- Price per unit
  unit_type TEXT NOT NULL CHECK (unit_type IN ('sqft', 'piece')),
  min_quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial pricing data
INSERT INTO pricing_config (category, product_name, price, unit_type, min_quantity) VALUES
('Flex', 'Normal Flex', 15, 'sqft', 1),
('Flex', 'Black Flex', 20, 'sqft', 1),
('Flex', 'Star Flex', 25, 'sqft', 1),
('Vinyl', 'Normal Vinyl', 30, 'sqft', 1),
('Vinyl', 'Eco Solvent Vinyl', 50, 'sqft', 1),
('Vinyl', 'Eco Solvent Laminations (Glossy/Matte)', 60, 'sqft', 1),
('Visiting Card', 'Normal Trump Visiting Card (One Side)', 1, 'piece', 500),
('Visiting Card', 'Normal Trump Visiting Card (Two Side)', 1.5, 'piece', 500),
('Visiting Card', 'Heavy Trump Visiting Cards (One Side)', 2, 'piece', 500),
('Visiting Card', 'Heavy Trump Visiting Cards (Two Side)', 3, 'piece', 500);

-- Enable RLS
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (or authenticated users)
CREATE POLICY "Enable read access for all users" ON pricing_config FOR SELECT USING (true);
