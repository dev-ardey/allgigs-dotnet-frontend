-- Add interview prep columns to applying table
ALTER TABLE applying 
ADD COLUMN interview_prep_data JSONB DEFAULT NULL,
ADD COLUMN interview_prep_complete BOOLEAN DEFAULT FALSE; 