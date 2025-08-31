import React, { useState, useEffect, useCallback, useMemo } from 'react';

import {
    Search,
    Archive,
    Bell,
    Target,
    CheckCircle,
    Users,
    CircleCheckBig,
    BarChart3,
    Mail,
    Zap,
    Sparkles,
    Brain,
    Lock,
    Minimize2,
    Maximize2,
    RefreshCw
} from 'lucide-react';
import { LeadStage } from '../../types/leads';
import { supabase } from '../../SupabaseClient';
import LeadCard from './LeadCard';
import ArchiveModal from './ArchiveModal';
// import InterviewPrepModal from './InterviewPrepModal';
import StatisticsModal from './StatisticsModal';

interface LeadsPipelineProps {
    user?: any;
    statsData?: any[];
}

// Extended interface for our combined data
interface JobClickWithApplying {
    applying_id: string;
    user_id: string;
    unique_id_job: string;
    applied: boolean;
    created_at: string;
    // Job details (now stored in applying table with _clicked suffix)
    job_title_clicked: string;
    company_clicked: string;
    location_clicked: string;
    rate_clicked: string;
    date_posted_clicked: string;
    summary_clicked: string;
    url_clicked: string;
    // Interview fields
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
    priority: string;
    match_percentage: number;
    possible_earnings: number;
    above_normal_rate: boolean;
    follow_up_overdue: boolean;
    collapsed_card?: boolean;
    // Additional fields
    receive_confirmation?: boolean;
    collapsed_job_click_card?: boolean;
    // Follow-up fields
    follow_up_completed?: boolean;
    follow_up_completed_at?: string;
    follow_up_message?: string;
    // Archive fields
    is_archived?: boolean;
    archived_at?: string;
    // Contacts stored as JSON array
    contacts?: Array<{
        id: string;
        name: string;
        phone?: string;
        email?: string;
        created_at: string;
    }>;
    // Interviews stored as JSON array
    interviews?: Array<{
        type: string;
        date: string;
        rating: boolean | null;
        completed: boolean | undefined;
        id: string | undefined;
        created_at: string | undefined;
    }>;
    // Enhanced Features - Prospects Column
    sent_cv?: boolean;
    sent_portfolio?: boolean;
    sent_cover_letter?: boolean;
    // Enhanced Features - Lead Column
    application_time_minutes?: string;
    match_confidence?: boolean;
    received_confirmation?: boolean;
    rejection_reasons_prediction?: string;
    introduced_via_agency?: boolean;
    // Enhanced Features - Opportunity Column
    follow_up_date?: string;
    interview_went_well?: string;
    interview_can_improve?: string;
    offer_rate_alignment?: string;
    prediction_accuracy?: string;
    sent_thank_you_note?: boolean;
    rejection_reason_mentioned?: string;
    why_got_interview?: string;
    // Enhanced Features - Deal Column
    job_start_date?: string;
    contract_signing_date?: string;
    job_hourly_rate?: string;
    hours_per_week?: string;
    job_total_length?: string;
    client_rating?: number;
    payment_interval?: string;
    why_they_loved_you?: string;
    what_you_did_well?: string;
}

