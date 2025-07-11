import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { ArchiveResponse } from '../../../types/leads';

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
                return await getArchivedLeads(req, res, user_id);
            case 'POST':
                return await archiveLead(req, res, user_id);
            case 'PUT':
                return await unarchiveLead(req, res, user_id);
            default:
                res.setHeader('Allow', ['GET', 'POST', 'PUT']);
                return res.status(405).json({ error: `Method ${method} Not Allowed` });
        }
    } catch (error) {
        console.error('Archive API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// ==========================================
// GET ARCHIVED LEADS
// ==========================================
async function getArchivedLeads(req: NextApiRequest, res: NextApiResponse, user_id: string) {
    const { search } = req.query;

    try {
        let query = supabase
            .from('leads')
            .select(`
        *,
        contacts:lead_contacts(*),
        activities:lead_activities(*)
      `)
            .eq('user_id', user_id)
            .eq('is_archived', true)
            .order('updated_at', { ascending: false });

        // Search functionality
        if (search && typeof search === 'string') {
            query = query.or(`job_title.ilike.%${search}%,company.ilike.%${search}%,notes.ilike.%${search}%`);
        }

        const { data: leads, error } = await query;

        if (error) {
            console.error('Error fetching archived leads:', error);
            return res.status(500).json({ error: 'Failed to fetch archived leads' });
        }

        const response: ArchiveResponse = {
            archived_leads: leads || [],
            total: leads?.length || 0
        };

        return res.status(200).json(response);
    } catch (error) {
        console.error('Error in getArchivedLeads:', error);
        return res.status(500).json({ error: 'Failed to fetch archived leads' });
    }
}

// ==========================================
// ARCHIVE LEAD
// ==========================================
async function archiveLead(req: NextApiRequest, res: NextApiResponse, user_id: string) {
    const { lead_id } = req.body;

    if (!lead_id) {
        return res.status(400).json({ error: 'Lead ID is required' });
    }

    try {
        // Verify lead belongs to user and is in denied stage
        const { data: existingLead } = await supabase
            .from('leads')
            .select('id, stage, is_archived')
            .eq('id', lead_id)
            .eq('user_id', user_id)
            .single();

        if (!existingLead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        if (existingLead.stage !== 'denied') {
            return res.status(400).json({
                error: 'Only denied leads can be archived'
            });
        }

        if (existingLead.is_archived) {
            return res.status(400).json({
                error: 'Lead is already archived'
            });
        }

        // Archive the lead
        const { data: lead, error } = await supabase
            .from('leads')
            .update({ is_archived: true })
            .eq('id', lead_id)
            .eq('user_id', user_id)
            .select()
            .single();

        if (error) {
            console.error('Error archiving lead:', error);
            return res.status(500).json({ error: 'Failed to archive lead' });
        }

        // Log activity
        await supabase
            .from('lead_activities')
            .insert([{
                lead_id: lead.id,
                stage: 'denied',
                activity_type: 'note',
                content: 'Lead archived',
                created_by: user_id
            }]);

        return res.status(200).json({
            lead,
            success: true,
            message: 'Lead archived successfully'
        });

    } catch (error) {
        console.error('Error in archiveLead:', error);
        return res.status(500).json({ error: 'Failed to archive lead' });
    }
}

// ==========================================
// UNARCHIVE LEAD
// ==========================================
async function unarchiveLead(req: NextApiRequest, res: NextApiResponse, user_id: string) {
    const { lead_id } = req.body;

    if (!lead_id) {
        return res.status(400).json({ error: 'Lead ID is required' });
    }

    try {
        // Verify lead belongs to user and is archived
        const { data: existingLead } = await supabase
            .from('leads')
            .select('id, is_archived')
            .eq('id', lead_id)
            .eq('user_id', user_id)
            .single();

        if (!existingLead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        if (!existingLead.is_archived) {
            return res.status(400).json({
                error: 'Lead is not archived'
            });
        }

        // Unarchive the lead
        const { data: lead, error } = await supabase
            .from('leads')
            .update({ is_archived: false })
            .eq('id', lead_id)
            .eq('user_id', user_id)
            .select()
            .single();

        if (error) {
            console.error('Error unarchiving lead:', error);
            return res.status(500).json({ error: 'Failed to unarchive lead' });
        }

        // Log activity
        await supabase
            .from('lead_activities')
            .insert([{
                lead_id: lead.id,
                stage: lead.stage,
                activity_type: 'note',
                content: 'Lead unarchived',
                created_by: user_id
            }]);

        return res.status(200).json({
            lead,
            success: true,
            message: 'Lead unarchived successfully'
        });

    } catch (error) {
        console.error('Error in unarchiveLead:', error);
        return res.status(500).json({ error: 'Failed to unarchive lead' });
    }
} 