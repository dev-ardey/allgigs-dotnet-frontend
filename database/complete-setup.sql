-- ==========================================
-- COMPLETE DATABASE SETUP FOR FREELANCE JOB BOARD
-- All tables, indexes, and relationships
-- ==========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. PROFILES TABLE - User profile information
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    linkedin_URL TEXT,
    industry TEXT,
    job_title TEXT,
    location TEXT,
    is_available_for_work BOOLEAN DEFAULT TRUE,
    hourly_rate INTEGER DEFAULT 75,
    age INTEGER DEFAULT 30,
    last_year_earnings INTEGER DEFAULT 75000,
    gender TEXT DEFAULT 'Male',
    interests TEXT DEFAULT 'Technology, Innovation, Problem Solving',
    main_problem TEXT DEFAULT 'Finding the right opportunities',
    date_available_to_recruiters TIMESTAMP WITH TIME ZONE,
    testimonials TEXT,
    links TEXT,
    postponed_info INTEGER DEFAULT 0,
    postponed_time TIMESTAMP WITH TIME ZONE,
    quicksearch JSONB DEFAULT NULL,
    linkedin_feed_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. EMAIL NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS email_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    new_lead_notifications BOOLEAN DEFAULT TRUE,
    follow_up_reminders BOOLEAN DEFAULT TRUE,
    weekly_summary BOOLEAN DEFAULT TRUE,
    interview_reminders BOOLEAN DEFAULT TRUE,
    market_insights BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ==========================================
-- 3. SEARCH LOGS TABLE - Track search activity
-- ==========================================
CREATE TABLE IF NOT EXISTS search_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    search_term TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==========================================
-- 4. APPLYING TABLE - Job application tracking
-- ==========================================
CREATE TABLE IF NOT EXISTS applying (
    applying_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    unique_id_job TEXT NOT NULL,
    applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Found Column Features
    sent_cv BOOLEAN DEFAULT FALSE,
    sent_portfolio BOOLEAN DEFAULT FALSE,
    sent_cover_letter BOOLEAN DEFAULT FALSE,
    
    -- Lead Column Features  
    application_time_minutes TEXT DEFAULT NULL,
    match_confidence BOOLEAN DEFAULT NULL,
    received_confirmation BOOLEAN DEFAULT NULL,
    rejection_reasons_prediction TEXT DEFAULT NULL,
    introduced_via_agency BOOLEAN DEFAULT NULL,
    
    -- Opportunity Column Features
    follow_up_date DATE DEFAULT NULL,
    interview_went_well TEXT DEFAULT NULL,
    interview_can_improve TEXT DEFAULT NULL,
    offer_rate_alignment TEXT DEFAULT NULL,
    prediction_accuracy TEXT DEFAULT NULL,
    sent_thank_you_note BOOLEAN DEFAULT NULL,
    rejection_reason_mentioned TEXT DEFAULT NULL,
    why_got_interview TEXT DEFAULT NULL,
    
    -- Deal Column Features
    job_start_date DATE DEFAULT NULL,
    contract_signing_date DATE DEFAULT NULL,
    job_hourly_rate TEXT DEFAULT NULL,
    hours_per_week TEXT DEFAULT NULL,
    job_total_length DATE DEFAULT NULL,
    client_rating INTEGER DEFAULT NULL CHECK (client_rating >= 1 AND client_rating <= 5),
    payment_interval TEXT DEFAULT NULL,
    why_they_loved_you TEXT DEFAULT NULL,
    what_you_did_well TEXT DEFAULT NULL,
    
    -- Additional features
    interview_prep_data JSONB DEFAULT NULL,
    interview_prep_complete BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMPTZ DEFAULT NULL,
    follow_up_completed BOOLEAN DEFAULT FALSE,
    follow_up_completed_at TIMESTAMPTZ DEFAULT NULL,
    follow_up_message TEXT DEFAULT NULL,
    got_the_job BOOLEAN DEFAULT NULL,
    starting_date DATE DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    contacts JSONB DEFAULT NULL,
    interviews JSONB DEFAULT NULL,
    collapsed_card BOOLEAN DEFAULT FALSE,
    
    -- Job details (for reference)
    job_title_clicked TEXT,
    company_clicked TEXT,
    location_clicked TEXT,
    rate_clicked TEXT,
    summary_clicked TEXT,
    url_clicked TEXT
);

