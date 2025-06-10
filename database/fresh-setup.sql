-- ==========================================
-- FRESH SUPABASE DATABASE SETUP
-- Complete schema for Freelance Job Board
-- ==========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. USER CLEARANCES TABLE
-- Manages user permission levels
-- ==========================================
CREATE TABLE user_clearances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    clearance_level TEXT CHECK (clearance_level IN ('admin', 'moderator', 'user')) NOT NULL DEFAULT 'user',
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    notes TEXT,
    UNIQUE(user_id)
);

-- ==========================================
-- 2. SEARCH LOGS TABLE (Main Focus)
-- Logs all user search activity
-- ==========================================
CREATE TABLE search_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    search_term TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==========================================
-- 3. JOB CLICKS TABLE
-- Tracks which jobs users click on
-- ==========================================
CREATE TABLE job_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- ==========================================
-- 4. JOB POSTINGS LOG TABLE
-- Audit log for job additions
-- ==========================================
CREATE TABLE job_postings_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user_email TEXT NOT NULL,
    job_id TEXT NOT NULL,
    job_title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    rate TEXT,
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_agent TEXT,
    ip_address INET,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==========================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ==========================================

-- Search logs indexes
CREATE INDEX idx_search_logs_user_id ON search_logs(user_id);
CREATE INDEX idx_search_logs_timestamp ON search_logs(timestamp DESC);
CREATE INDEX idx_search_logs_search_term ON search_logs(search_term);

-- Job clicks indexes
CREATE INDEX idx_job_clicks_user_id ON job_clicks(user_id);
CREATE INDEX idx_job_clicks_timestamp ON job_clicks(clicked_at DESC);
CREATE INDEX idx_job_clicks_job_id ON job_clicks(job_id);

-- User clearances indexes
CREATE INDEX idx_user_clearances_user_id ON user_clearances(user_id);
CREATE INDEX idx_user_clearances_level ON user_clearances(clearance_level);

-- Job postings log indexes
CREATE INDEX idx_job_postings_user_id ON job_postings_log(user_id);
CREATE INDEX idx_job_postings_timestamp ON job_postings_log(posted_at DESC);

-- ==========================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Note: Only enable if you want RLS protection
-- ==========================================

-- Enable RLS on all tables (optional - uncomment if needed)
-- ALTER TABLE user_clearances ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE job_clicks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE job_postings_log ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (uncomment if you enable RLS above)
-- Users can only see their own search logs
-- CREATE POLICY "Users can view own search logs" ON search_logs
--     FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own search logs
-- CREATE POLICY "Users can insert own search logs" ON search_logs
--     FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only see their own job clicks
-- CREATE POLICY "Users can view own job clicks" ON job_clicks
--     FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own job clicks
-- CREATE POLICY "Users can insert own job clicks" ON job_clicks
--     FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 7. SAMPLE DATA (Optional)
-- Uncomment to add test admin user
-- ==========================================

-- Example: Add admin clearance for a specific user
-- Replace 'your-user-id-here' with actual user ID after registration
-- INSERT INTO user_clearances (user_id, clearance_level, notes) VALUES
-- ('your-user-id-here', 'admin', 'System administrator');

-- ==========================================
-- 8. HELPFUL QUERIES FOR MONITORING
-- ==========================================

-- View recent search activity
-- SELECT sl.search_term, sl.timestamp, u.email 
-- FROM search_logs sl
-- JOIN auth.users u ON u.id = sl.user_id
-- ORDER BY sl.timestamp DESC
-- LIMIT 50;

-- View most popular search terms
-- SELECT search_term, COUNT(*) as frequency
-- FROM search_logs
-- GROUP BY search_term
-- ORDER BY frequency DESC
-- LIMIT 20;

-- View user activity summary
-- SELECT u.email,
--        COUNT(DISTINCT sl.id) as searches,
--        COUNT(DISTINCT jc.id) as job_clicks,
--        MAX(GREATEST(sl.timestamp, jc.clicked_at)) as last_activity
-- FROM auth.users u
-- LEFT JOIN search_logs sl ON u.id = sl.user_id
-- LEFT JOIN job_clicks jc ON u.id = jc.user_id
-- GROUP BY u.id, u.email
-- ORDER BY last_activity DESC;

-- ==========================================
-- SETUP COMPLETE!
-- ==========================================
-- Your database is now ready for:
-- ✅ User authentication
-- ✅ Search term logging (TEXT format)
-- ✅ Job click tracking
-- ✅ User permission management
-- ✅ Job posting audit logs
-- ==========================================
