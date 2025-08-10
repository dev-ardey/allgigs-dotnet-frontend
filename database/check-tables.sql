-- Check what tables exist in the database
-- Run this in Supabase SQL Editor

-- List all tables in the public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if freelance_job exists with different casing
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name ILIKE '%freelance%'
ORDER BY table_name;

-- Check if there are any tables with 'job' in the name
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name ILIKE '%job%'
ORDER BY table_name; 