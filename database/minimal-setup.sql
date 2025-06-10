-- Minimal setup for search and click logging
-- Run this in your Supabase SQL Editor

-- Create search_logs table
CREATE TABLE IF NOT EXISTS search_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    search_term TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create job_clicks table
CREATE TABLE IF NOT EXISTS job_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id TEXT,
    job_title TEXT,
    company TEXT,
    location TEXT,
    rate TEXT,
    date_posted TEXT,
    summary TEXT,
    url TEXT,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Test the tables were created
SELECT 'search_logs table created' as status;
SELECT 'job_clicks table created' as status;
