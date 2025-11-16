-- LinkedIn Posts Table Setup
-- Run this in Supabase SQL Editor

-- Create the linkedin_posts table
CREATE TABLE IF NOT EXISTS linkedin_posts (
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

-- Add RLS (Row Level Security) policies
ALTER TABLE linkedin_posts ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read all posts
CREATE POLICY "Allow authenticated users to read linkedin posts" ON linkedin_posts
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy to allow users to insert their own posts
CREATE POLICY "Allow users to insert their own linkedin posts" ON linkedin_posts
    FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- Policy to allow users to update their own posts
CREATE POLICY "Allow users to update their own linkedin posts" ON linkedin_posts
    FOR UPDATE USING (auth.uid() = auth_id);

-- Policy to allow users to delete their own posts
CREATE POLICY "Allow users to delete their own linkedin posts" ON linkedin_posts
    FOR DELETE USING (auth.uid() = auth_id);

-- Insert some test data
INSERT INTO linkedin_posts (auth_id, author_name, post_text, post_urn, keyword_match, probability_freelance_vacancy) VALUES
(
    '79af7f7e-02f0-499b-8fc0-b1cab48751e3', -- Your user ID
    'John Doe',
    'Looking for a talented Frontend Developer to join our team! We need someone with React, TypeScript, and modern web development experience. Remote work available, competitive salary. #frontend #react #typescript #remote #hiring',
    'urn:li:activity:1234567890',
    'frontend,react,typescript',
    0.85
),
(
    '79af7f7e-02f0-499b-8fc0-b1cab48751e3',
    'Jane Smith',
    'Exciting opportunity for a Full Stack Developer! We are building innovative web applications using Next.js, Node.js, and PostgreSQL. Great team, flexible hours, and excellent benefits. #fullstack #nextjs #nodejs #postgresql #hiring',
    'urn:li:activity:1234567891',
    'fullstack,nextjs,nodejs',
    0.92
),
(
    '79af7f7e-02f0-499b-8fc0-b1cab48751e3',
    'Tech Startup',
    'We are hiring a Senior Frontend Engineer! Must have 5+ years experience with React, Vue.js, and modern CSS. We offer equity, remote work, and a great culture. #senior #frontend #react #vue #equity',
    'urn:li:activity:1234567892',
    'senior,frontend,react,vue',
    0.78
),
(
    '79af7f7e-02f0-499b-8fc0-b1cab48751e3',
    'Digital Agency',
    'Looking for a talented UI/UX Designer with frontend development skills! Must know Figma, React, and have a strong portfolio. Remote position with competitive salary. #uiux #designer #figma #react #remote',
    'urn:li:activity:1234567893',
    'uiux,designer,figma,react',
    0.65
),
(
    '79af7f7e-02f0-499b-8fc0-b1cab48751e3',
    'E-commerce Company',
    'Frontend Developer needed! We use React, TypeScript, and Shopify. Great opportunity to work on high-traffic e-commerce sites. Competitive salary and benefits. #frontend #react #typescript #shopify #ecommerce',
    'urn:li:activity:1234567894',
    'frontend,react,typescript,shopify',
    0.88
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_timestamp ON linkedin_posts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_keyword_match ON linkedin_posts USING GIN(to_tsvector('english', keyword_match));
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_post_text ON linkedin_posts USING GIN(to_tsvector('english', post_text)); 