-- ==========================================
-- 5. LEADS TABLE - Lead pipeline management
-- ==========================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Job Information (from clicked jobs)
    job_unique_id TEXT NOT NULL,
    job_title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    rate TEXT,
    job_url TEXT,
    job_summary TEXT,
    
    -- Pipeline Status
    stage TEXT NOT NULL CHECK (stage IN ('new_lead', 'applied', 'spoken', 'interview', 'denied', 'success')) DEFAULT 'new_lead',
    is_archived BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    stage_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- General Notes (always visible)
    notes TEXT,
    
    -- Stage-specific data (JSON for flexibility)
    new_lead_data JSONB DEFAULT '{}',
    applied_data JSONB DEFAULT '{}',
    spoken_data JSONB DEFAULT '{}',
    interview_data JSONB DEFAULT '{}',
    denied_data JSONB DEFAULT '{}',
    success_data JSONB DEFAULT '{}',
    
    -- Follow-up tracking
    follow_up_date TIMESTAMP WITH TIME ZONE,
    follow_up_completed BOOLEAN DEFAULT FALSE,
    
    -- Prevent duplicate leads per user
    UNIQUE(user_id, job_unique_id)
);

-- ==========================================
-- 6. LEAD CONTACTS TABLE - Contact information
-- ==========================================
CREATE TABLE IF NOT EXISTS lead_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    
    -- Person details
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT, -- recruiter, team member, manager, etc.
    
    -- Which stage this person is associated with
    stage TEXT NOT NULL CHECK (stage IN ('new_lead', 'applied', 'spoken', 'interview', 'denied', 'success')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==========================================
-- 7. LEAD ACTIVITIES TABLE - Track actions per stage
-- ==========================================
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    
    -- Activity details
    stage TEXT NOT NULL CHECK (stage IN ('new_lead', 'applied', 'spoken', 'interview', 'denied', 'success')),
    activity_type TEXT NOT NULL, -- 'note', 'file_upload', 'call', 'email', 'interview_scheduled', etc.
    content TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- ==========================================
-- 8. FREELANCE JOBS TABLE - LinkedIn posts
-- ==========================================
CREATE TABLE IF NOT EXISTS freelance_jobs (
    id BIGSERIAL PRIMARY KEY,
    auth_id UUID REFERENCES auth.users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    author_name TEXT NOT NULL,
    author_url TEXT,
    post_text TEXT NOT NULL,
    post_urn TEXT NOT NULL UNIQUE,
    keyword_match TEXT,
    probability_freelance_vacancy NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 9. USER CLEARANCES TABLE - Permission management
-- ==========================================
CREATE TABLE IF NOT EXISTS user_clearances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    clearance_level TEXT NOT NULL CHECK (clearance_level IN ('admin', 'moderator', 'user')) DEFAULT 'user',
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    notes TEXT,
    UNIQUE(user_id)
);

-- ==========================================
-- 10. JOB ADDITIONS TABLE - Log job additions
-- ==========================================
CREATE TABLE IF NOT EXISTS job_additions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL,
    job_title TEXT NOT NULL,
    company TEXT NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 11. JOB POSTINGS LOG TABLE - Audit log
-- ==========================================
CREATE TABLE IF NOT EXISTS job_postings_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    job_id TEXT NOT NULL,
    job_title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    rate TEXT,
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 12. JOB EMAIL SUBMISSIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS job_email_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_id TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    job_title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    rate TEXT NOT NULL,
    summary TEXT NOT NULL,
    poster_name TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email_subject TEXT,
    email_body TEXT,
    user_agent TEXT,
    ip_address INET,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'processed', 'approved', 'rejected')),
    admin_notes TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 13. FUTURE FEATURES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS future_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    marketing BOOLEAN DEFAULT FALSE,
    agent BOOLEAN DEFAULT FALSE,
    tooling BOOLEAN DEFAULT FALSE,
    interview_optimisation BOOLEAN DEFAULT FALSE,
    value_proposition BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ==========================================
-- 14. JOBS TABLE - Main job postings (Allgigs_All_vacancies_NEW equivalent)
-- ==========================================
CREATE TABLE IF NOT EXISTS jobs (
    UNIQUE_ID TEXT PRIMARY KEY,
    Title TEXT NOT NULL,
    Company TEXT NOT NULL,
    Location TEXT,
    rate TEXT,
    date TEXT,
    Summary TEXT,
    URL TEXT,
    group_id TEXT, -- For job stacking functionality
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    inserted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID REFERENCES auth.users(id),
    added_by_email TEXT,
    poster_name TEXT,
    source TEXT, -- Source of the job (e.g., 'allGigs')
    tags TEXT,
    Dutch BOOLEAN DEFAULT FALSE, -- Regional filter: Dutch jobs
    EU BOOLEAN DEFAULT FALSE, -- Regional filter: EU jobs
    Rest_of_World BOOLEAN DEFAULT FALSE -- Regional filter: Rest of World jobs
);

