-- Add collapsed_job_click_card field to job_clicks table
-- This allows Found jobs to be collapsed without creating an applying record

-- Add the collapsed_job_click_card column to job_clicks table
ALTER TABLE job_clicks 
ADD COLUMN IF NOT EXISTS collapsed_job_click_card BOOLEAN DEFAULT FALSE;

-- Create an index for better performance when filtering by collapsed state
CREATE INDEX IF NOT EXISTS idx_job_clicks_collapsed_job_click_card ON job_clicks(collapsed_job_click_card);

-- Update the existing job_clicks records to have collapsed_job_click_card = false
UPDATE job_clicks 
SET collapsed_job_click_card = FALSE 
WHERE collapsed_job_click_card IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'job_clicks' 
AND column_name = 'collapsed_job_click_card'; 