import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import {
    Search,
    Users,
    Calendar,
    Trophy,
    Archive,
    Bell,
    Filter,
    MoreVertical,
    Target,
    MessageCircle,
    CheckCircle
} from 'lucide-react';
import { Lead, LeadStage, KanbanColumn, LeadsResponse } from '../../types/leads';
import { supabase } from '../../SupabaseClient';
import LeadCard from './LeadCard';
import LeadDetailModal from './LeadDetailModal';
import ArchiveModal from './ArchiveModal';
import InterviewPrepModal from './InterviewPrepModal';

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
    const [showPrepModal, setShowPrepModal] = useState(false);

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
        found: {
            title: 'Found',
            icon: <Target style={{ width: '16px', height: '16px' }} />,
            color: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgba(59, 130, 246, 0.4)',
            description: 'Recently clicked jobs to pursue'
        },
        connect: {
            title: 'Connect',
            icon: <MessageCircle style={{ width: '16px', height: '16px' }} />,
            color: 'rgba(245, 158, 11, 0.2)',
            borderColor: 'rgba(245, 158, 11, 0.4)',
            description: 'Interview and preparation phase'
        },
        close: {
            title: 'Close',
            icon: <CheckCircle style={{ width: '16px', height: '16px' }} />,
            color: 'rgba(34, 197, 94, 0.2)',
            borderColor: 'rgba(34, 197, 94, 0.4)',
            description: 'Final decision and outcomes'
        }
    }), []);

    // ==========================================
    // MOCK DATA GENERATOR
    // ==========================================
    const generateMockLeads = useCallback((): Lead[] => {
        const mockJobs = [
            {
                id: 'lead-1',
                job_title: 'Senior Frontend Developer',
                company: 'TechCorp Amsterdam',
                location: 'Amsterdam, Netherlands',
                rate: '€65-85/hour',
                job_url: 'https://example.com/job1',
                stage: 'found' as LeadStage,
                possible_earnings: 85000,
                match_percentage: 92,
                normal_rate: 75000
            },
            {
                id: 'lead-2',
                job_title: 'React Developer',
                company: 'StartupXYZ',
                location: 'Remote',
                rate: '€55-70/hour',
                job_url: 'https://example.com/job2',
                stage: 'found' as LeadStage,
                possible_earnings: 68000,
                match_percentage: 78,
                normal_rate: 75000
            },
            {
                id: 'lead-3',
                job_title: 'Full Stack Developer',
                company: 'InnovateTech',
                location: 'Utrecht, Netherlands',
                rate: '€70-90/hour',
                job_url: 'https://example.com/job3',
                stage: 'connect' as LeadStage,
                possible_earnings: 88000,
                match_percentage: 85,
                normal_rate: 75000
            },
            {
                id: 'lead-4',
                job_title: 'Vue.js Developer',
                company: 'WebSolutions',
                location: 'Rotterdam, Netherlands',
                rate: '€60-80/hour',
                job_url: 'https://example.com/job4',
                stage: 'close' as LeadStage,
                possible_earnings: 78000,
                match_percentage: 88,
                normal_rate: 75000
            }
        ];

        return mockJobs.map(job => ({
            id: job.id,
            user_id: user?.id || 'mock-user',
            job_unique_id: `job-${job.id}`,
            job_title: job.job_title,
            company: job.company,
            location: job.location,
            rate: job.rate,
            job_url: job.job_url,
            job_summary: `Exciting opportunity at ${job.company} for a ${job.job_title} position.`,
            stage: job.stage,
            is_archived: false,
            created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            stage_updated_at: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
            notes: '',
            follow_up_date: null,
            follow_up_completed: false,

            // Stage-specific data
            found_data: job.stage === 'found' ? {
                match_percentage: job.match_percentage,
                possible_earnings: job.possible_earnings,
                above_normal_rate: job.possible_earnings > job.normal_rate,
                normal_rate: job.normal_rate,
                applied: Math.random() > 0.7,
                follow_up_days: 3,
                follow_up_timer_started: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString() : undefined,
                follow_up_overdue: Math.random() > 0.8,
                priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
                source: 'job_board',
                initial_notes: 'Looks promising, good match for skills'
            } : {
                match_percentage: job.match_percentage,
                possible_earnings: job.possible_earnings,
                above_normal_rate: job.possible_earnings > job.normal_rate,
                normal_rate: job.normal_rate,
                applied: false,
                priority: 'medium' as 'low' | 'medium' | 'high'
            },

            connect_data: job.stage === 'connect' ? {
                interview_date: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                interview_time: '14:00',
                interview_with: 'Sarah Johnson, Lead Developer',
                interview_notes: 'Technical interview focusing on React and TypeScript',
                interview_rating: Math.random() > 0.5 ? 'thumbs_up' : 'thumbs_down',
                prepped: Math.random() > 0.6,
                prep_data: {
                    introduction: 'I am a passionate frontend developer with 5 years of experience...',
                    company_fit: 'I align with your mission to create innovative web solutions...',
                    role_description: 'As a senior frontend developer, I would focus on...',
                    colleagues: [
                        {
                            id: 'colleague-1',
                            name: 'Sarah Johnson',
                            email: 'sarah.johnson@company.com',
                            linkedin: 'https://linkedin.com/in/sarahjohnson',
                            role: 'Lead Developer'
                        }
                    ],
                    company_mission: 'To revolutionize web development through innovative solutions',
                    completed: Math.random() > 0.5
                }
            } : {
                prepped: false
            },

            close_data: job.stage === 'close' ? {
                got_job: undefined, // Will be set when user clicks YES/NO
                possible_revenue: job.possible_earnings,
                negotiation_tips: [
                    'Highlight your unique React expertise',
                    'Mention your successful project portfolio',
                    'Discuss long-term collaboration potential'
                ],
                contract_template: 'Standard freelance contract template with your details',
                archived_reason: undefined
            } : {},

            contacts: [],
            activities: []
        }));
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
                const mockLeads = generateMockLeads();

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
    }, [user?.id, searchTerm, stageFilter, fetchRecentlyClickedJobs, generateMockLeads]);

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
    // STAGE ACTION HANDLERS
    // ==========================================
    const handleStageAction = async (leadId: string, action: string, data?: any) => {
        const leadIndex = leads.findIndex(lead => lead.id === leadId);
        if (leadIndex === -1) return;

        const updatedLeads = [...leads];
        const lead = { ...updatedLeads[leadIndex] };

        switch (action) {
            case 'applied':
                if (data.applied) {
                    // User clicked YES - start follow-up timer
                    lead.found_data = {
                        ...lead.found_data,
                        applied: true,
                        follow_up_timer_started: new Date().toISOString(),
                        follow_up_days: 3
                    };
                } else {
                    // User clicked NO - remove lead from pipeline
                    updatedLeads.splice(leadIndex, 1);
                    setLeads(updatedLeads);
                    return;
                }
                break;

            case 'follow_up_complete':
                if (data.completed) {
                    // Start next follow-up timer
                    lead.found_data = {
                        ...lead.found_data,
                        follow_up_timer_started: new Date().toISOString(),
                        follow_up_days: 3,
                        follow_up_overdue: false
                    };
                } else {
                    // Mark as losing opportunity
                    lead.found_data = {
                        ...lead.found_data,
                        follow_up_overdue: true
                    };
                }
                break;

            case 'invited_to_interview':
                // Move to connect stage
                lead.stage = 'connect';
                lead.stage_updated_at = new Date().toISOString();
                lead.connect_data = {
                    ...lead.connect_data,
                    interview_date: '',
                    interview_time: '',
                    interview_with: '',
                    interview_notes: '',
                    interview_rating: null,
                    prepped: false
                };
                break;

            case 'prep_toggle':
                // Toggle prep status - if false, show prep questionnaire
                lead.connect_data = {
                    ...lead.connect_data,
                    prepped: !lead.connect_data.prepped
                };
                break;

            case 'open_prep_modal':
                // Open prep modal for the selected lead
                setSelectedLead(lead);
                setShowPrepModal(true);
                return;

            case 'got_job':
                lead.close_data = {
                    ...lead.close_data,
                    got_job: data.gotJob
                };

                if (data.gotJob) {
                    // Show success content
                    lead.close_data = {
                        ...lead.close_data,
                        possible_revenue: lead.found_data.possible_earnings,
                        negotiation_tips: [
                            'Highlight your unique expertise',
                            'Mention your successful project portfolio',
                            'Discuss long-term collaboration potential'
                        ],
                        contract_template: 'Standard freelance contract template with your details'
                    };
                } else {
                    // Show missed opportunity content
                    lead.close_data = {
                        ...lead.close_data,
                        possible_revenue: lead.found_data.possible_earnings,
                        missed_revenue: lead.found_data.possible_earnings,
                        analysis_tips: [
                            'Review your interview performance',
                            'Strengthen your portfolio presentation',
                            'Practice common interview questions'
                        ]
                    };
                }
                break;

            case 'update_lead':
                // Direct lead update from prep modal
                updatedLeads[leadIndex] = data.lead;
                setLeads(updatedLeads);
                return;

            case 'interview_rating':
                // Update interview rating
                lead.connect_data = {
                    ...lead.connect_data,
                    interview_rating: data.rating
                };
                break;

            case 'update_notes':
                // Update notes
                lead.notes = data.notes;
                break;

            default:
                return;
        }

        updatedLeads[leadIndex] = lead;
        setLeads(updatedLeads);
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
                                                                onStageAction={(action, data) => handleStageAction(lead.id, action, data)}
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

            {showPrepModal && selectedLead && (
                <InterviewPrepModal
                    lead={selectedLead}
                    onClose={() => {
                        setShowPrepModal(false);
                        setSelectedLead(null);
                    }}
                    onUpdate={(updatedLead) => {
                        handleStageAction(updatedLead.id, 'update_lead', { lead: updatedLead });
                        setShowPrepModal(false);
                        setSelectedLead(null);
                    }}
                />
            )}
        </div>
    );
};

export default LeadsPipeline; 