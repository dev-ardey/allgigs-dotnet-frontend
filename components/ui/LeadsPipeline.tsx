import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import {
    Search,
    Archive,
    Bell,
    Target,
    MessageCircle,
    CheckCircle,
    Users,
    CircleCheckBig
} from 'lucide-react';
import { Lead, LeadStage, KanbanColumn, LeadsResponse } from '../../types/leads';
import { supabase } from '../../SupabaseClient';
import LeadCard from './LeadCard';
import ArchiveModal from './ArchiveModal';
import InterviewPrepModal from './InterviewPrepModal';

interface LeadsPipelineProps {
    user?: any;
}

// Extended interface for our combined data
interface JobClickWithApplying {
    id: string;
    user_id: string;
    job_id: string;
    job_title: string;
    clicked_at: string;
    search_pills: string[];
    company: string;
    location: string;
    rate: string;
    date_posted: string;
    summary: string;
    url: string;
    applying?: {
        applying_id: string;
        created_at: string;
        applied: boolean;
        receive_confirmation: boolean;
        recruiter_interview: string | null;
        interview_rating_recruiter: boolean | null;
        hiringmanager_interview: string | null;
        interview_rating_hiringmanager: boolean | null;
        technical_interview: string | null;
        interview_rating_technical: boolean | null;
        got_the_job: boolean | null;
        starting_date: string | null;
        notes: string | null;
        value_rate: number | null;
        value_hour_per_week: string | null;
        value_weeks: number | null;
        unique_id_job: string;
    } | null;
}

