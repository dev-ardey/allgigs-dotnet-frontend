-- RLS Policies for email_notifications table
-- Run this in your Supabase SQL editor

-- Enable RLS on email_notifications table if not already enabled
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own email notification settings
CREATE POLICY "Users can view own email notifications" ON email_notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own email notification settings
CREATE POLICY "Users can insert own email notifications" ON email_notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own email notification settings
CREATE POLICY "Users can update own email notifications" ON email_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own email notification settings
CREATE POLICY "Users can delete own email notifications" ON email_notifications
    FOR DELETE USING (auth.uid() = user_id); 