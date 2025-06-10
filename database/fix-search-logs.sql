-- Fix search_logs table to use TEXT instead of array
-- Run this in your Supabase SQL Editor to fix the column type

-- Drop the existing search_logs table if it exists with wrong schema
DROP TABLE IF EXISTS search_logs;

-- Recreate search_logs table with correct schema
CREATE TABLE search_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    search_term TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create job_clicks table if it doesn't exist (for click tracking)
CREATE TABLE IF NOT EXISTS job_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL,
    job_title TEXT,
    company TEXT,
    location TEXT,
    rate TEXT,
    date_posted TIMESTAMP WITH TIME ZONE,
    summary TEXT,
    url TEXT,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add some test data to verify the structure works
-- (Remove this section after testing)
-- INSERT INTO search_logs (user_id, search_term) 
-- VALUES (
--     (SELECT id FROM auth.users LIMIT 1),
--     'test-search-term'
-- ) WHERE EXISTS (SELECT 1 FROM auth.users);
