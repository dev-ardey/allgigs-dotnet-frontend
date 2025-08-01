-- Add all missing columns to applying table
-- Run this in your Supabase SQL editor

-- Interview prep columns
ALTER TABLE applying 
ADD COLUMN IF NOT EXISTS interview_prep_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS interview_prep_complete BOOLEAN DEFAULT FALSE;

-- Archive columns (if not already added)
ALTER TABLE applying 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- Follow-up columns (if not already added)
ALTER TABLE applying 
ADD COLUMN IF NOT EXISTS follow_up_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS follow_up_completed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS follow_up_message TEXT DEFAULT NULL;

-- Got the job column (if not already added)
ALTER TABLE applying 
ADD COLUMN IF NOT EXISTS got_the_job BOOLEAN DEFAULT NULL;

-- Starting date column (if not already added)
ALTER TABLE applying 
ADD COLUMN IF NOT EXISTS starting_date DATE DEFAULT NULL;

-- Notes column (if not already added)
ALTER TABLE applying 
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

-- Contacts and interviews columns (if not already added)
ALTER TABLE applying 
ADD COLUMN IF NOT EXISTS contacts JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS interviews JSONB DEFAULT NULL;

-- Collapse column (if not already added)
ALTER TABLE applying 
ADD COLUMN IF NOT EXISTS collapsed_card BOOLEAN DEFAULT FALSE; 