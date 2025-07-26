-- Future Features Table Setup
-- Run this in your Supabase SQL editor

-- Create future_features table
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

-- Enable RLS on future_features table
ALTER TABLE future_features ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own future features
CREATE POLICY "Users can view own future features" ON future_features
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own future features
CREATE POLICY "Users can insert own future features" ON future_features
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own future features
CREATE POLICY "Users can update own future features" ON future_features
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own future features
CREATE POLICY "Users can delete own future features" ON future_features
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_future_features_updated_at 
    BEFORE UPDATE ON future_features 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 