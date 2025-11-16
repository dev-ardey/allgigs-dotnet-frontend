import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { LeadStage, LeadsResponse } from '../../types/leads';

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;

    // Get user from auth header
    const authHeader = req.headers['authorization'];
    const jwt = authHeader?.replace('Bearer ', '');

    if (!jwt) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
        const { data: userData, error: authError } = await supabase.auth.getUser(jwt);

        if (authError || !userData?.user) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        const user_id = userData.user.id;

        switch (method) {
            case 'GET':
                return await getLeads(req, res, user_id);
            case 'POST':
                return await createLead(req, res, user_id);
            case 'PUT':
                return await updateLead(req, res, user_id);
            case 'DELETE':
                return await deleteLead(req, res, user_id);
            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
                return res.status(405).json({ error: `Method ${method} Not Allowed` });
        }
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// ==========================================
// GET LEADS
// ==========================================
async function getLeads(req: NextApiRequest, res: NextApiResponse, user_id: string) {
    const { archived = 'false', stage, search } = req.query;

    try {
        let query = supabase
            .from('leads')
            .select(`
        *,
        contacts:lead_contacts(*),
        activities:lead_activities(*)
      `)
            .eq('user_id', user_id)
            .eq('is_archived', archived === 'true')
            .order('stage_updated_at', { ascending: false });

        // Filter by stage if provided
        if (stage && stage !== 'all') {
            query = query.eq('stage', stage);
        }

        // Search functionality
        if (search && typeof search === 'string') {
            query = query.or(`job_title.ilike.%${search}%,company.ilike.%${search}%,notes.ilike.%${search}%`);
        }

        const { data: leads, error } = await query;

        if (error) {
            console.error('Error fetching leads:', error);
            return res.status(500).json({ error: 'Failed to fetch leads' });
        }

        // Get archived count for stats
        const { count: archived_count } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user_id)
            .eq('is_archived', true);

        const response: LeadsResponse = {
            leads: leads || [],
            total: leads?.length || 0,
            archived_count: archived_count || 0
        };

        return res.status(200).json(response);
    } catch (error) {
        console.error('Error in getLeads:', error);
        return res.status(500).json({ error: 'Failed to fetch leads' });
    }
}

// ==========================================
// CREATE LEAD (from clicked job)
// ==========================================
async function createLead(req: NextApiRequest, res: NextApiResponse, user_id: string) {
    const {
        job_unique_id,
        job_title,
        company,
        location,
        rate,
        job_url,
        job_summary
    } = req.body;

    // Validate required fields
    if (!job_unique_id || !job_title || !company) {
        return res.status(400).json({
            error: 'Missing required fields: job_unique_id, job_title, company'
        });
    }

    try {
        // Check if lead already exists for this user and job
        const { data: existingLead } = await supabase
            .from('leads')
            .select('id, stage')
            .eq('user_id', user_id)
            .eq('job_unique_id', job_unique_id)
            .single();

        if (existingLead) {
            return res.status(200).json({
                lead: existingLead,
                success: true,
                message: 'Lead already exists'
            });
        }

        // Create new lead
        const newLead = {
            user_id,
            job_unique_id,
            job_title,
            company,
            location,
            rate,
            job_url,
            job_summary,
            stage: 'new_lead' as LeadStage,
            is_archived: false,
            new_lead_data: {
                follow_up_days: 3,
                priority: 'medium',
                source: 'job_board'
            },
            applied_data: {},
            spoken_data: { conversations: [] as any[] },
            interview_data: { interviews: [] as any[] },
            denied_data: {},
            success_data: {},
            follow_up_completed: false
        };

        const { data: lead, error } = await supabase
            .from('leads')
            .insert([newLead])
            .select()
            .single();

        if (error) {
            console.error('Error creating lead:', error);
            return res.status(500).json({ error: 'Failed to create lead' });
        }

        // Log activity
        await supabase
            .from('lead_activities')
            .insert([{
                lead_id: lead.id,
                stage: 'new_lead',
                activity_type: 'stage_moved',
                content: 'Lead created from job click',
                created_by: user_id
            }]);

        return res.status(201).json({
            lead,
            success: true,
            message: 'Lead created successfully'
        });

    } catch (error) {
        console.error('Error in createLead:', error);
        return res.status(500).json({ error: 'Failed to create lead' });
    }
}

// ==========================================
// UPDATE LEAD
// ==========================================
async function updateLead(req: NextApiRequest, res: NextApiResponse, user_id: string) {
    const { id } = req.query;
    const updates = req.body;

    if (!id) {
        return res.status(400).json({ error: 'Lead ID is required' });
    }

    try {
        // Verify lead belongs to user
        const { data: existingLead } = await supabase
            .from('leads')
            .select('*')
            .eq('id', id)
            .eq('user_id', user_id)
            .single();

        if (!existingLead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        // Update lead
        const { data: lead, error } = await supabase
            .from('leads')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user_id)
            .select()
            .single();

        if (error) {
            console.error('Error updating lead:', error);
            return res.status(500).json({ error: 'Failed to update lead' });
        }

        // Log activity if stage changed
        if (updates.stage && updates.stage !== existingLead.stage) {
            await supabase
                .from('lead_activities')
                .insert([{
                    lead_id: lead.id,
                    stage: updates.stage,
                    activity_type: 'stage_moved',
                    content: `Moved from ${existingLead.stage} to ${updates.stage}`,
                    created_by: user_id
                }]);
        }

        return res.status(200).json({
            lead,
            success: true,
            message: 'Lead updated successfully'
        });

    } catch (error) {
        console.error('Error in updateLead:', error);
        return res.status(500).json({ error: 'Failed to update lead' });
    }
}

// ==========================================
// DELETE LEAD
// ==========================================
async function deleteLead(req: NextApiRequest, res: NextApiResponse, user_id: string) {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'Lead ID is required' });
    }

    try {
        // Verify lead belongs to user
        const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('id', id)
            .eq('user_id', user_id)
            .single();

        if (!existingLead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        // Delete lead (cascades to contacts and activities)
        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', id)
            .eq('user_id', user_id);

        if (error) {
            console.error('Error deleting lead:', error);
            return res.status(500).json({ error: 'Failed to delete lead' });
        }

        return res.status(200).json({
            success: true,
            message: 'Lead deleted successfully'
        });

    } catch (error) {
        console.error('Error in deleteLead:', error);
        return res.status(500).json({ error: 'Failed to delete lead' });
    }
} 