const LeadsPipeline: React.FC<LeadsPipelineProps> = ({ user, statsData = [] }) => {
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
    console.log(showPrepModal, setShowPrepModal, "showPrepModal - build fix");
    const [showStatisticsModal, setShowStatisticsModal] = useState(false);

    // Feature states
    const [futureFeatures, setFutureFeatures] = useState({
        marketing: false,
        tooling: false,
        agent: false,
        interview_optimisation: false,
        value_proposition: false
    });

    // Feature popup state
    const [showFeaturePopup, setShowFeaturePopup] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState<string>('');

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [allCollapsed, setAllCollapsed] = useState(false);
    const [showFollowUpOnly, setShowFollowUpOnly] = useState(false);

    console.log('build', allCollapsed, setAllCollapsed, "allCollapsed - build fix");
    // Collapse/Expand all handlers
    const handleCollapseAll = async () => {
        try {
            // Update all leads in applying table
            const { error: applyingError } = await supabase
                .from('applying')
                .update({ collapsed_card: true })
                .eq('user_id', user?.id);

            if (applyingError) throw applyingError;

            // Update local state
            setLeads(prevLeads =>
                prevLeads.map(lead => ({
                    ...lead,
                    collapsed_card: true
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

            // Update local state
            setLeads(prevLeads =>
                prevLeads.map(lead => ({
                    ...lead,
                    collapsed_card: false
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
    console.log(archivedCount, setArchivedCount, "archivedCount - build fix");

    // ==========================================
    // STAGE CONFIGURATION (AANGEPAST VOOR NIEUWE DATA)
    // ==========================================
    const stageConfig = useMemo(() => ({
        found: {
            title: 'Prospects',
            icon: <Target style={{ width: '16px', height: '16px' }} />,
            color: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgba(59, 130, 246, 0.4)',
            description: 'Recently clicked jobs to pursue'
        },
        lead: {
            title: 'Lead',
            icon: <Users style={{ width: '16px', height: '16px' }} />,
            color: 'rgba(147, 51, 234, 0.2)',
            borderColor: 'rgba(147, 51, 234, 0.4)',
            description: 'Jobs you have applied to'
        },
        opportunity: {
            title: 'Opportunity',
            icon: <Zap style={{ width: '16px', height: '16px' }} />,
            color: 'rgba(245, 158, 11, 0.2)',
            borderColor: 'rgba(245, 158, 11, 0.4)',
            description: 'Jobs with interviews in process'
        },
        deal: {
            title: 'Deal',
            icon: <CircleCheckBig style={{ width: '16px', height: '16px' }} />,
            color: 'rgba(16, 185, 129, 0.2)',
            borderColor: 'rgba(16, 185, 129, 0.4)',
            description: 'Jobs where you got the job'
        }
    }), []);

    // ==========================================
    // ORGANIZE LEADS INTO COLUMNS (NIEUWE LOGICA)
    // ==========================================
    const organizedColumns = useMemo(() => {

        // Don't organize columns if still loading or no leads
        if (loading || leads.length === 0) {
            return [
                {
                    id: 'found' as LeadStage,
                    title: 'Prospects',
                    leads: [],
                    color: stageConfig.found.color,
                    icon: stageConfig.found.icon
                },
                {
                    id: 'lead' as LeadStage,
                    title: 'Lead',
                    leads: [],
                    color: stageConfig.lead.color,
                    icon: stageConfig.lead.icon
                },
                {
                    id: 'opportunity' as LeadStage,
                    title: 'Opportunity',
                    leads: [],
                    color: stageConfig.opportunity.color,
                    icon: stageConfig.opportunity.icon
                },
                {
                    id: 'deal' as LeadStage,
                    title: 'Deal',
                    leads: [],
                    color: stageConfig.deal.color,
                    icon: stageConfig.deal.icon
                }
            ];
        }

        // Filter leads based on search term and follow-up filter
        let filteredLeads = leads.filter(lead => {
            if (!searchTerm && !showFollowUpOnly) return true;

            // Search filter
            const matchesSearch = !searchTerm || (
                lead.job_title_clicked?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lead.company_clicked?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lead.location_clicked?.toLowerCase().includes(searchTerm.toLowerCase())
            );

            // Follow-up filter
            if (showFollowUpOnly) {
                // Only show applied jobs that need follow-up (2+ days old, not completed, not got job)
                if (!lead.applied || lead.got_the_job === true || lead.follow_up_completed) {
                    return false;
                }

                const appliedDate = new Date(lead.created_at);
                const now = new Date();
                const daysSinceApplied = (now.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24);

                return matchesSearch && daysSinceApplied >= 2;
            }

            return matchesSearch;
        });

        // Prospects column: job_clicks without applying record (or applied = false)
        const foundLeads = filteredLeads.filter(lead => !lead.applied);

        // Lead column: applied = true, but no interviews yet
        const leadLeads = filteredLeads.filter(lead =>
            lead.applied && lead.got_the_job !== true && (!lead.interviews || lead.interviews.length === 0)
        );

        // Opportunity column: applied = true, has interviews, but not got the job yet
        const opportunityLeads = filteredLeads.filter(lead =>
            lead.applied && lead.got_the_job !== true && lead.interviews && lead.interviews.length > 0
        );

        // Deal column: jobs where got_the_job is true
        const dealLeads = filteredLeads.filter(lead =>
            lead.applied && lead.got_the_job === true
        );

        return [
            {
                id: 'found' as LeadStage,
                title: 'Prospects',
                leads: foundLeads,
                color: stageConfig.found.color,
                icon: stageConfig.found.icon
            },
            {
                id: 'lead' as LeadStage,
                title: 'Lead',
                leads: leadLeads,
                color: stageConfig.lead.color,
                icon: stageConfig.lead.icon
            },
            {
                id: 'opportunity' as LeadStage,
                title: 'Opportunity',
                leads: opportunityLeads,
                color: stageConfig.opportunity.color,
                icon: stageConfig.opportunity.icon
            },
            {
                id: 'deal' as LeadStage,
                title: 'Deal',
                leads: dealLeads,
                color: stageConfig.deal.color,
                icon: stageConfig.deal.icon
            }
        ];
    }, [leads, searchTerm, stageConfig, loading, showFollowUpOnly]);

    // ==========================================
    // DATA FETCHING (NIEUW: job_clicks + applying)
    // ==========================================
    const fetchLeads = useCallback(async () => {
        if (!user?.id) {
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // Fetch all applying records for this user (includes both prospects and applied jobs)
            const { data: applyingRecords, error: applyingError } = await supabase
                .from('applying')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_archived', false) // Only get non-archived leads
                .order('created_at', { ascending: false });

            if (applyingError) throw applyingError;

            console.log('[DEBUG] Fetched applying records:', {
                count: applyingRecords.length,
                sample: applyingRecords[0]
            });

            // Get all unique job IDs from applying records
            const jobIds = applyingRecords?.map(record => record.unique_id_job) || [];

            // Fetch job data from Allgigs_All_vacancies_NEW table
            let jobDataMap: Record<string, any> = {};
            if (jobIds.length > 0) {
                const { data: jobData, error: jobError } = await supabase
                    .from('Allgigs_All_vacancies_NEW')
                    .select('UNIQUE_ID, Title, Company, Location, rate, date, Summary, URL')
                    .in('UNIQUE_ID', jobIds);

                if (jobError) {
                    console.error('Error fetching job data:', jobError);
                } else {
                    // Create a map for quick lookup
                    jobDataMap = jobData?.reduce((map: Record<string, any>, job) => {
                        map[job.UNIQUE_ID] = job;
                        return map;
                    }, {} as Record<string, any>) || {};
                }
            }

            // Parse JSON fields if they are strings (for json column) or keep as-is (for jsonb)
            const processedRecords = applyingRecords?.map(record => {
                let interviews = [];
                let contacts = [];

                // Handle interviews field
                if (record.interviews) {
                    if (typeof record.interviews === 'string') {
                        try {
                            interviews = JSON.parse(record.interviews);
                        } catch (e) {
                            console.warn('Failed to parse interviews JSON:', e);
                            interviews = [];
                        }
                    } else if (Array.isArray(record.interviews)) {
                        interviews = record.interviews;
                    }
                }

                // Handle contacts field  
                if (record.contacts) {
                    if (typeof record.contacts === 'string') {
                        try {
                            contacts = JSON.parse(record.contacts);
                        } catch (e) {
                            console.warn('Failed to parse contacts JSON:', e);
                            contacts = [];
                        }
                    } else if (Array.isArray(record.contacts)) {
                        contacts = record.contacts;
                    }
                }

                // Get job data from the map
                const jobData = jobDataMap[record.unique_id_job] || {};

                return {
                    ...record,
                    interviews,
                    contacts,
                    // Add job data with _clicked suffix for compatibility
                    job_title_clicked: jobData.Title || '',
                    company_clicked: jobData.Company || '',
                    location_clicked: jobData.Location || '',
                    rate_clicked: jobData.rate || '',
                    date_posted_clicked: jobData.date || '',
                    summary_clicked: jobData.Summary || '',
                    url_clicked: jobData.URL || ''
                };
            }) || [];

            console.log('[DEBUG] Processed records with parsed JSON:', {
                count: processedRecords.length,
                sampleInterviews: processedRecords[0]?.interviews,
                sampleContacts: processedRecords[0]?.contacts
            });

            setLeads(processedRecords);
            setDatabaseAvailable(true);
            setLoading(false); // Show dashboard immediately

            // Load archive count in background (silent, no blocking)
            setTimeout(async () => {
                try {
                    const { count: archivedCount, error: countError } = await supabase
                        .from('applying')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', user.id)
                        .eq('is_archived', true);

                    if (!countError) {
                        setArchivedCount(archivedCount || 0);
                    }
                } catch (err) {
                    // Silent fail - no user notification needed
                    console.error('Background archive count failed:', err);
                }
            }, 50); // Very short delay to ensure UI renders first

        } catch (err: any) {
            setError(err.message || 'Error fetching leads');
            setLeads([]);
            setDatabaseAvailable(false);
            console.error('[DEBUG] fetchLeads error:', err);
            setLoading(false); // Ensure loading stops even on error
        }
    }, [user?.id]);

    // ==========================================
    // USE EFFECT: FETCH LEADS BIJ LOAD
    // ==========================================
    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    // ==========================================
    // CALCULATE FOLLOW-UP NOTIFICATIONS
    // ==========================================
    const calculateFollowUpNotifications = useCallback(() => {
        const now = new Date();
        const notifications = leads.filter(lead => {
            // Only applied jobs need follow-up
            if (!lead.applied) return false;

            // Skip if already got the job
            if (lead.got_the_job === true) return false;

            // Skip if follow-up already completed
            if (lead.follow_up_completed) return false;

            // Calculate days since applied (use created_at as apply date for now)
            const appliedDate = new Date(lead.created_at);
            const daysSinceApplied = (now.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24);

            // Follow-up due after 2 days
            return daysSinceApplied >= 2;
        });

        setFollowUpNotifications(notifications);
    }, [leads]);

    // Update follow-up notifications when leads change
    useEffect(() => {
        calculateFollowUpNotifications();
    }, [calculateFollowUpNotifications]);

    // ==========================================
    // FUTURE FEATURES DATABASE FUNCTIONS
    // ==========================================
    const loadFutureFeatures = useCallback(async () => {
        if (!user?.id) return;

        console.log('Loading future features for user:', user.id);

        try {
            const { data, error } = await supabase
                .from('future_features')
                .select('*')
                .eq('user_id', user.id)
                .single();

            console.log('Database response:', { data, error });

            if (error && error.code !== 'PGRST116') {
                console.error('Error loading future features:', error);
            } else if (data) {
                console.log('Setting future features:', data);
                setFutureFeatures({
                    marketing: data.marketing ?? false,
                    tooling: data.tooling ?? false,
                    agent: data.agent ?? false,
                    interview_optimisation: data.interview_optimisation ?? false,
                    value_proposition: data.value_proposition ?? false
                });
            } else {
                console.log('No data found, using defaults');
            }
        } catch (error) {
            console.error('Error loading future features:', error);
        }
    }, [user?.id]);

    const saveFutureFeatures = useCallback(async (features: any) => {
        if (!user?.id) return;

        console.log('Saving future features:', features);

        try {
            const { data, error } = await supabase
                .from('future_features')
                .upsert({
                    user_id: user.id,
                    ...features
                });

            console.log('Save response:', { data, error });

            if (error) throw error;
        } catch (error) {
            console.error('Error saving future features:', error);
        }
    }, [user?.id]);

    // ==========================================
    // USE EFFECT: LOAD FUTURE FEATURES
    // ==========================================
    useEffect(() => {
        console.log('useEffect triggered, user:', user?.id);
        if (user?.id) {
            loadFutureFeatures();
        }
    }, [user?.id, loadFutureFeatures]);

    const handleFeatureToggle = async (feature: string) => {
        console.log('Toggle clicked for feature:', feature);
        console.log('Current state:', futureFeatures);

        const newFeatures = { ...futureFeatures, [feature]: !futureFeatures[feature as keyof typeof futureFeatures] };
        console.log('New state:', newFeatures);

        setFutureFeatures(newFeatures);
        await saveFutureFeatures(newFeatures);

        // Show popup for new feature
        if (newFeatures[feature as keyof typeof futureFeatures]) {
            setSelectedFeature(feature);
            setShowFeaturePopup(true);
        }
    };

    // ==========================================
    // CALCULATE ARCHIVED COUNT
    // ==========================================
    const calculateArchivedCount = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Count archived leads from database
            const { count, error } = await supabase
                .from('applying')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_archived', true);

            if (error) throw error;
            setArchivedCount(count || 0);
        } catch (err) {
            console.error('Error calculating archived count:', err);
            setArchivedCount(0);
        }
    }, [user?.id]);



    // ==========================================
    // EVENT HANDLERS
    // ==========================================
    const handleLeadUpdate = async (updatedLead: JobClickWithApplying) => {
        setLeads(prevLeads =>
            prevLeads.map(l => l.applying_id === updatedLead.applying_id ? updatedLead : l)
        );

        if (databaseAvailable) {
            await fetchLeads(); // Refresh to get latest data
        }
    };
    console.log(handleLeadUpdate, "handleLeadUpdate - build fix");

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
                    setFollowUpNotifications(prev => prev.filter(lead => lead.applying_id !== leadId));
                    await fetchLeads();
                }
            } catch (error) {
                console.error('Error marking follow-up complete:', error);
            }
        } else {
            // Local only
            setFollowUpNotifications(prev => prev.filter(lead => lead.applying_id !== leadId));
            setLeads(prevLeads =>
                prevLeads.map(l =>
                    l.applying_id === leadId ? { ...l, follow_up_completed: true } : l
                )
            );
        }
    };


    console.log(markFollowUpComplete, "markFollowUpComplete - build fix");

    // ==========================================
    // APPLY ACTION HANDLER (NIEUWE LOGICA)
    // ==========================================
    const handleApplyAction = async (jobId: string, applied: boolean) => {
        if (!user?.id) return;

        console.log('[DEBUG] handleApplyAction called:', { jobId, applied, userId: user.id });

        try {
            if (applied) {
                // Update existing applying record to set applied = true
                const { error } = await supabase
                    .from('applying')
                    .update({ applied: true })
                    .eq('unique_id_job', jobId)
                    .eq('user_id', user.id);

                if (error) throw error;
                console.log('[DEBUG] Successfully updated applying record to applied = true');
            } else {
                // If applied = false, remove the applying record entirely
                console.log('[DEBUG] Removing applying record for jobId:', jobId);

                const { error } = await supabase
                    .from('applying')
                    .delete()
                    .eq('unique_id_job', jobId)
                    .eq('user_id', user.id);

                if (error) throw error;
                console.log('[DEBUG] Successfully removed applying record');
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

    const handleFollowUpComplete = async (applyingId: string, followUpMessage: string) => {
        try {
            const { error } = await supabase
                .from('applying')
                .update({
                    follow_up_completed: true,
                    follow_up_completed_at: new Date().toISOString(),
                    follow_up_message: followUpMessage
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

    const handleArchiveJob = async (applyingId: string) => {
        try {
            // Get the job to archive
            const jobToArchive = leads.find(lead => lead.applying_id === applyingId);
            if (!jobToArchive) return;

            // Only archive jobs that were actually applied to
            if (!jobToArchive.applied) {
                console.log('Cannot archive: Job was not applied to');
                return;
            }

            // Update the applying record to mark it as archived
            const { error: updateError } = await supabase
                .from('applying')
                .update({ is_archived: true, archived_at: new Date().toISOString() })
                .eq('applying_id', applyingId);

            if (updateError) throw updateError;

            // Refresh leads to remove archived job from view
            await fetchLeads();
        } catch (err: any) {
            console.error('Error archiving job:', err);
            setError(err.message || 'Error archiving job');
        }
    };

    const handleRestoreLead = async (archivedApplyingId: string) => {
        try {
            // Simply update the archived job to un-archive it
            const { error: updateError } = await supabase
                .from('applying')
                .update({ is_archived: false, archived_at: null })
                .eq('applying_id', archivedApplyingId);

            if (updateError) throw updateError;

            // Refresh leads and archived count
            await fetchLeads();
            await calculateArchivedCount();
        } catch (err: any) {
            console.error('Error restoring lead:', err);
        }
    };

    const handleDeleteArchivedLead = async (archivedApplyingId: string) => {
        try {
            // Simply delete the archived applying record
            const { error: deleteError } = await supabase
                .from('applying')
                .delete()
                .eq('applying_id', archivedApplyingId);

            if (deleteError) throw deleteError;

            // Refresh archived count
            await calculateArchivedCount();
        } catch (err: any) {
            console.error('Error deleting archived lead:', err);
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
    // RENDER NO USER STATE
    // ==========================================
    if (!user) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '400px',
                color: '#fff'
            }}>
                <div>No user found. Please log in.</div>
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
            color: '#fff',
            overflow: 'hidden' // Hide scrollbars
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
                        marginLeft: '70px',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <Target style={{ width: '32px', height: '32px' }} />
                        allGigs CRM
                    </h1>
                    <p style={{ margin: 0, marginLeft: '70px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        Manage your job applications through each stage
                    </p>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                }}>
                    {/* Feature Buttons */}
                    <button
                        onClick={() => handleFeatureToggle('marketing')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1rem',
                            background: futureFeatures.marketing ? 'rgba(147, 51, 234, 0.2)' : 'rgba(147, 51, 234, 0.1)',
                            border: '1px solid rgba(147, 51, 234, 0.3)',
                            borderRadius: '8px',
                            color: '#9333ea',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!futureFeatures.marketing) {
                                e.currentTarget.style.background = 'rgba(147, 51, 234, 0.2)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!futureFeatures.marketing) {
                                e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
                            }
                        }}
                    >
                        <Mail style={{ width: '16px', height: '16px' }} />
                        Marketing
                        <Lock style={{ width: '14px', height: '14px' }} />
                        {futureFeatures.marketing && <CheckCircle style={{ width: '14px', height: '14px' }} />}
                    </button>
                    <button
                        onClick={() => handleFeatureToggle('tooling')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1rem',
                            background: futureFeatures.tooling ? 'rgba(147, 51, 234, 0.2)' : 'rgba(147, 51, 234, 0.1)',
                            border: '1px solid rgba(147, 51, 234, 0.3)',
                            borderRadius: '8px',
                            color: '#9333ea',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!futureFeatures.tooling) {
                                e.currentTarget.style.background = 'rgba(147, 51, 234, 0.2)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!futureFeatures.tooling) {
                                e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
                            }
                        }}
                    >
                        <Zap style={{ width: '16px', height: '16px' }} />
                        Tooling
                        <Lock style={{ width: '14px', height: '14px' }} />
                        {futureFeatures.tooling && <CheckCircle style={{ width: '14px', height: '14px' }} />}
                    </button>
                    <button
                        onClick={() => handleFeatureToggle('agent')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1rem',
                            background: futureFeatures.agent ? 'rgba(147, 51, 234, 0.2)' : 'rgba(147, 51, 234, 0.1)',
                            border: '1px solid rgba(147, 51, 234, 0.3)',
                            borderRadius: '8px',
                            color: '#9333ea',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!futureFeatures.agent) {
                                e.currentTarget.style.background = 'rgba(147, 51, 234, 0.2)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!futureFeatures.agent) {
                                e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
                            }
                        }}
                    >
                        <Sparkles style={{ width: '16px', height: '16px' }} />
                        AI Agent
                        <Lock style={{ width: '14px', height: '14px' }} />
                        {futureFeatures.agent && <CheckCircle style={{ width: '14px', height: '14px' }} />}
                    </button>
                    <button
                        onClick={() => handleFeatureToggle('interview_optimisation')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1rem',
                            background: futureFeatures.interview_optimisation ? 'rgba(147, 51, 234, 0.2)' : 'rgba(147, 51, 234, 0.1)',
                            border: '1px solid rgba(147, 51, 234, 0.3)',
                            borderRadius: '8px',
                            color: '#9333ea',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!futureFeatures.interview_optimisation) {
                                e.currentTarget.style.background = 'rgba(147, 51, 234, 0.2)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!futureFeatures.interview_optimisation) {
                                e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
                            }
                        }}
                    >
                        <Brain style={{ width: '16px', height: '16px' }} />
                        Interview Prep
                        <Lock style={{ width: '14px', height: '14px' }} />
                        {futureFeatures.interview_optimisation && <CheckCircle style={{ width: '14px', height: '16px' }} />}
                    </button>
                    <button
                        onClick={() => handleFeatureToggle('value_proposition')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1rem',
                            background: futureFeatures.value_proposition ? 'rgba(147, 51, 234, 0.2)' : 'rgba(147, 51, 234, 0.1)',
                            border: '1px solid rgba(147, 51, 234, 0.3)',
                            borderRadius: '8px',
                            color: '#9333ea',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!futureFeatures.value_proposition) {
                                e.currentTarget.style.background = 'rgba(147, 51, 234, 0.2)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!futureFeatures.value_proposition) {
                                e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)';
                            }
                        }}
                    >
                        <Users style={{ width: '16px', height: '16px' }} />
                        Value Prop
                        <Lock style={{ width: '14px', height: '14px' }} />
                        {futureFeatures.value_proposition && <CheckCircle style={{ width: '14px', height: '14px' }} />}
                    </button>

                </div>
            </div>



            {/* Search and Filter Bar */}
            <div style={{
                display: 'flex',
                gap: '2rem',
                marginBottom: '2rem',
                alignItems: 'center',
                justifyContent: 'space-between' // Space between search and buttons
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

                <div style={{ display: 'flex', gap: 8 }}>
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
                            transition: 'all 0.2s ease',
                            marginLeft: '2.5rem' // ~1cm spacing from search bar
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
                    <button
                        onClick={() => setShowStatisticsModal(true)}
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
                        <BarChart3 style={{ width: '16px', height: '16px' }} />
                        Statistics
                    </button>
                    <button
                        onClick={() => setShowFollowUpOnly(!showFollowUpOnly)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1rem',
                            background: showFollowUpOnly ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                            border: showFollowUpOnly ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            color: showFollowUpOnly ? '#f59e0b' : '#fff',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!showFollowUpOnly) {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!showFollowUpOnly) {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            }
                        }}
                    >
                        <Bell style={{ width: '16px', height: '16px' }} />
                        Follow-up
                        {showFollowUpOnly && <CheckCircle style={{ width: '14px', height: '14px' }} />}
                    </button>
                    <button
                        onClick={handleCollapseAll}
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
                        <Minimize2 style={{ width: '16px', height: '16px' }} />
                        Collapse All
                    </button>
                    <button
                        onClick={handleExpandAll}
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
                        <Maximize2 style={{ width: '16px', height: '16px' }} />
                        Expand All
                    </button>
                    <button
                        onClick={fetchLeads}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1rem',
                            background: 'rgba(59, 130, 246, 0.2)',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            borderRadius: '8px',
                            color: '#3b82f6',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                        }}
                    >
                        <RefreshCw style={{ width: '16px', height: '16px' }} />
                        Refresh
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
            <style jsx>{`
                /* Hide scrollbars for WebKit browsers */
                ::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem',
                alignItems: 'start'
            }}>
                {organizedColumns.map(column => {
                    const config = stageConfig[column.id as LeadStage];
                    return (
                        <div
                            key={column.id}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '2px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '1rem',
                                minHeight: '600px',
                                height: 'calc(100vh - 250px)',
                                overflowY: 'auto',
                                scrollbarWidth: 'none', // Firefox
                                msOverflowStyle: 'none', // IE/Edge
                                transition: 'all 0.2s ease',
                                backdropFilter: 'blur(8px)'
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
                                    <LeadCard
                                        key={lead.applying_id}
                                        lead={lead}
                                        index={index}
                                        isDragging={false}
                                        hasFollowUp={followUpNotifications.some(fu => fu.applying_id === lead.applying_id)}
                                        onClick={() => { }} // Empty function for now
                                        onArchived={(leadId) => {
                                            // Remove the archived/deleted lead from the leads array
                                            setLeads(prevLeads => prevLeads.filter(l => l.applying_id !== leadId));
                                            // Recalculate archived count
                                            calculateArchivedCount();
                                        }}
                                        onStateChanged={() => {
                                            // Force refresh of leads when important state changes
                                            fetchLeads();
                                        }}
                                        onLeadUpdate={() => {
                                            // Refresh leads when auto-archived
                                            fetchLeads();
                                            calculateArchivedCount();
                                        }}
                                        onStageAction={(action, data) => {
                                            if (action === 'apply') {
                                                handleApplyAction(lead.unique_id_job, data.applied);
                                            } else if (action === 'interview_date') {
                                                handleInterviewAction(lead.applying_id, data.interviewData);
                                            } else if (action === 'interview_rating') {
                                                handleInterviewAction(lead.applying_id, data.interviewData);
                                            } else if (action === 'update_notes') {
                                                handleUpdateApplying(lead.applying_id, { notes: data.notes });
                                            } else if (action === 'follow_up_complete') {
                                                handleFollowUpComplete(lead.applying_id, data.followUpMessage);
                                            } else if (action === 'got_job') {
                                                handleGotJob(lead.applying_id, data.gotJob, data.startingDate);
                                            } else if (action === 'archive_job') {
                                                handleArchiveJob(data.applying_id);
                                            } else if (action === 'interview_added') {
                                                // Refresh leads when interview is added
                                                fetchLeads();
                                            } else if (action === 'toggle_collapse') {
                                                console.log('toggle_collapse action received:', {
                                                    leadId: lead.applying_id,
                                                    collapsed: data.collapsed,
                                                    currentCollapsed: lead.collapsed_card
                                                });

                                                // Update local state for immediate UI feedback
                                                setLeads(prevLeads => {
                                                    const updatedLeads = prevLeads.map(l =>
                                                        l.applying_id === lead.applying_id
                                                            ? {
                                                                ...l,
                                                                collapsed_card: data.collapsed, // Update applying collapsed_card
                                                            }
                                                            : l
                                                    );

                                                    console.log('Updated leads state:', updatedLeads.find(l => l.applying_id === lead.applying_id));
                                                    return updatedLeads;
                                                });
                                            } else if (action === 'archive') {
                                                handleArchiveJob(lead.applying_id);
                                            }
                                        }}
                                    />
                                ))}

                                {/* Empty state for follow-up filter */}
                                {showFollowUpOnly && (column.id === 'lead' || column.id === 'opportunity') && column.leads.length === 0 && (
                                    <div style={{
                                        padding: '2rem 1rem',
                                        textAlign: 'center',
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        fontSize: '0.875rem'
                                    }}>
                                        <Bell style={{
                                            width: '24px',
                                            height: '24px',
                                            margin: '0 auto 0.5rem auto',
                                            display: 'block',
                                            opacity: 0.5
                                        }} />
                                        <div>No follow-up reminders needed</div>
                                        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.7 }}>
                                            All applied jobs are up to date
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Feature Interest Popup */}
            {showFeaturePopup && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10000,
                    backdropFilter: 'blur(8px)'
                }}>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '16px',
                        padding: '2rem',
                        maxWidth: '500px',
                        width: '90%',
                        position: 'relative'
                    }}>
                        {/* Close button */}
                        <button
                            onClick={() => setShowFeaturePopup(false)}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255, 255, 255, 0.7)',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'none';
                                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                            }}
                        >
                            ×
                        </button>

                        {/* Content */}
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '3rem',
                                marginBottom: '1rem'
                            }}>
                                {selectedFeature === 'marketing' && '📧'}
                                {selectedFeature === 'tooling' && '⚡'}
                                {selectedFeature === 'agent' && '✨'}
                                {selectedFeature === 'interview_optimisation' && '🧠'}
                                {selectedFeature === 'value_proposition' && '👥'}
                            </div>

                            <h3 style={{
                                fontSize: '1.5rem',
                                fontWeight: '600',
                                color: 'white',
                                marginBottom: '1rem'
                            }}>
                                {selectedFeature === 'marketing' && 'Marketing Automation'}
                                {selectedFeature === 'tooling' && 'Advanced Tooling'}
                                {selectedFeature === 'agent' && 'AI Agent'}
                                {selectedFeature === 'interview_optimisation' && 'Interview Prep'}
                                {selectedFeature === 'value_proposition' && 'Value Proposition'}
                            </h3>

                            <p style={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontSize: '1rem',
                                lineHeight: '1.6',
                                marginBottom: '2rem'
                            }}>
                                Amazing! We are just as excited as you are for this feature,
                                <br />
                                We will let you know when this feature is ready
                            </p>

                            <button
                                onClick={() => setShowFeaturePopup(false)}
                                style={{
                                    padding: '0.75rem 2rem',
                                    background: 'rgba(16, 185, 129, 0.2)',
                                    border: '1px solid rgba(16, 185, 129, 0.4)',
                                    borderRadius: '8px',
                                    color: '#10b981',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                                }}
                            >
                                Got it!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showArchiveModal && (
                <ArchiveModal
                    onClose={() => setShowArchiveModal(false)}
                    user={user}
                    onRestoreLead={(leadId) => {
                        handleRestoreLead(leadId);
                    }}
                    onDeleteLead={(leadId) => {
                        handleDeleteArchivedLead(leadId);
                    }}
                />
            )}

            {showStatisticsModal && (
                <StatisticsModal
                    onClose={() => setShowStatisticsModal(false)}
                    leads={leads}
                    statsData={statsData}
                />
            )}
        </div>
    );
};

export default LeadsPipeline; 