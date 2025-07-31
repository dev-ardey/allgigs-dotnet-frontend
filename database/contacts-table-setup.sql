-- ==========================================
-- CONTACTS TABLE SETUP
-- Create table for storing contact details per lead
-- ==========================================

-- Create contacts table
CREATE TABLE IF NOT EXISTS applying_contact_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    applying_id UUID NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key to applying table
    CONSTRAINT fk_applying_contact_details_applying_id 
        FOREIGN KEY (applying_id) REFERENCES applying(applying_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applying_contact_details_applying_id 
    ON applying_contact_details(applying_id);

-- Enable RLS (Row Level Security)
ALTER TABLE applying_contact_details ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only access contacts for their own applying records
CREATE POLICY "Users can manage their own contacts" ON applying_contact_details
    FOR ALL
    USING (
        applying_id IN (
            SELECT applying_id FROM applying WHERE user_id = auth.uid()
        )
    );

-- ==========================================
-- VERIFICATION
-- ==========================================
SELECT 'Contacts table created successfully' as status; 