-- ==========================================
-- 15. NEW FREELANCE JOB TABLE - Email submissions
-- ==========================================
CREATE TABLE IF NOT EXISTS new_freelance_job (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    Title TEXT NOT NULL,
    Company TEXT NOT NULL,
    Location TEXT NOT NULL,
    Rate TEXT NOT NULL,
    Summary TEXT NOT NULL,
    job_id UUID DEFAULT gen_random_uuid(),
    StartDate TEXT,
    submitted_by_email TEXT NOT NULL
);

-- ==========================================
-- 16. APPLYING CONTACT DETAILS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS applying_contact_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    applying_id UUID NOT NULL REFERENCES applying(applying_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_industry ON profiles(industry);
CREATE INDEX IF NOT EXISTS idx_profiles_job_title ON profiles(job_title);

-- Email notifications indexes
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON email_notifications(user_id);

-- Search logs indexes
CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_timestamp ON search_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_search_term ON search_logs(search_term);

-- Applying indexes
CREATE INDEX IF NOT EXISTS idx_applying_user_id ON applying(user_id);
CREATE INDEX IF NOT EXISTS idx_applying_unique_id_job ON applying(unique_id_job);
CREATE INDEX IF NOT EXISTS idx_applying_applied ON applying(applied);
CREATE INDEX IF NOT EXISTS idx_applying_created_at ON applying(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applying_is_archived ON applying(is_archived);
CREATE INDEX IF NOT EXISTS idx_applying_follow_up_date ON applying(follow_up_date) WHERE follow_up_date IS NOT NULL;

-- Leads indexes
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_archived ON leads(is_archived);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(follow_up_date) WHERE follow_up_date IS NOT NULL AND follow_up_completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_job_unique_id ON leads(job_unique_id);

-- Lead contacts indexes
CREATE INDEX IF NOT EXISTS idx_lead_contacts_lead_id ON lead_contacts(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_contacts_stage ON lead_contacts(stage);

-- Lead activities indexes
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_stage ON lead_activities(stage);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON lead_activities(created_at DESC);

-- Freelance jobs indexes
CREATE INDEX IF NOT EXISTS idx_freelance_jobs_auth_id ON freelance_jobs(auth_id);
CREATE INDEX IF NOT EXISTS idx_freelance_jobs_created_at ON freelance_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_freelance_jobs_post_urn ON freelance_jobs(post_urn);

-- User clearances indexes
CREATE INDEX IF NOT EXISTS idx_user_clearances_user_id ON user_clearances(user_id);
CREATE INDEX IF NOT EXISTS idx_user_clearances_level ON user_clearances(clearance_level);

-- Job additions indexes
CREATE INDEX IF NOT EXISTS idx_job_additions_user_id ON job_additions(user_id);
CREATE INDEX IF NOT EXISTS idx_job_additions_added_at ON job_additions(added_at DESC);

-- Job postings log indexes
CREATE INDEX IF NOT EXISTS idx_job_postings_log_user_id ON job_postings_log(user_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_log_posted_at ON job_postings_log(posted_at DESC);

-- Job email submissions indexes
CREATE INDEX IF NOT EXISTS idx_job_email_submissions_user_id ON job_email_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_job_email_submissions_status ON job_email_submissions(status);
CREATE INDEX IF NOT EXISTS idx_job_email_submissions_submitted_at ON job_email_submissions(submitted_at DESC);

-- Future features indexes
CREATE INDEX IF NOT EXISTS idx_future_features_user_id ON future_features(user_id);

-- Jobs indexes
CREATE INDEX IF NOT EXISTS idx_jobs_unique_id ON jobs(UNIQUE_ID);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(Company);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(Location);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_group_id ON jobs(group_id);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
CREATE INDEX IF NOT EXISTS idx_jobs_dutch ON jobs(Dutch);
CREATE INDEX IF NOT EXISTS idx_jobs_eu ON jobs(EU);
CREATE INDEX IF NOT EXISTS idx_jobs_rest_of_world ON jobs(Rest_of_World);

-- New freelance job indexes
CREATE INDEX IF NOT EXISTS idx_new_freelance_job_user_id ON new_freelance_job(user_id);
CREATE INDEX IF NOT EXISTS idx_new_freelance_job_created_at ON new_freelance_job(created_at DESC);

-- Applying contact details indexes
CREATE INDEX IF NOT EXISTS idx_applying_contact_details_applying_id ON applying_contact_details(applying_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applying ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelance_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_clearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_additions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_email_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE future_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE applying_contact_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE new_freelance_job ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Email notifications policies
CREATE POLICY "Users can manage own email notifications" ON email_notifications FOR ALL USING (auth.uid() = user_id);

-- Search logs policies
CREATE POLICY "Users can manage own search logs" ON search_logs FOR ALL USING (auth.uid() = user_id);

-- Applying policies
CREATE POLICY "Users can manage own applying records" ON applying FOR ALL USING (auth.uid() = user_id);

-- Leads policies
CREATE POLICY "Users can manage own leads" ON leads FOR ALL USING (auth.uid() = user_id);

-- Lead contacts policies
CREATE POLICY "Users can manage own lead contacts" ON lead_contacts FOR ALL USING (
    lead_id IN (SELECT id FROM leads WHERE user_id = auth.uid())
);

-- Lead activities policies
CREATE POLICY "Users can manage own lead activities" ON lead_activities FOR ALL USING (
    lead_id IN (SELECT id FROM leads WHERE user_id = auth.uid())
);

-- Freelance jobs policies
CREATE POLICY "Authenticated users can read freelance jobs" ON freelance_jobs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert own freelance jobs" ON freelance_jobs FOR INSERT WITH CHECK (auth.uid() = auth_id);
CREATE POLICY "Users can update own freelance jobs" ON freelance_jobs FOR UPDATE USING (auth.uid() = auth_id);
CREATE POLICY "Users can delete own freelance jobs" ON freelance_jobs FOR DELETE USING (auth.uid() = auth_id);

-- User clearances policies
CREATE POLICY "Users can view own clearance" ON user_clearances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all clearances" ON user_clearances FOR ALL USING (
    EXISTS (SELECT 1 FROM user_clearances WHERE user_id = auth.uid() AND clearance_level = 'admin')
);

-- Job additions policies
CREATE POLICY "Users can manage own job additions" ON job_additions FOR ALL USING (auth.uid() = user_id);

-- Job postings log policies
CREATE POLICY "Users can manage own job postings log" ON job_postings_log FOR ALL USING (auth.uid() = user_id);

-- Job email submissions policies
CREATE POLICY "Users can manage own job email submissions" ON job_email_submissions FOR ALL USING (auth.uid() = user_id);

-- Future features policies
CREATE POLICY "Users can manage own future features" ON future_features FOR ALL USING (auth.uid() = user_id);

-- Jobs policies
CREATE POLICY "Authenticated users can read all jobs" ON jobs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert jobs" ON jobs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update jobs they added" ON jobs FOR UPDATE USING (auth.uid() = added_by);
CREATE POLICY "Users can delete jobs they added" ON jobs FOR DELETE USING (auth.uid() = added_by);

-- New freelance job policies
CREATE POLICY "Users can manage own new freelance jobs" ON new_freelance_job FOR ALL USING (auth.uid() = user_id);

-- Applying contact details policies
CREATE POLICY "Users can manage own applying contact details" ON applying_contact_details FOR ALL USING (
    applying_id IN (SELECT applying_id FROM applying WHERE user_id = auth.uid())
);

-- ==========================================
-- TRIGGERS FOR UPDATED_AT
-- ==========================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for tables with updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_notifications_updated_at BEFORE UPDATE ON email_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lead_contacts_updated_at BEFORE UPDATE ON lead_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lead_activities_updated_at BEFORE UPDATE ON lead_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_freelance_jobs_updated_at BEFORE UPDATE ON freelance_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_postings_log_updated_at BEFORE UPDATE ON job_postings_log FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_email_submissions_updated_at BEFORE UPDATE ON job_email_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_future_features_updated_at BEFORE UPDATE ON future_features FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applying_contact_details_updated_at BEFORE UPDATE ON applying_contact_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- COMMENTS FOR DOCUMENTATION
-- ==========================================
COMMENT ON TABLE profiles IS 'User profile information including personal details and preferences';
COMMENT ON TABLE email_notifications IS 'User email notification preferences';
COMMENT ON TABLE search_logs IS 'Log of user search activity for analytics';
COMMENT ON TABLE applying IS 'Job application tracking with detailed pipeline stages';
COMMENT ON TABLE leads IS 'Lead pipeline management for job opportunities';
COMMENT ON TABLE lead_contacts IS 'Contact information for leads';
COMMENT ON TABLE lead_activities IS 'Activity tracking for lead pipeline stages';
COMMENT ON TABLE freelance_jobs IS 'LinkedIn posts identified as freelance opportunities';
COMMENT ON TABLE user_clearances IS 'User permission levels for admin features';
COMMENT ON TABLE job_additions IS 'Log of jobs added by users';
COMMENT ON TABLE job_postings_log IS 'Audit log for job posting activity';
COMMENT ON TABLE job_email_submissions IS 'Email-based job submissions';
COMMENT ON TABLE future_features IS 'User preferences for future feature development';
COMMENT ON TABLE jobs IS 'Main job postings table with all job data';
COMMENT ON TABLE new_freelance_job IS 'Email-based job submissions';
COMMENT ON TABLE applying_contact_details IS 'Contact details for job applications';

-- ==========================================
-- VERIFICATION
-- ==========================================
SELECT 'Database setup completed successfully!' as status;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public'; 