-- Create bank_guarantees table
CREATE TABLE IF NOT EXISTS bank_guarantees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guarantee_number VARCHAR(50) UNIQUE NOT NULL,
    guarantee_type VARCHAR(100) NOT NULL,
    value DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'SAR',
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'expired')),
    bank_name VARCHAR(200) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bank_guarantees_updated_at
    BEFORE UPDATE ON bank_guarantees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE bank_guarantees ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now)
CREATE POLICY "Allow all operations on bank_guarantees" ON bank_guarantees
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bank_guarantees_status ON bank_guarantees(status);
CREATE INDEX IF NOT EXISTS idx_bank_guarantees_expiry_date ON bank_guarantees(expiry_date);
CREATE INDEX IF NOT EXISTS idx_bank_guarantees_bank_name ON bank_guarantees(bank_name);

-- Insert sample data matching the HTML
INSERT INTO bank_guarantees (guarantee_number, guarantee_type, value, currency, issue_date, expiry_date, status, bank_name) VALUES
('BG-2025-001', 'ضمان أداء', 2500000.00, 'SAR', '2025-01-15', '2025-12-15', 'active', 'البنك الأهلي'),
('BG-2025-002', 'ضمان ابتدائي', 1200000.00, 'SAR', '2025-01-20', '2025-06-20', 'pending', 'بنك الرياض'),
('BG-2025-003', 'ضمان نهائي', 800000.00, 'SAR', '2025-01-25', '2026-01-25', 'active', 'البنك السعودي الفرنسي'),
('BG-2025-004', 'ضمان صيانة', 450000.00, 'SAR', '2025-02-01', '2027-02-01', 'active', 'بنك ساب'),
('BG-2025-005', 'ضمان أداء', 3200000.00, 'SAR', '2025-02-05', '2025-11-05', 'pending', 'البنك الأهلي')
ON CONFLICT (guarantee_number) DO NOTHING;

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE bank_guarantees;