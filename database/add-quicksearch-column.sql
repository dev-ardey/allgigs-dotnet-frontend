-- Add quicksearch column to profiles table
-- Run this in your Supabase SQL editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS quicksearch JSONB DEFAULT NULL;

-- Optional: Add comment for documentation
COMMENT ON COLUMN profiles.quicksearch IS 'Array of quick search keywords for the user stored as JSONB'; 