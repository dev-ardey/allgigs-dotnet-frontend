import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import {
    Kanban,
    FileText,
    Phone,
    Calendar,
    XCircle,
    Trophy,
    Archive,
    Plus,
    Bell,
    Search,
    Filter,
    MoreVertical
} from 'lucide-react';
import { Lead, LeadStage, KanbanColumn, LeadsResponse } from '../../types/leads';
import { supabase } from '../../SupabaseClient';
import LeadCard from './LeadCard';
import LeadDetailModal from './LeadDetailModal';
import ArchiveModal from './ArchiveModal';

interface LeadsPipelineProps {
    user?: any;
}

const LeadsPipeline: React.FC<LeadsPipelineProps> = ({ user }) => {
    // ==========================================
    // STATE MANAGEMENT
    // ==========================================
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [databaseAvailable, setDatabaseAvailable] = useState(false);

    // Modal states
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [stageFilter, setStageFilter] = useState<LeadStage | 'all'>('all');

    // Follow-up notifications
    const [followUpNotifications, setFollowUpNotifications] = useState<Lead[]>([]);

    // Archive stats
    const [archivedCount, setArchivedCount] = useState(0);

    // ==========================================
    // STAGE CONFIGURATION
    // ==========================================
    const stageConfig = useMemo(() => ({
        new_lead: {
            title: 'New Leads',
            icon: <Plus style={{ width: '16px', height: '16px' }} />,
            color: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgba(59, 130, 246, 0.4)',
            description: 'Recently clicked jobs to pursue'
        },
        applied: {
            title: 'Applied',
            icon: <FileText style={{ width: '16px', height: '16px' }} />,
            color: 'rgba(245, 158, 11, 0.2)',
            borderColor: 'rgba(245, 158, 11, 0.4)',
            description: 'Applications sent'
        },
        spoken: {
            title: 'Spoken',
            icon: <Phone style={{ width: '16px', height: '16px' }} />,
            color: 'rgba(139, 69, 189, 0.2)',
            borderColor: 'rgba(139, 69, 189, 0.4)',
            description: 'Initial conversations'
        },
        interview: {
            title: 'Interview',
            icon: <Calendar style={{ width: '16px', height: '16px' }} />,
            color: 'rgba(16, 185, 129, 0.2)',
            borderColor: 'rgba(16, 185, 129, 0.4)',
            description: 'Interview scheduled'
        },
        denied: {
            title: 'Denied',
            icon: <XCircle style={{ width: '16px', height: '16px' }} />,
            color: 'rgba(239, 68, 68, 0.2)',
            borderColor: 'rgba(239, 68, 68, 0.4)',
            description: 'Rejected applications'
        },
        success: {
            title: 'Success',
            icon: <Trophy style={{ width: '16px', height: '16px' }} />,
            color: 'rgba(34, 197, 94, 0.2)',
            borderColor: 'rgba(34, 197, 94, 0.4)',
            description: 'Successful hires'
        }
    }), []);

    // ==========================================
    // MOCK DATA GENERATOR
    // ==========================================
    const generateMockLeadsForOtherStages = useCallback(() => {
        const mockLeads: Lead[] = [
            // Applied stage
            {
                id: 'mock-applied-1',
                user_id: user?.id || 'demo-user',
                job_unique_id: 'mock-job-applied-1',
                job_title: 'Senior React Developer',
                company: 'TechFlow Amsterdam',
                location: 'Amsterdam, NL',
                rate: '€75/hour',
                job_url: 'https://example.com/job1',
                job_summary: 'We are looking for an experienced React developer to join our team. Must have 5+ years of experience with React, TypeScript, and modern web technologies.',
                stage: 'applied' as LeadStage,
                is_archived: false,
                created_at: '2025-01-12T09:00:00Z',
                updated_at: new Date().toISOString(),
                stage_updated_at: '2025-01-13T14:30:00Z',
                notes: 'Applied via LinkedIn, sent custom cover letter',
                new_lead_data: { follow_up_days: 3, priority: 'high', source: 'job_board' },
                applied_data: { application_date: '2025-01-13T14:30:00Z', platform: 'linkedin' },
                spoken_data: { conversations: [] },
                interview_data: { interviews: [] },
                denied_data: {},
                success_data: {},
                follow_up_date: '2025-01-16T14:30:00Z',
                follow_up_completed: false,
                contacts: [],
                activities: []
            },
            {
                id: 'mock-applied-2',
                user_id: user?.id || 'demo-user',
                job_unique_id: 'mock-job-applied-2',
                job_title: 'Frontend Developer',
                company: 'StartupHub Rotterdam',
                location: 'Rotterdam, NL',
                rate: '€65/hour',
                job_url: 'https://example.com/job2',
                job_summary: 'Join our growing startup! We need a frontend developer who loves working in a fast-paced environment.',
                stage: 'applied' as LeadStage,
                is_archived: false,
                created_at: '2025-01-11T16:00:00Z',
                updated_at: new Date().toISOString(),
                stage_updated_at: '2025-01-12T10:15:00Z',
                notes: 'Submitted application through company website',
                new_lead_data: { follow_up_days: 5, priority: 'medium', source: 'job_board' },
                applied_data: { application_date: '2025-01-12T10:15:00Z', platform: 'company_website' },
                spoken_data: { conversations: [] },
                interview_data: { interviews: [] },
                denied_data: {},
                success_data: {},
                follow_up_date: '2025-01-17T10:15:00Z',
                follow_up_completed: false,
                contacts: [],
                activities: []
            },
            // Spoken stage
            {
                id: 'mock-spoken-1',
                user_id: user?.id || 'demo-user',
                job_unique_id: 'mock-job-spoken-1',
                job_title: 'Full Stack Engineer',
                company: 'InnovateLabs Utrecht',
                location: 'Utrecht, NL',
                rate: '€80/hour',
                job_url: 'https://example.com/job3',
                job_summary: 'We are looking for a full-stack engineer with React, Node.js, and PostgreSQL experience.',
                stage: 'spoken' as LeadStage,
                is_archived: false,
                created_at: '2025-01-10T11:00:00Z',
                updated_at: new Date().toISOString(),
                stage_updated_at: '2025-01-14T16:45:00Z',
                notes: 'Had a great phone call with the hiring manager Sarah. Very positive conversation!',
                new_lead_data: { follow_up_days: 3, priority: 'high', source: 'job_board' },
                applied_data: { application_date: '2025-01-11T11:00:00Z', platform: 'linkedin' },
                spoken_data: {
                    conversations: [
                        {
                            date: '2025-01-14T16:45:00Z',
                            contact_id: 'contact-1',
                            notes: 'Initial phone screening went very well',
                            sentiment: 'positive',
                            next_steps: 'Technical interview scheduled for next week'
                        }
                    ]
                },
                interview_data: { interviews: [] },
                denied_data: {},
                success_data: {},
                follow_up_date: '2025-01-18T16:45:00Z',
                follow_up_completed: false,
                contacts: [],
                activities: []
            },
            // Interview stage
            {
                id: 'mock-interview-1',
                user_id: user?.id || 'demo-user',
                job_unique_id: 'mock-job-interview-1',
                job_title: 'Vue.js Developer',
                company: 'WebAgency Pro',
                location: 'Amsterdam, NL',
                rate: '€70/hour',
                job_url: 'https://example.com/job4',
                job_summary: 'Looking for a Vue.js specialist to join our agency team. Experience with Nuxt.js is a plus.',
                stage: 'interview' as LeadStage,
                is_archived: false,
                created_at: '2025-01-09T13:00:00Z',
                updated_at: new Date().toISOString(),
                stage_updated_at: '2025-01-15T09:00:00Z',
                notes: 'Technical interview scheduled for tomorrow at 2 PM!',
                new_lead_data: { follow_up_days: 3, priority: 'high', source: 'job_board' },
                applied_data: { application_date: '2025-01-10T13:00:00Z', platform: 'company_website' },
                spoken_data: { conversations: [] },
                interview_data: {
                    interviews: [
                        {
                            date: '2025-01-16T14:00:00Z',
                            time: '14:00',
                            location: 'Office Amsterdam',
                            contact_id: 'contact-2',
                            type: 'technical',
                            summary: 'Technical interview with the development team',
                            rating: 0,
                            calendar_event_id: 'cal-123'
                        }
                    ]
                },
                denied_data: {},
                success_data: {},
                follow_up_date: '2025-01-16T14:00:00Z',
                follow_up_completed: false,
                contacts: [],
                activities: []
            },
            // Denied stage
            {
                id: 'mock-denied-1',
                user_id: user?.id || 'demo-user',
                job_unique_id: 'mock-job-denied-1',
                job_title: 'Junior Developer',
                company: 'LearningTech',
                location: 'Remote',
                rate: '€45/hour',
                job_url: 'https://example.com/job5',
                job_summary: 'Great opportunity for a junior developer to grow. We provide mentorship and training.',
                stage: 'denied' as LeadStage,
                is_archived: false,
                created_at: '2025-01-08T15:00:00Z',
                updated_at: new Date().toISOString(),
                stage_updated_at: '2025-01-12T10:00:00Z',
                notes: 'They were looking for someone with more experience. Good feedback though!',
                new_lead_data: { follow_up_days: 3, priority: 'low', source: 'job_board' },
                applied_data: { application_date: '2025-01-09T15:00:00Z', platform: 'indeed' },
                spoken_data: { conversations: [] },
                interview_data: { interviews: [] },
                denied_data: {
                    reason: 'Not enough experience',
                    feedback: 'Great candidate but looking for more senior developer',
                    date: '2025-01-12T10:00:00Z',
                    lessons_learned: 'Need to highlight senior projects more in portfolio'
                },
                success_data: {},
                follow_up_completed: true,
                contacts: [],
                activities: []
            },
            // Success stage
            {
                id: 'mock-success-1',
                user_id: user?.id || 'demo-user',
                job_unique_id: 'mock-job-success-1',
                job_title: 'Senior React Developer',
                company: 'DreamJob Inc',
                location: 'Amsterdam, NL',
                rate: '€85/hour',
                job_url: 'https://example.com/job6',
                job_summary: 'Amazing opportunity to work with cutting-edge technology in a great team environment.',
                stage: 'success' as LeadStage,
                is_archived: false,
                created_at: '2025-01-06T12:00:00Z',
                updated_at: new Date().toISOString(),
                stage_updated_at: '2025-01-14T16:00:00Z',
                notes: 'Got the job! Starting next month 🎉',
                new_lead_data: { follow_up_days: 3, priority: 'high', source: 'job_board' },
                applied_data: { application_date: '2025-01-07T12:00:00Z', platform: 'linkedin' },
                spoken_data: { conversations: [] },
                interview_data: { interviews: [] },
                denied_data: {},
                success_data: {
                    offer_amount: 85000,
                    start_date: '2025-02-01',
                    contract_type: 'freelance',
                    celebration_notes: 'Dream job achieved! 🚀'
                },
                follow_up_completed: true,
                contacts: [],
                activities: []
            }
        ];

        return mockLeads;
    }, [user?.id]);

    // ==========================================
    // DATA FETCHING
    // ==========================================
    const fetchRecentlyClickedJobs = useCallback(async () => {
        if (!user?.id) return [];

        try {
            const { data: clicks } = await supabase
                .from("job_clicks")
                .select("job_id, clicked_at")
                .eq("user_id", user.id)
                .order("clicked_at", { ascending: false });

            const jobIds = clicks?.map(c => c.job_id).filter(Boolean);
            const uniqueJobIds = [...new Set(jobIds)];

            if (!uniqueJobIds.length) return [];

            const { data: jobsData } = await supabase
                .from("Allgigs_All_vacancies_NEW")
                .select("UNIQUE_ID, Title, Company, URL, date, Location, Summary, rate")
                .in("UNIQUE_ID", uniqueJobIds);

            const finalJobs = jobsData?.map(job => ({
                ...job,
                clicked_at: clicks?.find(c => c.job_id === job.UNIQUE_ID)?.clicked_at,
            })) ?? [];

            return finalJobs;
        } catch (error) {
            console.error('Error fetching recently clicked jobs:', error);
            return [];
        }
    }, [user?.id]);

    const checkDatabaseAndFetchLeads = useCallback(async () => {
        if (!user?.id) return;

        setLoading(true);
        setError(null);

        try {
            // First check if database tables exist
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.access_token) {
                throw new Error('No valid session');
            }

            const response = await fetch(`/api/leads?archived=false&search=${searchTerm}&stage=${stageFilter}`, {
                headers: {
                    'Authorization': `Bearer ${session.session.access_token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Database is available
                setDatabaseAvailable(true);
                const data: LeadsResponse = await response.json();
                setLeads(data.leads);
                setArchivedCount(data.archived_count || 0);

                // Set up follow-up notifications
                const today = new Date();
                const notifications = data.leads.filter(lead =>
                    lead.follow_up_date &&
                    !lead.follow_up_completed &&
                    new Date(lead.follow_up_date) <= today
                );
                setFollowUpNotifications(notifications);
            } else {
                // Database not available, use recently clicked jobs + mock data
                setDatabaseAvailable(false);
                const recentJobs = await fetchRecentlyClickedJobs();

                // Convert recently clicked jobs to leads (new_lead stage)
                const recentlyClickedLeads: Lead[] = recentJobs.map((job: any) => {
                    const clickedDate = new Date(job.clicked_at || new Date());
                    const followUpDate = new Date(clickedDate);
                    followUpDate.setDate(followUpDate.getDate() + 3); // Follow up in 3 days

                    return {
                        id: job.UNIQUE_ID,
                        user_id: user.id,
                        job_unique_id: job.UNIQUE_ID,
                        job_title: job.Title || 'Untitled Job',
                        company: job.Company || 'Unknown Company',
                        location: job.Location || '',
                        rate: job.rate || '',
                        job_url: job.URL || '',
                        job_summary: job.Summary || '',
                        stage: 'new_lead' as LeadStage,
                        is_archived: false,
                        created_at: job.clicked_at || new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        stage_updated_at: job.clicked_at || new Date().toISOString(),
                        notes: `Clicked on ${new Date(job.clicked_at || new Date()).toLocaleDateString()}`,
                        new_lead_data: {
                            follow_up_days: 3,
                            priority: 'medium',
                            source: 'job_board'
                        },
                        applied_data: {},
                        spoken_data: { conversations: [] },
                        interview_data: { interviews: [] },
                        denied_data: {},
                        success_data: {},
                        follow_up_date: followUpDate.toISOString(),
                        follow_up_completed: false,
                        contacts: [],
                        activities: []
                    };
                });

                // Add mock data for other stages
                const mockLeads = generateMockLeadsForOtherStages();

                // Combine recently clicked jobs with mock data
                const allLeads = [...recentlyClickedLeads, ...mockLeads];

                setLeads(allLeads);
                setArchivedCount(0);

                // Set up follow-up notifications for recently clicked jobs
                const today = new Date();
                const notifications = recentlyClickedLeads.filter(lead =>
                    lead.follow_up_date &&
                    !lead.follow_up_completed &&
                    new Date(lead.follow_up_date) <= today
                );
                setFollowUpNotifications(notifications);
            }

        } catch (err) {
            console.error('Error fetching leads:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch leads');
        } finally {
            setLoading(false);
        }
    }, [user?.id, searchTerm, stageFilter, fetchRecentlyClickedJobs, generateMockLeadsForOtherStages]);

    // ==========================================
    // EFFECTS
    // ==========================================
    useEffect(() => {
        checkDatabaseAndFetchLeads();
    }, [checkDatabaseAndFetchLeads]);

    // ==========================================
    // ORGANIZE LEADS BY STAGE
    // ==========================================
    const organizedColumns = useMemo(() => {
        const filteredLeads = leads.filter(lead => {
            const matchesSearch = searchTerm === '' ||
                lead.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (lead.notes && lead.notes.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStage = stageFilter === 'all' || lead.stage === stageFilter;

            return matchesSearch && matchesStage;
        });

        const columns: KanbanColumn[] = Object.entries(stageConfig).map(([stage, config]) => ({
            id: stage as LeadStage,
            title: config.title,
            leads: filteredLeads.filter(lead => lead.stage === stage),
            color: config.color,
            borderColor: config.borderColor,
            icon: config.icon,
            description: config.description
        }));

        return columns;
    }, [leads, stageConfig, searchTerm, stageFilter]);

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
    const handleLeadClick = (lead: Lead) => {
        setSelectedLead(lead);
        setShowDetailModal(true);
    };

    const handleLeadUpdate = async (updatedLead: Lead) => {
        setLeads(prevLeads =>
            prevLeads.map(l => l.id === updatedLead.id ? updatedLead : l)
        );

        if (databaseAvailable) {
            await checkDatabaseAndFetchLeads(); // Refresh to get latest data
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
                    await checkDatabaseAndFetchLeads();
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
                    onClick={checkDatabaseAndFetchLeads}
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
            padding: '2rem',
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
                        <Kanban style={{ width: '32px', height: '32px' }} />
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
                        const config = stageConfig[column.id];
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
                                                                onClick={() => handleLeadClick(lead)}
                                                                isDragging={snapshot.isDragging}
                                                                hasFollowUp={followUpNotifications.some(n => n.id === lead.id)}
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
            {showDetailModal && selectedLead && (
                <LeadDetailModal
                    lead={selectedLead}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedLead(null);
                    }}
                    onUpdate={handleLeadUpdate}
                />
            )}

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
        </div>
    );
};

export default LeadsPipeline; 