const LeadsPipeline: React.FC<LeadsPipelineProps> = ({ user }) => {
    // ==========================================
    // STATE MANAGEMENT
    // ==========================================
    const [leads, setLeads] = useState<JobClickWithApplying[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [databaseAvailable, setDatabaseAvailable] = useState(false);

    // Modal states
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [showPrepModal, setShowPrepModal] = useState(false);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [stageFilter, setStageFilter] = useState<LeadStage | 'all'>('all');
    const [allCollapsed, setAllCollapsed] = useState(false);

    // Collapse/Expand all handlers
    const handleCollapseAll = async () => {
        try {
            // Update all leads in applying table
            const { error: applyingError } = await supabase
                .from('applying')
                .update({ collapsed_card: true })
                .eq('user_id', user?.id);

            if (applyingError) throw applyingError;

            // Update all leads in job_clicks table (Found jobs)
            const { error: jobClicksError } = await supabase
                .from('job_clicks')
                .update({ collapsed_job_click_card: true })
                .eq('user_id', user?.id);

            if (jobClicksError) throw jobClicksError;

            // Update local state
            setLeads(prevLeads =>
                prevLeads.map(lead => ({
                    ...lead,
                    collapsed_job_click_card: true, // Update job_clicks collapsed_job_click_card
                    applying: lead.applying ? { ...lead.applying, collapsed_card: true } : null
                }))
            );

            setAllCollapsed(true);
        } catch (err: any) {
            console.error('Error collapsing all:', err);
        }
    };

    const handleExpandAll = async () => {
        try {
            // Update all leads in applying table
            const { error: applyingError } = await supabase
                .from('applying')
                .update({ collapsed_card: false })
                .eq('user_id', user?.id);

            if (applyingError) throw applyingError;

            // Update all leads in job_clicks table (Found jobs)
            const { error: jobClicksError } = await supabase
                .from('job_clicks')
                .update({ collapsed_job_click_card: false })
                .eq('user_id', user?.id);

            if (jobClicksError) throw jobClicksError;

            // Update local state
            setLeads(prevLeads =>
                prevLeads.map(lead => ({
                    ...lead,
                    collapsed_job_click_card: false, // Update job_clicks collapsed_job_click_card
                    applying: lead.applying ? { ...lead.applying, collapsed_card: false } : null
                }))
            );

            setAllCollapsed(false);
        } catch (err: any) {
            console.error('Error expanding all:', err);
        }
    };

    // Follow-up notifications
    const [followUpNotifications, setFollowUpNotifications] = useState<JobClickWithApplying[]>([]);

    // Archive stats
    const [archivedCount, setArchivedCount] = useState(0);

    // ==========================================
    // STAGE CONFIGURATION (AANGEPAST VOOR NIEUWE DATA)
    // ==========================================
    const stageConfig = useMemo(() => ({
        found: {
            title: 'Found',
            icon: <Target style={{ width: '16px', height: '16px' }} />,
            color: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgba(59, 130, 246, 0.4)',
            description: 'Recently clicked jobs to pursue'
        },
        connect: {
            title: 'Connect',
            icon: <Users style={{ width: '16px', height: '16px' }} />,
            color: 'rgba(245, 158, 11, 0.2)',
            borderColor: 'rgba(245, 158, 11, 0.4)',
            description: 'Jobs you have applied to and are in process'
        },
        close: {
            title: 'Closed',
            icon: <CircleCheckBig style={{ width: '16px', height: '16px' }} />,
            color: 'rgba(16, 185, 129, 0.2)',
            borderColor: 'rgba(16, 185, 129, 0.4)',
            description: 'Jobs with completed interviews'
        }
    }), []);

    // ==========================================
    // ORGANIZE LEADS INTO COLUMNS (NIEUWE LOGICA)
    // ==========================================
    const organizedColumns = useMemo(() => {
        // Filter leads based on search term
        const filteredLeads = leads.filter(lead => {
            if (!searchTerm) return true;
            const searchLower = searchTerm.toLowerCase();
            return (
                lead.job_title?.toLowerCase().includes(searchLower) ||
                lead.company?.toLowerCase().includes(searchLower) ||
                lead.location?.toLowerCase().includes(searchLower)
            );
        });

        // Found column: job_clicks without applying record (or applied = false)
        const foundLeads = filteredLeads.filter(lead => !lead.applying || !lead.applying.applied);

        // Connect column: job_clicks with applying record and applied = true, but no interviews yet
        const connectLeads = filteredLeads.filter(lead =>
            lead.applying &&
            lead.applying.applied &&
            !lead.applying.recruiter_interview &&
            !lead.applying.technical_interview &&
            !lead.applying.hiringmanager_interview
        );

        // Close column: jobs with at least one completed interview
        const closeLeads = filteredLeads.filter(lead =>
            lead.applying &&
            lead.applying.applied &&
            (lead.applying.recruiter_interview ||
                lead.applying.technical_interview ||
                lead.applying.hiringmanager_interview)
        );

        return [
            {
                id: 'found' as LeadStage,
                title: 'Found',
                leads: foundLeads,
                color: stageConfig.found.color,
                icon: stageConfig.found.icon
            },
            {
                id: 'connect' as LeadStage,
                title: 'Connect',
                leads: connectLeads,
                color: stageConfig.connect.color,
                icon: stageConfig.connect.icon
            },
            {
                id: 'close' as LeadStage,
                title: 'Closed',
                leads: closeLeads,
                color: stageConfig.close.color,
                icon: stageConfig.close.icon
            }
        ];
    }, [leads, searchTerm, stageFilter, stageConfig]);

    // ==========================================
    // DATA FETCHING (NIEUW: job_clicks + applying)
    // ==========================================
    const fetchLeads = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        setError(null);
        try {
            // 1. Haal alle job_clicks op voor deze user
            const { data: clicks, error: clicksError } = await supabase
                .from('job_clicks')
                .select('*')
                .eq('user_id', user.id)
                .order('clicked_at', { ascending: false });
            if (clicksError) throw clicksError;

            // 2. Haal alle applying records op voor deze user
            const { data: applying, error: applyingError } = await supabase
                .from('applying')
                .select('*')
                .eq('user_id', user.id);
            if (applyingError) throw applyingError;

            // 3. Combineer per job_id/unique_id_job
            // Map: unique_id_job (applying) <-> id (job_clicks) - niet job_id!
            const leadsData = clicks.map(job => {
                const apply = applying.find(a => a.unique_id_job === job.id);
                return {
                    ...job,
                    applying: apply || null
                };
            });
            setLeads(leadsData);
            setDatabaseAvailable(true);
        } catch (err: any) {
            setError(err.message || 'Error fetching leads');
            setLeads([]);
            setDatabaseAvailable(false);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    // ==========================================
    // USE EFFECT: FETCH LEADS BIJ LOAD
    // ==========================================
    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    // ==========================================
    // DRAG & DROP HANDLERS
    // ==========================================
    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        // Dropped outside the list
        if (!destination) return;

        // Dropped in the same position
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const leadId = draggableId;
        const newStage = destination.droppableId as LeadStage;
        const lead = leads.find(l => l.id === leadId);

        if (!lead) return;

        // Update local state immediately for smooth UX
        setLeads(prevLeads =>
            prevLeads.map(l =>
                l.id === leadId ? {
                    ...l,
                    stage: newStage,
                    stage_updated_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                } : l
            )
        );

        // Update database if available
        if (databaseAvailable) {
            try {
                const { data: session } = await supabase.auth.getSession();
                if (!session?.session?.access_token) {
                    throw new Error('No valid session');
                }

                const response = await fetch('/api/leads', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${session.session.access_token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: leadId,
                        stage: newStage
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to update lead stage');
                }

                console.log(`✅ Moved "${lead.job_title}" from ${lead.stage} to ${newStage} (saved to database)`);
            } catch (error) {
                console.error('Error updating lead stage:', error);
                // Revert local state on error
                setLeads(prevLeads =>
                    prevLeads.map(l =>
                        l.id === leadId ? { ...l, stage: lead.stage } : l
                    )
                );
            }
        } else {
            console.log(`✅ Moved "${lead.job_title}" from ${lead.stage} to ${newStage} (local storage - database not available)`);
        }
    };

    // ==========================================
    // EVENT HANDLERS
    // ==========================================
    const handleLeadUpdate = async (updatedLead: JobClickWithApplying) => {
        setLeads(prevLeads =>
            prevLeads.map(l => l.id === updatedLead.id ? updatedLead : l)
        );

        if (databaseAvailable) {
            await fetchLeads(); // Refresh to get latest data
        }
    };

    const handleArchiveClick = () => {
        setShowArchiveModal(true);
    };

    const markFollowUpComplete = async (leadId: string) => {
        if (databaseAvailable) {
            try {
                const { data: session } = await supabase.auth.getSession();
                if (!session?.session?.access_token) return;

                const response = await fetch('/api/leads', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${session.session.access_token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: leadId,
                        follow_up_completed: true
                    })
                });

                if (response.ok) {
                    setFollowUpNotifications(prev => prev.filter(lead => lead.id !== leadId));
                    await fetchLeads();
                }
            } catch (error) {
                console.error('Error marking follow-up complete:', error);
            }
        } else {
            // Local only
            setFollowUpNotifications(prev => prev.filter(lead => lead.id !== leadId));
            setLeads(prevLeads =>
                prevLeads.map(l =>
                    l.id === leadId ? { ...l, follow_up_completed: true } : l
                )
            );
        }
    };

    // ==========================================
    // APPLY ACTION HANDLER (NIEUWE LOGICA)
    // ==========================================
    const handleApplyAction = async (jobId: string, applied: boolean) => {
        if (!user?.id) return;

        try {
            if (applied) {
                // Create applying record with UUID for applying_id
                const { error } = await supabase
                    .from('applying')
                    .insert([{
                        applying_id: crypto.randomUUID(), // <-- Fix: Generate UUID for applying_id
                        user_id: user.id,
                        unique_id_job: jobId,
                        applied: true,
                        created_at: new Date().toISOString()
                    }]);

                if (error) throw error;
            } else {
                // If applied = false, remove the job from job_clicks (user doesn't want to pursue it)
                const { error } = await supabase
                    .from('job_clicks')
                    .delete()
                    .eq('id', jobId)
                    .eq('user_id', user.id);

                if (error) throw error;
            }

            // Refresh leads
            await fetchLeads();
        } catch (err: any) {
            console.error('Error applying to job:', err);
            setError(err.message || 'Error applying to job');
        }
    };

    // ==========================================
    // INTERVIEW ACTION HANDLER (NIEUWE LOGICA)
    // ==========================================
    const handleInterviewAction = async (applyingId: string, interviewData: {
        type: 'recruiter' | 'technical' | 'hiringmanager';
        date: string;
        rating: boolean;
    }) => {
        try {
            const updateData: any = {};

            // Set the appropriate fields based on interview type
            switch (interviewData.type) {
                case 'recruiter':
                    updateData.recruiter_interview = interviewData.date;
                    updateData.interview_rating_recruiter = interviewData.rating;
                    break;
                case 'technical':
                    updateData.technical_interview = interviewData.date;
                    updateData.interview_rating_technical = interviewData.rating;
                    break;
                case 'hiringmanager':
                    updateData.hiringmanager_interview = interviewData.date;
                    updateData.interview_rating_hiringmanager = interviewData.rating;
                    break;
            }

            const { error } = await supabase
                .from('applying')
                .update(updateData)
                .eq('applying_id', applyingId);

            if (error) throw error;

            // Refresh leads
            await fetchLeads();
        } catch (err: any) {
            console.error('Error updating interview:', err);
            setError(err.message || 'Error updating interview');
        }
    };

    // ==========================================
    // UPDATE APPLYING RECORD (NIEUWE LOGICA)
    // ==========================================
    const handleUpdateApplying = async (applyingId: string, updateData: any) => {
        try {
            const { error } = await supabase
                .from('applying')
                .update(updateData)
                .eq('applying_id', applyingId);

            if (error) throw error;

            // Refresh leads
            await fetchLeads();
        } catch (err: any) {
            console.error('Error updating applying record:', err);
            setError(err.message || 'Error updating record');
        }
    };

    const handleFollowUpComplete = async (applyingId: string) => {
        try {
            const { error } = await supabase
                .from('applying')
                .update({
                    follow_up_completed: true,
                    follow_up_completed_at: new Date().toISOString()
                })
                .eq('applying_id', applyingId);

            if (error) throw error;

            // Refresh leads
            await fetchLeads();
        } catch (err: any) {
            console.error('Error marking follow-up complete:', err);
            setError(err.message || 'Error updating follow-up status');
        }
    };

    const handleGotJob = async (applyingId: string, gotJob: boolean, startingDate?: string) => {
        try {
            const updateData: any = { got_the_job: gotJob };

            if (gotJob && startingDate) {
                updateData.starting_date = startingDate;
            }

            const { error } = await supabase
                .from('applying')
                .update(updateData)
                .eq('applying_id', applyingId);

            if (error) throw error;

            // Refresh leads
            await fetchLeads();
        } catch (err: any) {
            console.error('Error updating got the job status:', err);
            setError(err.message || 'Error updating job status');
        }
    };

    // ==========================================
    // RENDER LOADING STATE
    // ==========================================
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '400px',
                color: '#fff'
            }}>
                <div>Loading your pipeline...</div>
            </div>
        );
    }

    // ==========================================
    // RENDER ERROR STATE
    // ==========================================
    if (error) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '400px',
                color: '#fff',
                textAlign: 'center'
            }}>
                <div style={{ marginBottom: '1rem', color: '#ef4444' }}>
                    Error loading pipeline: {error}
                </div>
                <button
                    onClick={fetchLeads}
                    style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        borderRadius: '8px',
                        color: '#fff',
                        cursor: 'pointer'
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    // ==========================================
    // MAIN RENDER
    // ==========================================
    return (
        <div style={{
            padding: '0',
            minHeight: '100vh',
            color: '#fff'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        margin: '0 0 0.5rem 0',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <Target style={{ width: '32px', height: '32px' }} />
                        Leads Pipeline
                    </h1>
                    <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.7)' }}>
                        Manage your job applications through each stage
                    </p>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={handleArchiveClick}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1rem',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                    >
                        <Archive style={{ width: '16px', height: '16px' }} />
                        Archive ({archivedCount})
                    </button>
                </div>
            </div>



            {/* Follow-up Notifications */}
            {followUpNotifications.length > 0 && (
                <div style={{
                    background: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '12px',
                    padding: '1rem',
                    marginBottom: '2rem'
                }}>
                    <h3 style={{
                        margin: '0 0 0.75rem 0',
                        fontSize: '1rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <Bell style={{ width: '16px', height: '16px' }} />
                        Follow-up Reminders ({followUpNotifications.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {followUpNotifications.map(lead => (
                            <div key={lead.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.5rem 0',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                                <span>
                                    <strong>{lead.job_title}</strong> at {lead.company}
                                </span>
                                <button
                                    onClick={() => markFollowUpComplete(lead.id)}
                                    style={{
                                        padding: '0.25rem 0.5rem',
                                        background: 'rgba(16, 185, 129, 0.2)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        borderRadius: '4px',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    Mark Complete
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search and Filter Bar */}
            <div style={{
                display: 'flex',
                gap: '2rem',
                marginBottom: '2rem',
                alignItems: 'center',
                justifyContent: 'space-between' // Space between search and dropdown
            }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                    <Search style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '16px',
                        height: '16px',
                        color: 'rgba(255, 255, 255, 0.5)'
                    }} />
                    <input
                        type="text"
                        placeholder="Search leads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.875rem'
                        }}
                    />
                </div>

                <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value as LeadStage | 'all')}
                    style={{
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '0.875rem',
                        minWidth: '140px',
                        flexShrink: 0, // Prevent shrinking on mobile
                        marginLeft: '40px'
                    }}
                >
                    <option value="all">All Stages</option>
                    {Object.entries(stageConfig).map(([stage, config]) => (
                        <option key={stage} value={stage}>{config.title}</option>
                    ))}
                </select>

                <div style={{ display: 'flex', gap: 8, marginLeft: '20px' }}>
                    <button
                        onClick={handleCollapseAll}
                        style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        Collapse All
                    </button>
                    <button
                        onClick={handleExpandAll}
                        style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        Expand All
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {leads.length === 0 && !loading && (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: 'rgba(255, 255, 255, 0.7)'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                    <h3 style={{ marginBottom: '0.5rem' }}>No leads yet</h3>
                    <p>
                        Click on some jobs in the search page to see them here as leads
                    </p>
                </div>
            )}

            {/* Kanban Board */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '1.5rem',
                    alignItems: 'start'
                }}>
                    {organizedColumns.map(column => {
                        const config = stageConfig[column.id as LeadStage];
                        return (
                            <Droppable key={column.id} droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        style={{
                                            background: snapshot.isDraggingOver
                                                ? 'rgba(59, 130, 246, 0.15)'
                                                : 'rgba(255, 255, 255, 0.05)',
                                            border: `2px solid ${snapshot.isDraggingOver
                                                ? 'rgba(59, 130, 246, 0.5)'
                                                : 'rgba(255, 255, 255, 0.1)'}`,
                                            borderRadius: '12px',
                                            padding: '1rem',
                                            minHeight: '200px',
                                            maxHeight: '1500px',
                                            overflowY: 'auto',
                                            transition: 'all 0.2s ease',
                                            backdropFilter: 'blur(8px)',
                                            transform: snapshot.isDraggingOver ? 'scale(1.02)' : 'scale(1)'
                                        }}
                                    >
                                        {/* Column Header */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: '1rem',
                                            padding: '0.75rem',
                                            background: config.color,
                                            border: `1px solid ${config.borderColor}`,
                                            borderRadius: '8px'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                {config.icon}
                                                <span style={{
                                                    fontWeight: '600',
                                                    fontSize: '0.875rem'
                                                }}>
                                                    {config.title}
                                                </span>
                                            </div>
                                            <div style={{
                                                background: 'rgba(255, 255, 255, 0.2)',
                                                borderRadius: '12px',
                                                padding: '0.25rem 0.5rem',
                                                fontSize: '0.75rem',
                                                fontWeight: '600'
                                            }}>
                                                {column.leads.length}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {column.leads.map((lead, index) => (
                                                <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            style={{
                                                                ...provided.draggableProps.style,
                                                                // Ensure proper positioning during drag
                                                                zIndex: snapshot.isDragging ? 1000 : 'auto'
                                                            }}
                                                        >
                                                            <LeadCard
                                                                lead={lead}
                                                                index={index}
                                                                isDragging={snapshot.isDragging}
                                                                hasFollowUp={followUpNotifications.some(fu => fu.id === lead.id)}
                                                                onStageAction={(action, data) => {
                                                                    if (action === 'apply') {
                                                                        handleApplyAction(lead.id, data.applied);
                                                                    } else if (action === 'interview_date') {
                                                                        handleInterviewAction(lead.applying?.applying_id || '', data.interviewData);
                                                                    } else if (action === 'interview_rating') {
                                                                        handleInterviewAction(lead.applying?.applying_id || '', data.interviewData);
                                                                    } else if (action === 'update_notes') {
                                                                        handleUpdateApplying(lead.applying?.applying_id || '', { notes: data.notes });
                                                                    } else if (action === 'follow_up_complete') {
                                                                        handleFollowUpComplete(lead.applying?.applying_id || '');
                                                                    } else if (action === 'got_job') {
                                                                        handleGotJob(lead.applying?.applying_id || '', data.gotJob, data.startingDate);
                                                                    } else if (action === 'toggle_collapse') {
                                                                        // Update local state for immediate UI feedback
                                                                        setLeads(prevLeads =>
                                                                            prevLeads.map(l =>
                                                                                l.id === lead.id
                                                                                    ? {
                                                                                        ...l,
                                                                                        collapsed_job_click_card: data.collapsed, // Update job_clicks collapsed_job_click_card
                                                                                        applying: l.applying ? { ...l.applying, collapsed_card: data.collapsed } : null
                                                                                    }
                                                                                    : l
                                                                            )
                                                                        );
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                        </div>
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        );
                    })}
                </div>
            </DragDropContext>

            {/* Modals */}
            {showArchiveModal && (
                <ArchiveModal
                    onClose={() => setShowArchiveModal(false)}
                    user={user}
                    archivedLeads={[]} // Currently no archived leads - will show "0 leads archived"
                    onRestoreLead={(leadId) => {
                        // TODO: Implement restore functionality
                        console.log('Restore lead:', leadId);
                        setShowArchiveModal(false);
                    }}
                    onDeleteLead={(leadId) => {
                        // TODO: Implement delete functionality
                        console.log('Delete lead:', leadId);
                        setShowArchiveModal(false);
                    }}
                />
            )}

            {showPrepModal && (
                <InterviewPrepModal
                    onClose={() => {
                        setShowPrepModal(false);
                    }}
                    onUpdate={(updatedLead) => {
                        // This handler is now primarily for updating the main lead details,
                        // not the applying record. The applying record update is handled by handleInterviewAction.
                        // For now, we'll just close the modal.
                        setShowPrepModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default LeadsPipeline; 