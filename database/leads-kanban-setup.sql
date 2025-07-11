-- ==========================================
-- LEADS KANBAN BOARD DATABASE SETUP
-- Complete schema for Lead Pipeline Management
-- ==========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- LEADS TABLE - Main pipeline data
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
-- PERSON CARDS TABLE - Contact information
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
-- STAGE ACTIVITIES TABLE - Track actions per stage
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
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Leads indexes
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_archived ON leads(is_archived);
CREATE INDEX idx_leads_follow_up ON leads(follow_up_date) WHERE follow_up_date IS NOT NULL AND follow_up_completed = FALSE;
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_stage_updated ON leads(stage_updated_at DESC);

-- Contacts indexes
CREATE INDEX idx_lead_contacts_lead_id ON lead_contacts(lead_id);
CREATE INDEX idx_lead_contacts_stage ON lead_contacts(stage);

-- Activities indexes
CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_stage ON lead_activities(stage);
CREATE INDEX idx_lead_activities_created_at ON lead_activities(created_at DESC);

-- ==========================================
-- FUNCTIONS AND TRIGGERS
-- ==========================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update stage_updated_at when stage changes
CREATE OR REPLACE FUNCTION update_stage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.stage IS DISTINCT FROM NEW.stage THEN
        NEW.stage_updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_leads_updated_at 
    BEFORE UPDATE ON leads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_stage_timestamp 
    BEFORE UPDATE ON leads 
    FOR EACH ROW EXECUTE FUNCTION update_stage_timestamp();

CREATE TRIGGER update_lead_contacts_updated_at 
    BEFORE UPDATE ON lead_contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- SAMPLE STAGE DATA STRUCTURES (for reference)
-- ==========================================

/*
new_lead_data example:
{
  "follow_up_days": 3,
  "priority": "high",
  "source": "job_board"
}

applied_data example:
{
  "application_text": "Dear hiring manager...",
  "cv_text": "My CV content...",
  "cover_letter": "Cover letter text...",
  "application_date": "2024-01-15",
  "files_sent": ["CV.pdf", "Portfolio.pdf"]
}

spoken_data example:
{
  "conversations": [
    {
      "date": "2024-01-16",
      "contact_id": "uuid",
      "notes": "Initial phone screening",
      "sentiment": "positive",
      "next_steps": "Technical interview scheduled"
    }
  ]
}

interview_data example:
{
  "interviews": [
    {
      "date": "2024-01-20",
      "time": "14:00",
      "location": "Office Amsterdam",
      "contact_id": "uuid",
      "type": "technical",
      "summary": "Discussed React experience",
      "rating": 8,
      "calendar_event_id": "google_cal_123"
    }
  ]
}

denied_data example:
{
  "reason": "Not enough experience",
  "feedback": "Great candidate but looking for more senior",
  "date": "2024-01-22",
  "lessons_learned": "Need to highlight senior projects more"
}

success_data example:
{
  "offer_amount": 75000,
  "start_date": "2024-02-01",
  "contract_type": "permanent",
  "celebration_notes": "Dream job achieved!"
}
*/

-- ==========================================
-- USEFUL QUERIES (for development/debugging)
-- ==========================================

-- Get all leads for a user with latest activity
-- SELECT l.*, la.content as latest_activity 
-- FROM leads l 
-- LEFT JOIN lead_activities la ON l.id = la.lead_id 
-- WHERE l.user_id = 'user-uuid' 
-- ORDER BY la.created_at DESC;

-- Get leads needing follow-up
-- SELECT * FROM leads 
-- WHERE follow_up_date <= NOW() 
-- AND follow_up_completed = FALSE 
-- AND is_archived = FALSE;

-- ==========================================
-- SETUP COMPLETE!
-- ==========================================
-- Your leads kanban board database is ready for:
-- ✅ User-specific lead pipelines
-- ✅ Drag & drop stage management
-- ✅ Rich stage-specific data
-- ✅ Contact management
-- ✅ Activity tracking
-- ✅ Follow-up reminders
-- ✅ Archive functionality
-- ✅ Performance optimized
-- ========================================== 