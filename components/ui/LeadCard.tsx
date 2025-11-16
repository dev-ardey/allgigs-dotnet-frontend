import React, { useState, useEffect, useCallback } from 'react';
// import { Draggable } from 'react-beautiful-dnd';
import {
    MapPin,
    DollarSign,
    Bell,
    Users,
    Target,
    Award,
    Timer,
    StickyNote,
    CheckCircle,
    Maximize2,
    Minimize2,
    X,
    Archive,
    Calendar,
    Info,
    ExternalLink,
    Star
} from 'lucide-react';
// import { Lead } from '../../types/leads';
import { supabase } from '../../SupabaseClient';
import { apiClient } from '../../lib/apiClient';
import JobSummaryModal from './JobSummaryModal';

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
    interviews?: Array<{
        type: string;
        date: string;
        rating: boolean | null;
        completed: boolean | undefined;
        id: string | undefined;
        created_at: string | undefined;
    }>;
    // Interview prep data
    interview_prep_data?: {
        companyValues: string;
        roleResponsibilities: string;
        specificQuestions: string;
        portfolioReview: string;
        whyCompany: string;
    };
    interview_prep_complete?: boolean;
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

interface LeadCardProps {
    lead: JobClickWithApplying;
    onClick: () => void;
    isDragging: boolean;
    hasFollowUp: boolean;
    onStageAction?: (action: string, data?: any) => void;
    onArchived?: (leadId: string) => void;
    onStateChanged?: () => void;
    onLeadUpdate?: () => void;
    index: number;
}

const LeadCard: React.FC<LeadCardProps> = ({
    lead,
    onClick,
    isDragging,
    hasFollowUp,
    onStageAction,
    onArchived,
    onStateChanged,
    onLeadUpdate,
    index: _index // Index is required by interface but not used in component
}) => {
    // Timer states
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isOverdue, setIsOverdue] = useState(false);
    const [foundTimeLeft, setFoundTimeLeft] = useState<string>('');
    const [foundIsOverdue, setFoundIsOverdue] = useState(false);
    const [notes, setNotes] = useState(lead.notes || '');

    // Track the actual applying_id (updated when click-based lead gets converted)
    const [currentApplyingId, setCurrentApplyingId] = useState<string>(lead.applying_id);

    // Cache for applying record creation (to prevent multiple simultaneous creates)
    const applyingRecordCreationPromise = React.useRef<Promise<string> | null>(null);

    // Update currentApplyingId when lead.applying_id changes (e.g., after creating applying record)
    useEffect(() => {
        if (lead.applying_id && !lead.applying_id.startsWith('click_')) {
            setCurrentApplyingId(lead.applying_id);
        }
    }, [lead.applying_id]);

    // Silent auto-save function (no visual feedback) - FIXED: separate timers per field
    const debouncedSave = useCallback(
        (() => {
            const timeouts: Record<string, NodeJS.Timeout> = {};
            return (field: string, value: any) => {
                // Clear the specific field's timeout
                if (timeouts[field]) {
                    clearTimeout(timeouts[field]);
                }

                // Set a new timeout for this specific field
                timeouts[field] = setTimeout(async () => {
                    try {
                        // Use currentApplyingId (state) instead of lead.applying_id (prop) to get latest value
                        let applyingId = currentApplyingId;
                        if (isClickBasedLead() || applyingId.startsWith('click_')) {
                            // console.log(`[DEBUG] Need to create applying record for click-based lead before saving ${field}`);

                            // If already creating, wait for that to finish
                            if (applyingRecordCreationPromise.current) {
                                // console.log(`[DEBUG] Applying record creation in progress, waiting...`);
                                try {
                                    applyingId = await applyingRecordCreationPromise.current;
                                    // console.log(`[DEBUG] Got applying ID from existing creation: ${applyingId}`);
                                } catch (createError) {
                                    console.error(`[DEBUG] Error waiting for applying record creation:`, createError);
                                    return; // Don't try to update if creation failed
                                }
                            } else {
                                // Start creating applying record
                                // console.log(`[DEBUG] Starting applying record creation for click-based lead`);
                                applyingRecordCreationPromise.current = (async () => {
                                    try {
                                        // Get user session for API token
                                        const { data: { session } } = await supabase.auth.getSession();
                                        if (session?.access_token) {
                                            apiClient.setToken(session.access_token);
                                        }

                                        // Create applying record for this job
                                        const newApplication = await apiClient.createApplication(
                                            lead.unique_id_job,
                                            false, // not applied yet, just tracking
                                            false,
                                            false,
                                            false
                                        );
                                        const newApplyingId = newApplication.applyingId;
                                        // console.log(`[DEBUG] Created applying record: ${newApplyingId}`);

                                        // Update state immediately so other debounced saves can use it
                                        setCurrentApplyingId(newApplyingId);

                                        // Update lead object with new applying_id
                                        lead.applying_id = newApplyingId;

                                        // Notify parent to refresh
                                        if (onLeadUpdate) {
                                            onLeadUpdate();
                                        }

                                        // Clear the promise so next time it creates again if needed
                                        applyingRecordCreationPromise.current = null;

                                        return newApplyingId;
                                    } catch (createError) {
                                        // Clear the promise on error so it can retry
                                        applyingRecordCreationPromise.current = null;
                                        throw createError;
                                    }
                                })();

                                try {
                                    applyingId = await applyingRecordCreationPromise.current;
                                } catch (createError) {
                                    console.error(`[DEBUG] Error creating applying record:`, createError);
                                    return; // Don't try to update if creation failed
                                }
                            }
                        }

                        // Validate applyingId before making API call
                        if (!applyingId || applyingId.startsWith('click_')) {
                            console.error(`[DEBUG] Invalid applyingId for update: ${applyingId}. Cannot save ${field}.`);
                            return; // Don't attempt update with invalid ID
                        }

                        // console.log(`[DEBUG] Saving ${field}:`, value, 'for lead:', applyingId);

                        // Map field names from frontend (snake_case) to backend DTO (camelCase)
                        const fieldMapping: Record<string, string> = {
                            'application_time_minutes': 'applicationTimeMinutes',
                            'match_confidence': 'matchConfidence',
                            'received_confirmation': 'receivedConfirmation',
                            'rejection_reasons_prediction': 'rejectionReasonsPrediction',
                            'introduced_via_agency': 'introducedViaAgency',
                            'follow_up_date': 'followUpDate',
                            'interview_went_well': 'interviewWentWell',
                            'interview_can_improve': 'interviewCanImprove',
                            'offer_rate_alignment': 'offerRateAlignment',
                            'prediction_accuracy': 'predictionAccuracy',
                            'sent_thank_you_note': 'sentThankYouNote',
                            'rejection_reason_mentioned': 'rejectionReasonMentioned',
                            'why_got_interview': 'whyGotInterview',
                            'job_start_date': 'jobStartDate',
                            'contract_signing_date': 'contractSigningDate',
                            'job_hourly_rate': 'jobHourlyRate',
                            'hours_per_week': 'hoursPerWeek',
                            'job_total_length': 'jobTotalLength',
                            'client_rating': 'clientRating',
                            'payment_interval': 'paymentInterval',
                            'why_they_loved_you': 'whyTheyLovedYou',
                            'notes': 'notes',
                            'got_the_job': 'gotTheJob',
                            'starting_date': 'startingDate',
                            'follow_up_completed': 'followUpCompleted',
                            'follow_up_completed_at': 'followUpCompletedAt',
                            'follow_up_message': 'followUpMessage',
                            'contacts': 'contacts',
                            'interviews': 'interviews',
                            'interview_prep_data': 'interviewPrepData',
                            'collapsed_card': 'collapsedCard',
                            'what_you_did_well': 'whatYouDidWell'
                        };

                        const backendFieldName = fieldMapping[field] || field;
                        const updateData: any = { [backendFieldName]: value };

                        // Get user session for API token
                        const { data: { session } } = await supabase.auth.getSession();
                        if (session?.access_token) {
                            apiClient.setToken(session.access_token);
                        }

                        // console.log(`[DEBUG] Calling updateApplication with applyingId: ${applyingId}, field: ${backendFieldName}, value:`, value);

                        // Update via backend API
                        await apiClient.updateApplication(applyingId, updateData);
                        // console.log(`[SUCCESS] Saved ${field} via backend:`, value);

                        // Note: We do NOT call onLeadUpdate() here for debounced saves
                        // because it causes constant page refreshes. The data is saved correctly
                        // and will be visible on the next manual refresh or when the parent
                        // component naturally refreshes (e.g., on page load, after important actions).

                        // Clean up the timeout reference
                        delete timeouts[field];
                    } catch (err) {
                        // Silent error - just log, no user notification
                        console.error(`Error saving ${field} via backend:`, err);
                        delete timeouts[field];
                    }
                }, 1500); // 1.5 second delay after user stops typing
            };
        })(),
        [currentApplyingId, lead.unique_id_job, onLeadUpdate] // Use currentApplyingId state instead of lead.applying_id
    );

    // Debug: Log job stage and status
    useEffect(() => {
        const stage = !lead.applied ? 'Prospects' :
            (lead.applied && lead.got_the_job !== true && (!lead.interviews || lead.interviews.length === 0)) ? 'Lead' :
                (lead.applied && lead.got_the_job !== true && lead.interviews && lead.interviews.length > 0) ? 'Opportunity' :
                    (lead.applied && lead.got_the_job === true) ? 'Deal' : 'Unknown';

        // console.log('[JOB STAGE DEBUG]', {
            applying_id: lead.applying_id,
            job_title: lead.job_title_clicked,
            applied: lead.applied,
            got_the_job: lead.got_the_job,
            interviews: lead.interviews,
            current_stage: stage,
            interview_insights_visible: stage === 'Opportunity'
        });
    }, [lead.applying_id, lead.applied, lead.got_the_job, lead.interviews]);

    // Calculate follow-up timer for Connect stage
    useEffect(() => {
        if (lead.applied && lead.created_at && !lead.follow_up_completed) {
            const startDate = new Date(lead.created_at);
            const followUpDays = 2; // 2 days after applying
            const targetDate = new Date(startDate.getTime() + followUpDays * 24 * 60 * 60 * 1000);

            const updateTimer = () => {
                const now = new Date();
                const diff = targetDate.getTime() - now.getTime();

                if (diff <= 0) {
                    setTimeLeft('Time for a followup!');
                    setIsOverdue(true);
                } else {
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                    if (days > 0) {
                        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
                    } else if (hours > 0) {
                        setTimeLeft(`${hours}h ${minutes}m`);
                    } else {
                        setTimeLeft(`${minutes}m`);
                    }
                    setIsOverdue(false);
                }
            };

            updateTimer();
            const interval = setInterval(updateTimer, 60000); // Update every minute

            return () => clearInterval(interval);
        } else {
            // Clear timer if not applicable
            setTimeLeft('');
            setIsOverdue(false);
            return undefined;
        }
    }, [lead.applied, lead.created_at, lead.follow_up_completed]);

    // Calculate Prospects stage countdown timer (2 days to apply)
    useEffect(() => {
        if (!lead.applied && lead.created_at) {
            const startDate = new Date(lead.created_at);
            const applyDays = 2; // 2 days to apply
            const targetDate = new Date(startDate.getTime() + applyDays * 24 * 60 * 60 * 1000);

            const updateFoundTimer = () => {
                const now = new Date();
                const diff = targetDate.getTime() - now.getTime();

                if (diff <= 0) {
                    setFoundTimeLeft('Job expired');
                    setFoundIsOverdue(true);

                    // Automatically archive the job when timer reaches 0
                    if (!lead.is_archived) {
                        handleAutoArchive();
                    }
                } else {
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                    if (days > 0) {
                        setFoundTimeLeft(`${days}d ${hours}h ${minutes}m`);
                    } else if (hours > 0) {
                        setFoundTimeLeft(`${hours}h ${minutes}m`);
                    } else {
                        setFoundTimeLeft(`${minutes}m`);
                    }
                    setFoundIsOverdue(false);
                }
            };

            updateFoundTimer();
            const interval = setInterval(updateFoundTimer, 30000); // Update every 30 seconds for better accuracy

            return () => clearInterval(interval);
        } else {
            // Clear timer if not applicable
            setFoundTimeLeft('');
            setFoundIsOverdue(false);
            return undefined;
        }
    }, [lead.applied, lead.created_at]);

    // Voeg direct na de useState hooks toe:
    // Zet het type van mockPriority expliciet op string:
    const mockPriority: string = 'medium'; // 'high', 'medium', 'low'
    // const mockMatchPercentage = 85;
    // const mockPossibleEarnings = 75000;
    // const mockAboveNormalRate = true;
    // const mockFollowUpOverdue = false;

    // Contact states
    const [contacts, setContacts] = useState<Array<{
        id: string;
        name: string;
        phone?: string;
        email?: string;
    }>>([]);
    const [showContactForm, setShowContactForm] = useState(false);
    const [newContact, setNewContact] = useState({
        name: '',
        phone: '',
        email: ''
    });
    const [editingContact, setEditingContact] = useState<string | null>(null);

    // Interview prep states
    const [showInterviewPrep, setShowInterviewPrep] = useState(false);
    const [interviewPrepComplete, setInterviewPrepComplete] = useState(lead.interview_prep_complete || false);
    const [interviewPrepData, setInterviewPrepData] = useState(lead.interview_prep_data || {
        companyValues: '',
        roleResponsibilities: '',
        specificQuestions: '',
        portfolioReview: '',
        whyCompany: ''
    });

    // Interview flow states (moved from renderInterviewFlow)
    const [selectedInterviewType, setSelectedInterviewType] = useState<string>('recruiter');
    const [interviewDate, setInterviewDate] = useState('');
    const [showNewInterview, setShowNewInterview] = useState(false);
    const [canRateInterview, setCanRateInterview] = useState(false);
    // console.log(canRateInterview, "canRateInterview - build fix");
    // Follow-up state
    const [followUpMessage, setFollowUpMessage] = useState(lead.follow_up_message || '');

    // Helper function to check if this is a click-based lead (no applying record yet)
    const isClickBasedLead = () => {
        return lead.applying_id?.startsWith('click_');
    };

    // Auto-archive function
    const handleAutoArchive = async () => {
        try {
            // Skip auto-archiving for click-based leads (they don't have applying records)
            if (lead.applying_id?.startsWith('click_')) {
                // console.log('Skipping auto-archive for click-based lead:', lead.applying_id);
                return;
            }

            // console.log('Auto-archiving expired job:', lead.applying_id);

            const { error } = await supabase
                .from('applying')
                .update({
                    is_archived: true,
                    archived_at: new Date().toISOString()
                })
                .eq('applying_id', lead.applying_id);

            if (error) {
                console.error('Error auto-archiving job:', error);
            } else {
                // console.log('Job auto-archived successfully');
                // Trigger parent component to refresh
                if (onLeadUpdate) {
                    onLeadUpdate();
                }
            }
        } catch (error) {
            console.error('Exception in auto-archive:', error);
        }
    };

    // Force re-render after state changes
    const [, forceUpdate] = useState({});
    const triggerRerender = () => forceUpdate({});

    // Calculate progress percentage
    const calculateProgress = () => {
        if (!lead.applied) return 0;

        let progress = 0;

        // Applied: +30%
        if (lead.applied) progress += 30;

        // Notes: +10%
        if (lead.notes && lead.notes.trim()) progress += 10;

        // Follow-up completed: +10%
        if (lead.follow_up_completed) progress += 10;

        // Contacts added: +10% (if contacts array has items)
        if (contacts.length > 0) progress += 10;

        // Interviews: +20%
        if (lead.interviews && lead.interviews.length > 0) {
            progress += 20;
        }

        // Interview prep completed: +10%
        if (lead.interview_prep_complete) progress += 10;

        // Got the job: fill to 100%
        if (lead.got_the_job) {
            progress = 100;
        }

        return Math.min(progress, 100);
    };

    const progressPercentage = calculateProgress();

    // Pas de priority-dot aan:
    const getPriorityColor = () => {
        switch (mockPriority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    // console.log(getPriorityColor(), "getPriorityColor - build fix");

    // Check if card should be collapsed
    // Check collapse state from applying record or job_clicks record
    const [localCollapsed, setLocalCollapsed] = useState(
        lead.collapsed_card !== undefined ? lead.collapsed_card : false
    );

    // Job summary modal state
    const [showSummaryModal, setShowSummaryModal] = useState(false);

    // Enhanced Prospects column flow states
    const [showWhatSentFlow, setShowWhatSentFlow] = useState(false);
    const [sentCV, setSentCV] = useState(lead.sent_cv || false);
    const [sentPortfolio, setSentPortfolio] = useState(lead.sent_portfolio || false);
    const [sentCoverLetter, setSentCoverLetter] = useState(lead.sent_cover_letter || false);

    // Enhanced Lead Column states
    const [applicationTimeMinutes, setApplicationTimeMinutes] = useState(lead.application_time_minutes || '');
    const [matchConfidence, setMatchConfidence] = useState(lead.match_confidence);
    const [receivedConfirmation, setReceivedConfirmation] = useState(lead.received_confirmation);
    const [rejectionReasonsPrediction, setRejectionReasonsPrediction] = useState(lead.rejection_reasons_prediction || '');
    const [introducedViaAgency, setIntroducedViaAgency] = useState(lead.introduced_via_agency);

    // Enhanced Opportunity Column states
    const [followUpDate, setFollowUpDate] = useState(lead.follow_up_date || '');
    const [interviewWentWell, setInterviewWentWell] = useState(lead.interview_went_well || '');
    const [interviewCanImprove, setInterviewCanImprove] = useState(lead.interview_can_improve || '');
    const [offerRateAlignment, setOfferRateAlignment] = useState(lead.offer_rate_alignment || '');
    const [predictionAccuracy, setPredictionAccuracy] = useState(lead.prediction_accuracy || '');
    const [sentThankYouNote, setSentThankYouNote] = useState(lead.sent_thank_you_note);
    const [rejectionReasonMentioned, setRejectionReasonMentioned] = useState(lead.rejection_reason_mentioned || '');
    const [whyGotInterview, setWhyGotInterview] = useState(lead.why_got_interview || '');

    // Enhanced Deal Column states
    const [jobStartDate, setJobStartDate] = useState(lead.job_start_date || '');
    const [contractSigningDate, setContractSigningDate] = useState(lead.contract_signing_date || '');
    const [jobHourlyRate, setJobHourlyRate] = useState(lead.job_hourly_rate || '');
    const [hoursPerWeek, setHoursPerWeek] = useState(lead.hours_per_week || '');
    const [jobTotalLength, setJobTotalLength] = useState(lead.job_total_length || '');
    const [clientRating, setClientRating] = useState(lead.client_rating || 0);
    const [paymentInterval, setPaymentInterval] = useState(lead.payment_interval || '');
    const [whyTheyLovedYou, setWhyTheyLovedYou] = useState(lead.why_they_loved_you || '');
    const [whatYouDidWell, setWhatYouDidWell] = useState(lead.what_you_did_well || '');

    // Update local state when props change
    useEffect(() => {
        // Prioritize job_clicks.collapsed_job_click_card since it's always updated
        const newCollapsed = lead.collapsed_card !== undefined ? lead.collapsed_card : false;
        // console.log('LeadCard useEffect - updating local state:', {
            leadId: lead.applying_id,
            applyingCollapsed: lead.collapsed_card,
            jobClicksCollapsed: lead.collapsed_job_click_card,
            newCollapsed,
            currentLocalCollapsed: localCollapsed
        });
        setLocalCollapsed(newCollapsed);
    }, [lead.collapsed_card]);

    // Sync local state with lead prop changes (only when prop actually changes, not on every render)
    useEffect(() => {
        if (lead.application_time_minutes !== undefined && lead.application_time_minutes !== applicationTimeMinutes) {
            setApplicationTimeMinutes(lead.application_time_minutes || '');
        }
        if (lead.match_confidence !== undefined && lead.match_confidence !== matchConfidence) {
            setMatchConfidence(lead.match_confidence);
        }
        if (lead.received_confirmation !== undefined && lead.received_confirmation !== receivedConfirmation) {
            setReceivedConfirmation(lead.received_confirmation);
        }
    }, [lead.application_time_minutes, lead.match_confidence, lead.received_confirmation, lead.applying_id]);

    const isCollapsed = localCollapsed;

    // Debug log for collapse state
    // console.log('LeadCard collapse state:', {
        leadId: lead.applying_id,
        applyingCollapsed: lead.collapsed_card,
        jobClicksCollapsed: lead.collapsed_job_click_card,
        finalCollapsed: isCollapsed
    });

    // Helper function to get latest interview info for collapsed view
    const getLatestInterviewInfo = () => {
        if (!lead.interviews || lead.interviews.length === 0) return null;

        // Sort interviews by date (newest first)
        const sortedInterviews = [...lead.interviews].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB.getTime() - dateA.getTime();
        });

        const latestInterview = sortedInterviews[0];
        if (!latestInterview) return null;

        // Format date (15 Jan)
        const date = new Date(latestInterview.date);
        const formattedDate = date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short'
        });

        // Determine status
        let status = '';
        if (latestInterview.rating === null) {
            status = 'Upcoming';
        } else if (latestInterview.rating === true) {
            status = 'Good';
        } else {
            status = 'Bad';
        }

        // Determine prefix
        const prefix = latestInterview.rating === null ? 'Next interview:' : 'Last interview:';

        return `${prefix} ${formattedDate} (${status})`;
    };

    // Handle button actions
    const handleAppliedClick = async (applied: boolean) => {
        if (applied) {
            // Show the "What did you send?" flow
            setShowWhatSentFlow(true);
        } else {
            // Direct NO - remove job (archive or just remove from view for click-based leads)
            try {
                // For click-based leads, just remove from view (no applying record to delete)
                if (isClickBasedLead()) {
                    // console.log('[DEBUG] Removing click-based lead from view');
                    // Notify parent to remove from view
                    if (onArchived) {
                        onArchived(lead.applying_id);
                    }
                    return;
                }

                // For existing applying records, archive via backend
                // Get user session for API token
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token) {
                    apiClient.setToken(session.access_token);
                }

                // Archive via backend API (backend doesn't have delete, so we archive)
                await apiClient.archiveApplication(lead.applying_id);

                // Notify parent that lead was archived (component will be removed)
                if (onArchived) {
                    onArchived(lead.applying_id);
                }
            } catch (err) {
                console.error('Error archiving job via backend:', err);
            }
        }
    };

    const handleConfirmApplication = async () => {
        try {
            let applyingId = lead.applying_id;

            // For click-based leads, create applying record first
            if (isClickBasedLead()) {
                // console.log('[DEBUG] Creating applying record for click-based lead');
                try {
                    // Get user session for API token
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.access_token) {
                        apiClient.setToken(session.access_token);
                    }

                    // Create applying record with sent items
                    const newApplication = await apiClient.createApplication(
                        lead.unique_id_job,
                        true, // applied = true
                        sentCV,
                        sentPortfolio,
                        sentCoverLetter
                    );
                    applyingId = newApplication.applyingId;
                    // console.log(`[DEBUG] Created applying record: ${applyingId}`);

                    // Update lead object with new applying_id
                    lead.applying_id = applyingId;
                    lead.applied = true;

                    // Notify parent to refresh leads
                    if (onLeadUpdate) {
                        onLeadUpdate();
                    }
                } catch (createError) {
                    console.error('[DEBUG] Error creating applying record:', createError);
                    alert('Failed to create application record. Please try again.');
                    return;
                }
            } else {
                // For existing applying records, update via backend
                try {
                    // Get user session for API token
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.access_token) {
                        apiClient.setToken(session.access_token);
                    }

                    // Update via backend API
                    await apiClient.updateApplication(applyingId, {
                        applied: true,
                        sentCv: sentCV,
                        sentPortfolio: sentPortfolio,
                        sentCoverLetter: sentCoverLetter
                    });
                    // console.log('[DEBUG] Updated applying record via backend');
                } catch (updateError) {
                    console.error('[DEBUG] Error updating applying record:', updateError);
                    alert('Failed to update application. Please try again.');
                    return;
                }
            }

            // Update local state immediately (optimistic update)
            lead.applied = true;
            lead.sent_cv = sentCV;
            lead.sent_portfolio = sentPortfolio;
            lead.sent_cover_letter = sentCoverLetter;
            triggerRerender();

            // Notify parent that state changed (for column movement)
            if (onStateChanged) {
                onStateChanged();
            }

            setShowWhatSentFlow(false);
        } catch (error) {
            console.error('Error confirming application:', error);
            alert('Failed to save application. Please try again.');
        }
    };

    const handleCancelApplication = () => {
        setShowWhatSentFlow(false);
        // Reset to original values
        setSentCV(lead.sent_cv || false);
        setSentPortfolio(lead.sent_portfolio || false);
        setSentCoverLetter(lead.sent_cover_letter || false);
    };

    const handleFollowUpComplete = async (completed: boolean) => {
        try {
            // For click-based leads, create applying record first
            let applyingId = lead.applying_id;
            if (isClickBasedLead()) {
                // console.log('[DEBUG] Creating applying record for click-based lead before updating follow-up');
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.access_token) {
                        apiClient.setToken(session.access_token);
                    }
                    const newApplication = await apiClient.createApplication(lead.unique_id_job, false);
                    applyingId = newApplication.applyingId;
                    lead.applying_id = applyingId;
                    if (onLeadUpdate) onLeadUpdate();
                } catch (createError) {
                    console.error('[DEBUG] Error creating applying record:', createError);
                    return;
                }
            }

            // Get user session for API token
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                apiClient.setToken(session.access_token);
            }

            // Update via backend API - also save followUpMessage if it exists
            const updateData: any = {
                followUpCompleted: completed,
                followUpCompletedAt: completed ? new Date().toISOString() : null
            };
            // Include followUpMessage if it exists on the lead
            if (lead.follow_up_message !== undefined) {
                updateData.followUpMessage = lead.follow_up_message;
            }
            await apiClient.updateApplication(applyingId, updateData);

            // Update local state immediately
            lead.follow_up_completed = completed;
            if (completed) {
                lead.follow_up_completed_at = new Date().toISOString();
            } else {
                (lead as any).follow_up_completed_at = null;
            }
            triggerRerender();

            // Notify parent that state changed
            if (onStateChanged) {
                onStateChanged();
            }
        } catch (err) {
            console.error('Error updating follow-up status via backend:', err);
        }
    };

    const handleGotJob = async (gotJob: boolean, startingDate?: string) => {
        try {
            // For click-based leads, create applying record first
            let applyingId = lead.applying_id;
            if (isClickBasedLead()) {
                // console.log('[DEBUG] Creating applying record for click-based lead before updating got_the_job');
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.access_token) {
                        apiClient.setToken(session.access_token);
                    }
                    const newApplication = await apiClient.createApplication(lead.unique_id_job, lead.applied || false);
                    applyingId = newApplication.applyingId;
                    lead.applying_id = applyingId;
                    if (onLeadUpdate) onLeadUpdate();
                } catch (createError) {
                    console.error('[DEBUG] Error creating applying record:', createError);
                    return;
                }
            }

            // Get user session for API token
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                apiClient.setToken(session.access_token);
            }

            if (gotJob === false) {
                // If "No" - only archive if this was an applied job (not Prospects stage)
                if (lead.applied) {
                    await apiClient.updateApplication(applyingId, {
                        isArchived: true,
                        archivedAt: new Date().toISOString(),
                        gotTheJob: false
                    });

                    // Update local state immediately
                    lead.got_the_job = false;
                    lead.is_archived = true;
                    triggerRerender();

                    // Notify parent that lead was archived
                    if (onArchived) {
                        onArchived(applyingId);
                    }
                } else {
                    // If not applied yet, archive (backend doesn't have delete, use archive)
                    await apiClient.archiveApplication(applyingId);

                    // Notify parent that lead was deleted
                    if (onArchived) {
                        onArchived(applyingId);
                    }
                }
            } else {
                // If "Yes", update got_the_job but don't archive yet (show archive button)
                await apiClient.updateApplication(applyingId, {
                    gotTheJob: true,
                    startingDate: startingDate || null
                });

                // Update local state immediately
                lead.got_the_job = true;
                if (startingDate) lead.starting_date = startingDate;
                triggerRerender();

                // Notify parent that state changed (for column movement)
                if (onStateChanged) {
                    onStateChanged();
                }
            }
        } catch (err) {
            console.error('Error updating got_the_job status via backend:', err);
        }
    };

    const handleArchiveJob = async () => {
        try {
            // For click-based leads, create applying record first
            let applyingId = lead.applying_id;
            if (isClickBasedLead()) {
                // console.log('[DEBUG] Creating applying record for click-based lead before archiving');
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.access_token) {
                        apiClient.setToken(session.access_token);
                    }
                    const newApplication = await apiClient.createApplication(lead.unique_id_job, lead.applied || false);
                    applyingId = newApplication.applyingId;
                    lead.applying_id = applyingId;
                    if (onLeadUpdate) onLeadUpdate();
                } catch (createError) {
                    console.error('[DEBUG] Error creating applying record:', createError);
                    return;
                }
            }

            if (lead.applied) {
                // Get user session for API token
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token) {
                    apiClient.setToken(session.access_token);
                }

                // Only archive if job was actually applied to
                await apiClient.archiveApplication(applyingId);

                // Update local state immediately
                lead.is_archived = true;
                triggerRerender();

                // Notify parent that lead was archived
                if (onArchived) {
                    onArchived(applyingId);
                }
            }
        } catch (err) {
            console.error('Error archiving job via backend:', err);
        }
    };

    // Contact handlers
    const handleSaveContact = async () => {
        if (!newContact.name.trim() || !lead.applying_id) return;

        try {
            // For click-based leads, create applying record first
            let applyingId = lead.applying_id;
            if (isClickBasedLead()) {
                // console.log('[DEBUG] Creating applying record for click-based lead before saving contact');
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.access_token) {
                        apiClient.setToken(session.access_token);
                    }
                    const newApplication = await apiClient.createApplication(lead.unique_id_job, lead.applied || false);
                    applyingId = newApplication.applyingId;
                    lead.applying_id = applyingId;
                    if (onLeadUpdate) onLeadUpdate();
                } catch (createError) {
                    console.error('[DEBUG] Error creating applying record:', createError);
                    return;
                }
            }

            try {
                // Get current contacts from lead object, or empty array
                const currentContacts = lead.contacts || [];

                let updatedContacts;
                if (editingContact) {
                    // Edit existing contact
                    updatedContacts = currentContacts.map((contact: any) =>
                        contact.id === editingContact
                            ? { ...contact, ...newContact }
                            : contact
                    );
                } else {
                    // Add new contact with unique ID
                    const newContactWithId = {
                        id: crypto.randomUUID(),
                        ...newContact,
                        created_at: new Date().toISOString()
                    };
                    updatedContacts = [...currentContacts, newContactWithId];
                }

                // Get user session for API token
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token) {
                    apiClient.setToken(session.access_token);
                }

                // Update via backend API
                await apiClient.updateApplication(applyingId, {
                    contacts: updatedContacts
                });

                // Update local state - ensure we have a valid array
                const validContacts = Array.isArray(updatedContacts) ? updatedContacts : [];
                lead.contacts = validContacts;
                setContacts(validContacts);
                triggerRerender();

                // Reset form
                setNewContact({ name: '', phone: '', email: '' });
                setShowContactForm(false);
                setEditingContact(null);

                // Notify parent that state changed
                if (onStateChanged) {
                    onStateChanged();
                }
            } catch (err: any) {
                console.error('Error saving contact via backend:', err);
            }
        } catch (err: any) {
            console.error('Error in handleSaveContact:', err);
        }
    };

    const handleCancelContact = () => {
        setNewContact({ name: '', phone: '', email: '' });
        setEditingContact(null);
        setShowContactForm(false);
    };

    const handleDeleteContact = async (contactId: string) => {
        try {
            // For click-based leads, create applying record first
            let applyingId = lead.applying_id;
            if (isClickBasedLead()) {
                // console.log('[DEBUG] Creating applying record for click-based lead before deleting contact');
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.access_token) {
                        apiClient.setToken(session.access_token);
                    }
                    const newApplication = await apiClient.createApplication(lead.unique_id_job, lead.applied || false);
                    applyingId = newApplication.applyingId;
                    lead.applying_id = applyingId;
                    if (onLeadUpdate) onLeadUpdate();
                } catch (createError) {
                    console.error('[DEBUG] Error creating applying record:', createError);
                    return;
                }
            }

            // Get user session for API token
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                apiClient.setToken(session.access_token);
            }

            // Update via backend API
            const updatedContacts = (lead.contacts || []).filter(c => c.id !== contactId);
            await apiClient.updateApplication(applyingId, {
                contacts: updatedContacts
            });

            // Update local state - ensure we have a valid array
            const validContacts = Array.isArray(updatedContacts) ? updatedContacts : [];
            lead.contacts = validContacts;
            setContacts(validContacts);
            triggerRerender();

            // Notify parent that state changed
            if (onStateChanged) {
                onStateChanged();
            }
        } catch (err: any) {
            console.error('Error deleting contact via backend:', err);
        }
    };

    // Collapse/Expand handler
    const handleToggleCollapse = async (collapsed: boolean) => {
        // console.log('handleToggleCollapse called:', {
            leadId: lead.applying_id,
            collapsed,
            hasApplying: !!lead.applying_id,
            currentCollapsed: isCollapsed
        });

        try {
            // For click-based leads, create applying record first
            let applyingId = lead.applying_id;
            if (isClickBasedLead()) {
                // console.log('[DEBUG] Creating applying record for click-based lead before toggling collapse');
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.access_token) {
                        apiClient.setToken(session.access_token);
                    }
                    const newApplication = await apiClient.createApplication(lead.unique_id_job, lead.applied || false);
                    applyingId = newApplication.applyingId;
                    lead.applying_id = applyingId;
                    if (onLeadUpdate) onLeadUpdate();
                } catch (createError) {
                    console.error('[DEBUG] Error creating applying record:', createError);
                    return;
                }
            }

            // Get user session for API token
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                apiClient.setToken(session.access_token);
            }

            // Update via backend API (applying table)
            if (applyingId) {
                await apiClient.updateApplication(applyingId, {
                    collapsedCard: collapsed
                });
                // console.log('Successfully updated applying table via backend');
            }

            // Note: job_clicks table update is handled separately via job_clicks API if needed
            // For now, we only update applying table via backend

            // Update local state immediately
            setLocalCollapsed(collapsed);

            // Update parent state
            if (onStageAction) {
                // console.log('Calling onStageAction with collapsed:', collapsed);
                onStageAction('toggle_collapse', { collapsed });
            }
        } catch (err: any) {
            console.error('Error toggling collapse via backend:', err);
        }
    };

    // Load contacts on component mount and sync with lead changes
    useEffect(() => {
        // Load contacts directly from lead object
        const contactsArray = Array.isArray(lead.contacts) ? lead.contacts : [];
        if (JSON.stringify(contactsArray) !== JSON.stringify(contacts)) {
            setContacts(contactsArray);
        }
    }, [lead.contacts, lead.applying_id]);

    // Sync notes with lead prop changes
    useEffect(() => {
        if (lead.notes !== undefined && lead.notes !== notes) {
            setNotes(lead.notes || '');
        }
    }, [lead.notes, lead.applying_id]);

    // Update canRateInterview when interview type and date change
    useEffect(() => {
        if (selectedInterviewType && interviewDate) {
            setCanRateInterview(true);
        } else {
            setCanRateInterview(false);
        }
    }, [selectedInterviewType, interviewDate]);



    const handleOpenPrepModal = () => {
        if (onStageAction) {
            onStageAction('open_prep_modal');
        }
        return;
    };

    const handleSaveInterviewPrep = async () => {
        try {
            // For click-based leads, create applying record first
            let applyingId = lead.applying_id;
            if (isClickBasedLead()) {
                // console.log('[DEBUG] Creating applying record for click-based lead before saving interview prep');
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.access_token) {
                        apiClient.setToken(session.access_token);
                    }
                    const newApplication = await apiClient.createApplication(lead.unique_id_job, lead.applied || false);
                    applyingId = newApplication.applyingId;
                    lead.applying_id = applyingId;
                    if (onLeadUpdate) onLeadUpdate();
                } catch (createError) {
                    console.error('[DEBUG] Error creating applying record:', createError);
                    return;
                }
            }

            // Get user session for API token
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                apiClient.setToken(session.access_token);
            }

            // Update via backend API
            await apiClient.updateApplication(applyingId, {
                interviewPrepData: interviewPrepData,
                interviewPrepComplete: true
            });

            // Update local state
            setInterviewPrepComplete(true);
            lead.interview_prep_data = interviewPrepData;
            lead.interview_prep_complete = true;
            triggerRerender();
        } catch (err) {
            console.error('Error saving interview prep via backend:', err);
        }
    };

    // const handleInterviewRating = (rating: 'thumbs_up' | 'thumbs_down') => {
    //     if (onStageAction) {
    //         onStageAction('interview_rating', { rating });
    //     }
    // };

    // console.log(handleOpenPrepModal, "handleOpenPrepModal - build fix");

    const [startingDate, setStartingDate] = React.useState(lead.starting_date || '');

    const handleNotesChange = (newNotes: string) => {
        setNotes(newNotes);
        // Silent auto-save after user stops typing
        debouncedSave('notes', newNotes);
    };

    const INTERVIEW_TYPES = [
        { key: 'recruiter', label: 'Recruiter' },
        { key: 'technical', label: 'Technical' },
        { key: 'hiringmanager', label: 'Hiring Manager' },
        { key: 'teamlead', label: 'Team Lead' },
        { key: 'hr', label: 'HR' },
        { key: 'ceo', label: 'CEO/Founder' }
    ];

    const renderInterviewFlow = () => {
        if (!lead.applied) {
            return null;
        }

        // Verzamel welke interviews al zijn ingevuld
        const currentInterviews = lead.interviews || [];
        const doneTypes = currentInterviews.map((interview: any) => interview.type);
        // console.log(doneTypes, "doneTypes - build fix");
        // All types are always available (don't filter out done types)
        const availableTypes = INTERVIEW_TYPES;


        // Helper om label te krijgen
        const getLabel = (key: string) => {
            const type = INTERVIEW_TYPES.find(t => t.key === key);
            return type ? type.label : key.charAt(0).toUpperCase() + key.slice(1);
        };

        // Sla interview data op bij datum selectie (zonder rating) - alleen voor "Upcoming" button
        const handleSaveInterviewDate = async () => {
            if (!lead.applying_id) {
                alert('Error: Cannot save interview - applying ID missing');
                return;
            }

            if (!selectedInterviewType || !interviewDate) {
                alert('Error: Please select interview type and date first');
                return;
            }

            // console.log('[DEBUG] Saving interview date:', {
                applying_id: lead.applying_id,
                selectedInterviewType,
                interviewDate,
                currentInterviews: lead.interviews
            });

            try {
                const currentInterviews = Array.isArray(lead.interviews) ? lead.interviews : [];

                // Check if interview of this type already exists (completed or not)
                const existingInterviewIndex = currentInterviews.findIndex((interview: any) =>
                    interview.type === selectedInterviewType
                );

                let updatedInterviews;
                if (existingInterviewIndex >= 0) {
                    // Update existing interview with new date (only if date changed or it's not completed yet)
                    updatedInterviews = [...currentInterviews];
                    const existingInterview = updatedInterviews[existingInterviewIndex]!;
                    const existingDate = existingInterview.date;
                    const isDateChanged = existingDate !== interviewDate;

                    // Only update if date changed or interview is not completed yet
                    if (isDateChanged || !existingInterview.completed) {
                        updatedInterviews[existingInterviewIndex] = {
                            type: existingInterview.type,
                            date: interviewDate,
                            rating: existingInterview.rating,
                            completed: existingInterview.completed,
                            id: existingInterview.id,
                            created_at: existingInterview.created_at
                        };
                    } else {
                        // Date hasn't changed and interview is already completed - no update needed
                        // console.log('[DEBUG] Interview already exists with same date and completed - skipping update');
                        return;
                    }
                } else {
                    // Create new interview object (without rating)
                    const newInterview = {
                        id: crypto.randomUUID(),
                        type: selectedInterviewType,
                        date: interviewDate,
                        rating: null as boolean | null,
                        completed: false,
                        created_at: new Date().toISOString()
                    };
                    updatedInterviews = [...currentInterviews, newInterview];
                }

                // console.log('[DEBUG] Updating interviews in database:', updatedInterviews);

                // For click-based leads, create applying record first
                let applyingId = lead.applying_id;
                if (isClickBasedLead()) {
                    // console.log('[DEBUG] Creating applying record for click-based lead before saving interview');
                    try {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (session?.access_token) {
                            apiClient.setToken(session.access_token);
                        }
                        const newApplication = await apiClient.createApplication(lead.unique_id_job, lead.applied || false);
                        applyingId = newApplication.applyingId;
                        lead.applying_id = applyingId;
                        if (onLeadUpdate) onLeadUpdate();
                    } catch (createError) {
                        console.error('[DEBUG] Error creating applying record:', createError);
                        throw createError;
                    }
                }

                // Get user session for API token
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token) {
                    apiClient.setToken(session.access_token);
                }

                // Ensure we have a valid interviews array to update
                if (!updatedInterviews || updatedInterviews.length === 0) {
                    console.error('[DEBUG] Cannot save: interviews array is empty');
                    alert('Error: Cannot save empty interview data');
                    return;
                }

                // Update via backend API
                await apiClient.updateApplication(applyingId, {
                    interviews: updatedInterviews
                });

                // console.log('[DEBUG] Interview date saved successfully via backend');

                // Update local state and refresh UI
                lead.interviews = updatedInterviews;
                triggerRerender();

                // Notify parent that state changed (for column movement)
                if (onStateChanged) {
                    onStateChanged();
                }
            } catch (err: any) {
                console.error('[DEBUG] Error saving interview date:', err);
                alert('Error saving interview date: ' + err.message);
            }
        };

        // Sla interview data en rating op na klikken Good/Bad
        const handleRating = async (rating: boolean) => {
            // Use state values (for form buttons) or fallback to error
            if (!lead.applying_id) {
                alert('Error: Cannot save interview - applying ID missing');
                return;
            }

            if (!selectedInterviewType || !interviewDate) {
                alert('Error: Please select interview type and date first');
                return;
            }

            // console.log('[DEBUG] Saving interview rating:', {
                applying_id: lead.applying_id,
                selectedInterviewType,
                interviewDate,
                rating,
                currentInterviews: lead.interviews
            });

            try {
                const currentInterviews = Array.isArray(lead.interviews) ? lead.interviews : [];

                // Find existing interview of this type that is not completed
                const existingInterviewIndex = currentInterviews.findIndex((interview: any) =>
                    interview.type === selectedInterviewType && !interview.completed
                );

                let updatedInterviews;
                if (existingInterviewIndex >= 0) {
                    // Update existing interview with rating
                    updatedInterviews = [...currentInterviews];
                    const existingInterview = updatedInterviews[existingInterviewIndex]!;
                    updatedInterviews[existingInterviewIndex] = {
                        type: existingInterview.type,
                        date: existingInterview.date,
                        rating: rating,
                        completed: true,
                        id: existingInterview.id,
                        created_at: existingInterview.created_at
                    };
                } else {
                    // Create new interview object
                    const newInterview = {
                        id: crypto.randomUUID(),
                        type: selectedInterviewType,
                        date: interviewDate,
                        rating: rating,
                        completed: true,
                        created_at: new Date().toISOString()
                    };
                    updatedInterviews = [...currentInterviews, newInterview];
                }

                // Ensure we have a valid interviews array
                if (!updatedInterviews || updatedInterviews.length === 0) {
                    console.error('[DEBUG] Cannot save rating: interviews array is empty');
                    alert('Error: Cannot save rating - interview data is missing');
                    return;
                }

                // console.log('[DEBUG] Updating interviews in database:', updatedInterviews);

                // For click-based leads, create applying record first
                let applyingId = lead.applying_id;
                if (isClickBasedLead()) {
                    // console.log('[DEBUG] Creating applying record for click-based lead before saving interview rating');
                    try {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (session?.access_token) {
                            apiClient.setToken(session.access_token);
                        }
                        const newApplication = await apiClient.createApplication(lead.unique_id_job, lead.applied || false);
                        applyingId = newApplication.applyingId;
                        lead.applying_id = applyingId;
                        if (onLeadUpdate) onLeadUpdate();
                    } catch (createError) {
                        console.error('[DEBUG] Error creating applying record:', createError);
                        throw createError;
                    }
                }

                // Get user session for API token
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token) {
                    apiClient.setToken(session.access_token);
                }

                // Update via backend API
                await apiClient.updateApplication(applyingId, {
                    interviews: updatedInterviews
                });

                // console.log('[DEBUG] Interview saved successfully via backend');

                // Reset form
                setShowNewInterview(false);
                setInterviewDate('');
                setSelectedInterviewType('');

                // Update local state and refresh UI
                lead.interviews = updatedInterviews;
                triggerRerender();

                // Notify parent that state changed (for column movement)
                if (onStateChanged) {
                    onStateChanged();
                }
            } catch (err: any) {
                console.error('[DEBUG] Error saving interview:', err);
                alert('Error saving interview: ' + (err.message || 'Unknown error'));
            }
        };

        return (
            <div style={{ padding: 12, background: 'rgba(59,130,246,0.15)', borderRadius: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Users style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.8)' }} />
                        <span style={{ fontWeight: 600, color: 'white' }}>Interviews</span>
                    </div>
                    {availableTypes.length > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowNewInterview(!showNewInterview);
                            }}
                            style={{
                                padding: '4px 8px',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                color: 'white',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                borderRadius: 4,
                                fontSize: '10px',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            + Add Interview
                        </button>
                    )}
                </div>

                {/* Toon interviews (completed en upcoming) */}
                {currentInterviews.map((interview: any) => (
                    <div key={interview.id || interview.type} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        marginBottom: 8,
                        padding: '8px',
                        background: interview.completed ? 'rgba(255,255,255,0.05)' : 'rgba(245, 158, 11, 0.1)',
                        borderRadius: 6,
                        border: interview.completed ? 'none' : '1px solid rgba(245, 158, 11, 0.3)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 600, fontSize: '12px' }}>
                                {getLabel(interview.type)}:
                            </span>
                            <span style={{ fontSize: '12px' }}>
                                {new Date(interview.date).toLocaleDateString()}
                            </span>
                            {interview.completed ? (
                                <span style={{
                                    color: interview.rating ? '#10b981' : '#ef4444',
                                    fontWeight: 600,
                                    fontSize: '12px'
                                }}>
                                    {interview.rating ? 'Good' : 'Bad'}
                                </span>
                            ) : (
                                <span style={{
                                    color: '#f59e0b',
                                    fontWeight: 600,
                                    fontSize: '12px'
                                }}>
                                    Upcoming
                                </span>
                            )}
                        </div>
                        {!interview.completed && (
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        // Use interview object directly, don't rely on state
                                        try {
                                            const currentInterviews = Array.isArray(lead.interviews) ? lead.interviews : [];
                                            const interviewIndex = currentInterviews.findIndex((i: any) =>
                                                (i.id && i.id === interview.id) ||
                                                (i.type === interview.type && i.date === interview.date && !i.completed)
                                            );

                                            let updatedInterviews;
                                            if (interviewIndex >= 0) {
                                                updatedInterviews = [...currentInterviews];
                                                const existingInterview = updatedInterviews[interviewIndex]!;
                                                updatedInterviews[interviewIndex] = {
                                                    ...existingInterview,
                                                    rating: true,
                                                    completed: true
                                                };
                                            } else {
                                                const newInterview = {
                                                    id: interview.id || crypto.randomUUID(),
                                                    type: interview.type,
                                                    date: interview.date,
                                                    rating: true,
                                                    completed: true,
                                                    created_at: interview.created_at || new Date().toISOString()
                                                };
                                                updatedInterviews = [...currentInterviews, newInterview];
                                            }

                                            // For click-based leads, create applying record first
                                            let applyingId = lead.applying_id;
                                            if (isClickBasedLead()) {
                                                const { data: { session } } = await supabase.auth.getSession();
                                                if (session?.access_token) {
                                                    apiClient.setToken(session.access_token);
                                                }
                                                const newApplication = await apiClient.createApplication(lead.unique_id_job, lead.applied || false);
                                                applyingId = newApplication.applyingId;
                                                lead.applying_id = applyingId;
                                                if (onLeadUpdate) onLeadUpdate();
                                            }

                                            // Get user session for API token
                                            const { data: { session } } = await supabase.auth.getSession();
                                            if (session?.access_token) {
                                                apiClient.setToken(session.access_token);
                                            }

                                            // Update via backend API
                                            await apiClient.updateApplication(applyingId, {
                                                interviews: updatedInterviews
                                            });

                                            // Update local state
                                            lead.interviews = updatedInterviews;
                                            triggerRerender();

                                            // Notify parent that state changed
                                            if (onStateChanged) {
                                                onStateChanged();
                                            }
                                        } catch (err: any) {
                                            console.error('[DEBUG] Error saving interview rating:', err);
                                            alert('Error saving interview: ' + (err.message || 'Unknown error'));
                                        }
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                        color: '#10b981',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        borderRadius: 6,
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    Good
                                </button>
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        // Use interview object directly, don't rely on state
                                        try {
                                            const currentInterviews = Array.isArray(lead.interviews) ? lead.interviews : [];
                                            const interviewIndex = currentInterviews.findIndex((i: any) =>
                                                (i.id && i.id === interview.id) ||
                                                (i.type === interview.type && i.date === interview.date && !i.completed)
                                            );

                                            let updatedInterviews;
                                            if (interviewIndex >= 0) {
                                                updatedInterviews = [...currentInterviews];
                                                const existingInterview = updatedInterviews[interviewIndex]!;
                                                updatedInterviews[interviewIndex] = {
                                                    ...existingInterview,
                                                    rating: false,
                                                    completed: true
                                                };
                                            } else {
                                                const newInterview = {
                                                    id: interview.id || crypto.randomUUID(),
                                                    type: interview.type,
                                                    date: interview.date,
                                                    rating: false,
                                                    completed: true,
                                                    created_at: interview.created_at || new Date().toISOString()
                                                };
                                                updatedInterviews = [...currentInterviews, newInterview];
                                            }

                                            // For click-based leads, create applying record first
                                            let applyingId = lead.applying_id;
                                            if (isClickBasedLead()) {
                                                const { data: { session } } = await supabase.auth.getSession();
                                                if (session?.access_token) {
                                                    apiClient.setToken(session.access_token);
                                                }
                                                const newApplication = await apiClient.createApplication(lead.unique_id_job, lead.applied || false);
                                                applyingId = newApplication.applyingId;
                                                lead.applying_id = applyingId;
                                                if (onLeadUpdate) onLeadUpdate();
                                            }

                                            // Get user session for API token
                                            const { data: { session } } = await supabase.auth.getSession();
                                            if (session?.access_token) {
                                                apiClient.setToken(session.access_token);
                                            }

                                            // Update via backend API
                                            await apiClient.updateApplication(applyingId, {
                                                interviews: updatedInterviews
                                            });

                                            // Update local state
                                            lead.interviews = updatedInterviews;
                                            triggerRerender();

                                            // Notify parent that state changed
                                            if (onStateChanged) {
                                                onStateChanged();
                                            }
                                        } catch (err: any) {
                                            console.error('[DEBUG] Error saving interview rating:', err);
                                            alert('Error saving interview: ' + (err.message || 'Unknown error'));
                                        }
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                        color: '#ef4444',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: 6,
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    Bad
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {/* Add new interview */}
                {showNewInterview && availableTypes.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ marginBottom: 8, fontWeight: 600, fontSize: '12px' }}>Add interview</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <select value={selectedInterviewType} onChange={e => {
                                    setSelectedInterviewType(e.target.value);
                                    // Don't auto-save - let user click Good/Bad/Upcoming to save
                                }} style={{
                                    padding: '6px 12px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 6,
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    minWidth: '120px'
                                }}>
                                    <option value="" style={{ backgroundColor: '#1f2937', color: 'white' }}>Select interview type...</option>
                                    {availableTypes.map(t => (
                                        <option key={t.key} value={t.key} style={{ backgroundColor: '#1f2937', color: 'white' }}>{t.label}</option>
                                    ))}
                                </select>
                                <input type="date" value={interviewDate} onChange={e => {
                                    setInterviewDate(e.target.value);
                                    // Don't auto-save - let user click Good/Bad/Upcoming to save
                                }} style={{
                                    padding: '6px 12px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 6,
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    minWidth: '120px'
                                }} />
                            </div>
                        </div>
                        {selectedInterviewType && interviewDate && (
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    style={{
                                        padding: '6px 16px',
                                        background: '#10b981',
                                        color: 'white',
                                        border: '1px solid #10b981',
                                        borderRadius: 6,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontSize: '11px'
                                    }}
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        // Direct save using current form state
                                        if (!selectedInterviewType || !interviewDate) {
                                            alert('Please select interview type and date first');
                                            return;
                                        }
                                        await handleRating(true);
                                    }}
                                >Good</button>
                                <button
                                    style={{
                                        padding: '6px 16px',
                                        background: '#ef4444',
                                        color: 'white',
                                        border: '1px solid #ef4444',
                                        borderRadius: 6,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontSize: '11px'
                                    }}
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        // Direct save using current form state
                                        if (!selectedInterviewType || !interviewDate) {
                                            alert('Please select interview type and date first');
                                            return;
                                        }
                                        await handleRating(false);
                                    }}
                                >Bad</button>
                                <button
                                    style={{
                                        padding: '6px 16px',
                                        background: '#f59e0b',
                                        color: 'white',
                                        border: '1px solid #f59e0b',
                                        borderRadius: 6,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontSize: '11px'
                                    }}
                                    onClick={() => handleSaveInterviewDate()}
                                >Upcoming</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Interview prep section - moved inside interview flow */}
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowInterviewPrep(!showInterviewPrep); }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            width: '100%',
                            padding: '8px 12px',
                            backgroundColor: interviewPrepComplete ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                            color: interviewPrepComplete ? '#10b981' : '#3b82f6',
                            border: `1px solid ${interviewPrepComplete ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                            borderRadius: 6,
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            justifyContent: 'center'
                        }}
                    >
                        {interviewPrepComplete ? (
                            <>
                                <CheckCircle style={{ width: '14px', height: '14px' }} />
                                Interview prep complete
                            </>
                        ) : (
                            <>
                                <Target style={{ width: '14px', height: '14px', color: '#fff' }} />
                                <span style={{ color: '#fff' }}>Prep for interview</span>
                            </>
                        )}
                    </button>

                    {/* Interview prep form */}
                    {showInterviewPrep && (
                        <div style={{ marginTop: 12, padding: '12px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: 6 }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: 8, color: 'rgba(255, 255, 255, 0.9)' }}>
                                Interview Preparation Questions:
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div>
                                    <div style={{ fontSize: '10px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>
                                        What are the company's values and mission?
                                    </div>
                                    <textarea
                                        value={interviewPrepData.companyValues}
                                        onChange={(e) => setInterviewPrepData({ ...interviewPrepData, companyValues: e.target.value })}
                                        placeholder="Research and write down the company's values and mission..."
                                        style={{
                                            width: '100%',
                                            minHeight: '40px',
                                            padding: '6px 8px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 4,
                                            fontSize: '10px',
                                            resize: 'vertical',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>
                                        What are the main responsibilities for this role?
                                    </div>
                                    <textarea
                                        value={interviewPrepData.roleResponsibilities}
                                        onChange={(e) => setInterviewPrepData({ ...interviewPrepData, roleResponsibilities: e.target.value })}
                                        placeholder="List the key responsibilities and expectations..."
                                        style={{
                                            width: '100%',
                                            minHeight: '40px',
                                            padding: '6px 8px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 4,
                                            fontSize: '10px',
                                            resize: 'vertical',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>
                                        Why do you want to work for this company?
                                    </div>
                                    <textarea
                                        value={interviewPrepData.whyCompany}
                                        onChange={(e) => setInterviewPrepData({ ...interviewPrepData, whyCompany: e.target.value })}
                                        placeholder="Prepare your reasons and motivation..."
                                        style={{
                                            width: '100%',
                                            minHeight: '40px',
                                            padding: '6px 8px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 4,
                                            fontSize: '10px',
                                            resize: 'vertical',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSaveInterviewPrep();
                                        setShowInterviewPrep(false);
                                    }}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                        color: '#10b981',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        borderRadius: 6,
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        alignSelf: 'flex-start'
                                    }}
                                >
                                    Mark as Complete
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Render stage-specific content
    const renderStageContent = () => {
        // Prospects stage: basic job info with apply option
        if (!lead.applied) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Apply buttons with countdown inside */}
                    <div style={{ padding: 12, background: 'rgba(59, 130, 246, 0.08)', borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <Target style={{ width: '14px', height: '14px', color: '#3b82f6' }} />
                            <span style={{ fontWeight: 600, fontSize: '12px', color: 'white' }}>Applied?</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: foundTimeLeft ? 12 : 0 }}>
                            <button onClick={(e) => { e.stopPropagation(); handleAppliedClick(true); }} style={{ padding: '8px 16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '600', backdropFilter: 'blur(10px)', transition: 'all 0.2s ease' }}>YES</button>
                            <button onClick={(e) => { e.stopPropagation(); handleAppliedClick(false); }} style={{ padding: '8px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '600', backdropFilter: 'blur(10px)', transition: 'all 0.2s ease' }}>NO</button>
                        </div>

                        {/* Countdown timer inside Applied? box */}
                        {foundTimeLeft && (
                            <div style={{
                                padding: 8,
                                background: foundIsOverdue ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                                borderRadius: 6,
                                border: `1px solid ${foundIsOverdue ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.2)'}`
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <Timer style={{ width: '12px', height: '12px', color: foundIsOverdue ? '#ef4444' : 'white' }} />
                                    <span style={{
                                        fontWeight: 600,
                                        fontSize: '11px',
                                        color: foundIsOverdue ? '#ef4444' : 'white'
                                    }}>
                                        {foundIsOverdue ? 'Expired' : 'Apply now or the job will be deleted'}
                                    </span>
                                </div>
                                <div style={{ fontSize: '10px', color: foundIsOverdue ? '#ef4444' : 'white', fontWeight: 600 }}>
                                    {foundIsOverdue ? 'This job opportunity has expired' : `${foundTimeLeft} remaining`}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* What did you send? flow */}
                    {showWhatSentFlow && (
                        <div style={{
                            padding: 12,
                            background: 'rgba(147, 51, 234, 0.08)',
                            borderRadius: 8,
                            border: '1px solid rgba(147, 51, 234, 0.3)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                                <CheckCircle style={{ width: '14px', height: '14px', color: '#9333ea' }} />
                                <span style={{ fontWeight: 600, fontSize: '12px', color: 'white' }}>What did you send?</span>
                            </div>

                            {/* Checkboxes */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={sentCV}
                                        onChange={(e) => setSentCV(e.target.checked)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '11px', color: 'white' }}>CV</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={sentPortfolio}
                                        onChange={(e) => setSentPortfolio(e.target.checked)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '11px', color: 'white' }}>Portfolio</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={sentCoverLetter}
                                        onChange={(e) => setSentCoverLetter(e.target.checked)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '11px', color: 'white' }}>Cover Letter</span>
                                </label>
                            </div>

                            {/* Confirm/Cancel buttons */}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleConfirmApplication(); }}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                        color: '#10b981',
                                        border: '1px solid rgba(16, 185, 129, 0.4)',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    Confirm
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleCancelApplication(); }}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                        color: '#ef4444',
                                        border: '1px solid rgba(239, 68, 68, 0.4)',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // Check if job has interviews (for Opportunity stage)
        const hasInterviews = lead.interviews && lead.interviews.length > 0;
        // console.log(hasInterviews, "hasInterviews - build fix");

        // Lead stage: applied but no interviews yet
        if (lead.applied && lead.got_the_job !== true && !hasInterviews) {


            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Follow-up reminder - MOVED TO TOP */}
                    {timeLeft && (
                        <div style={{ padding: 12, background: 'rgba(245, 158, 11, 0.08)', borderRadius: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                <Timer style={{ width: '14px', height: '14px', color: isOverdue ? '#ef4444' : '#f59e0b' }} />
                                <span style={{ fontWeight: 600, fontSize: '12px', color: isOverdue ? '#ef4444' : '#f59e0b' }}>Follow-up</span>
                            </div>
                            <div style={{
                                marginBottom: 8
                            }}>
                                <span style={{ fontSize: '11px', color: isOverdue ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>
                                    {timeLeft}
                                </span>
                            </div>

                            {/* Follow-up message input */}
                            <div style={{ marginBottom: 8 }}>
                                <textarea
                                    placeholder="Paste your followup message..."
                                    value={followUpMessage}
                                    onChange={(e) => {
                                        setFollowUpMessage(e.target.value);
                                        // Silent auto-save after user stops typing
                                        debouncedSave('follow_up_message', e.target.value);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        width: '100%',
                                        minHeight: '30px', // Half the height of notes textbox
                                        padding: '8px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: 4,
                                        fontSize: '11px',
                                        resize: 'vertical',
                                        fontFamily: 'inherit',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (followUpMessage.trim()) {
                                        // Update the lead's follow_up_message first
                                        lead.follow_up_message = followUpMessage;
                                        handleFollowUpComplete(true);
                                    }
                                }}
                                disabled={!followUpMessage.trim()}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: followUpMessage.trim() ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                                    color: followUpMessage.trim() ? '#10b981' : 'rgba(255, 255, 255, 0.3)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    borderRadius: 6,
                                    fontSize: '11px',
                                    cursor: followUpMessage.trim() ? 'pointer' : 'not-allowed',
                                    fontWeight: '600'
                                }}
                            >
                                Mark Complete
                            </button>
                        </div>
                    )}

                    {/* Completed follow-up message */}
                    {lead.follow_up_completed && lead.follow_up_message && (
                        <div style={{ padding: 12, background: 'rgba(16, 185, 129, 0.08)', borderRadius: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                <CheckCircle style={{ width: '14px', height: '14px', color: '#10b981' }} />
                                <span style={{ fontWeight: 600, fontSize: '12px', color: '#10b981' }}>Follow-up Completed</span>
                            </div>
                            <textarea
                                value={lead.follow_up_message}
                                readOnly
                                style={{
                                    width: '100%',
                                    minHeight: '30px', // Half the height of notes textbox
                                    padding: '8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 4,
                                    fontSize: '11px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    boxSizing: 'border-box',
                                    cursor: 'text'
                                }}
                            />
                        </div>
                    )}

                    {/* Enhanced Lead Column Features */}
                    <div style={{ padding: 12, background: 'rgba(147, 51, 234, 0.08)', borderRadius: 8, border: '1px solid rgba(147, 51, 234, 0.3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                            <Users style={{ width: '14px', height: '14px', color: '#9333ea' }} />
                            <span style={{ fontWeight: 600, fontSize: '12px', color: 'white' }}>Application Details</span>
                        </div>

                        {/* Application time */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '11px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>How much time did it take to apply (minutes)?</div>
                            <input
                                type="text"
                                placeholder="e.g. 30"
                                value={applicationTimeMinutes}
                                onChange={(e) => {
                                    setApplicationTimeMinutes(e.target.value);
                                    debouncedSave('application_time_minutes', e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 4,
                                    fontSize: '11px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Match confidence */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '11px', marginBottom: 6, color: 'rgba(255, 255, 255, 0.7)' }}>How well do you match? (Rate, qualification, duration)</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMatchConfidence(true);
                                        debouncedSave('match_confidence', true);
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: matchConfidence === true ? '#10b981' : 'rgba(16, 185, 129, 0.1)',
                                        color: matchConfidence === true ? '#ffffff' : '#10b981',
                                        border: `1px solid ${matchConfidence === true ? '#10b981' : 'rgba(16, 185, 129, 0.3)'}`,
                                        borderRadius: 6,
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    GOOD
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMatchConfidence(false);
                                        debouncedSave('match_confidence', false);
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: matchConfidence === false ? '#ef4444' : 'rgba(239, 68, 68, 0.1)',
                                        color: matchConfidence === false ? '#ffffff' : '#ef4444',
                                        border: `1px solid ${matchConfidence === false ? '#ef4444' : 'rgba(239, 68, 68, 0.3)'}`,
                                        borderRadius: 6,
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    BAD
                                </button>
                            </div>
                        </div>

                        {/* Received confirmation */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '11px', marginBottom: 6, color: 'rgba(255, 255, 255, 0.7)' }}>Did you get a confirmation?</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setReceivedConfirmation(true);
                                        debouncedSave('received_confirmation', true);
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: receivedConfirmation === true ? '#10b981' : 'rgba(16, 185, 129, 0.1)',
                                        color: receivedConfirmation === true ? '#ffffff' : '#10b981',
                                        border: `1px solid ${receivedConfirmation === true ? '#10b981' : 'rgba(16, 185, 129, 0.3)'}`,
                                        borderRadius: 6,
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    YES
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setReceivedConfirmation(false);
                                        debouncedSave('received_confirmation', false);
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: receivedConfirmation === false ? '#ef4444' : 'rgba(239, 68, 68, 0.1)',
                                        color: receivedConfirmation === false ? '#ffffff' : '#ef4444',
                                        border: `1px solid ${receivedConfirmation === false ? '#ef4444' : 'rgba(239, 68, 68, 0.3)'}`,
                                        borderRadius: 6,
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    NO
                                </button>
                            </div>
                        </div>

                        {/* Rejection reasons prediction */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '11px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>Reasons I might not get the job:</div>
                            <textarea
                                placeholder="e.g. too expensive, not enough experience..."
                                value={rejectionReasonsPrediction}
                                onChange={(e) => {
                                    setRejectionReasonsPrediction(e.target.value);
                                    debouncedSave('rejection_reasons_prediction', e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    minHeight: '40px',
                                    padding: '6px 8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 4,
                                    fontSize: '11px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Introduced via agency */}
                        <div>
                            <div style={{ fontSize: '11px', marginBottom: 6, color: 'rgba(255, 255, 255, 0.7)' }}>Introduced via agency?</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIntroducedViaAgency(true);
                                        debouncedSave('introduced_via_agency', true);
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: introducedViaAgency === true ? '#10b981' : 'rgba(16, 185, 129, 0.1)',
                                        color: introducedViaAgency === true ? '#ffffff' : '#10b981',
                                        border: `1px solid ${introducedViaAgency === true ? '#10b981' : 'rgba(16, 185, 129, 0.3)'}`,
                                        borderRadius: 6,
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    YES
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIntroducedViaAgency(false);
                                        debouncedSave('introduced_via_agency', false);
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: introducedViaAgency === false ? '#ef4444' : 'rgba(239, 68, 68, 0.1)',
                                        color: introducedViaAgency === false ? '#ffffff' : '#ef4444',
                                        border: `1px solid ${introducedViaAgency === false ? '#ef4444' : 'rgba(239, 68, 68, 0.3)'}`,
                                        borderRadius: 6,
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    NO
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Interview flow - MOVED BELOW FOLLOW-UP */}
                    {renderInterviewFlow()}

                    {/* Contacts */}
                    <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Users style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.8)' }} />
                                <span style={{ fontWeight: 600, fontSize: '12px', color: '#fff' }}>Contacts</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowContactForm(true); }}
                                style={{
                                    padding: '4px 8px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: 4,
                                    fontSize: '10px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                + Add
                            </button>
                        </div>

                        {/* Contact list */}
                        {contacts.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {contacts.map((contact) => (
                                    <div key={contact.id} style={{
                                        padding: '8px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: 6,
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                            <span style={{ fontSize: '11px', fontWeight: 600 }}>{contact.name}</span>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingContact(contact.id); }}
                                                    style={{
                                                        padding: '2px 4px',
                                                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                                        color: '#f59e0b',
                                                        border: '1px solid rgba(245, 158, 11, 0.3)',
                                                        borderRadius: 3,
                                                        fontSize: '9px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteContact(contact.id); }}
                                                    style={{
                                                        padding: '2px 4px',
                                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                        color: '#ef4444',
                                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                                        borderRadius: 3,
                                                        fontSize: '9px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Del
                                                </button>
                                            </div>
                                        </div>
                                        {contact.email && (
                                            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: 2 }}>
                                                📧 {contact.email}
                                            </div>
                                        )}
                                        {contact.phone && (
                                            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)' }}>
                                                📞 {contact.phone}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', padding: '8px' }}>
                                No contacts added yet
                            </div>
                        )}

                        {/* Add/Edit contact form */}
                        {showContactForm && (
                            <div style={{
                                marginTop: 12,
                                padding: '12px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: 6,
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}>
                                <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: 8 }}>
                                    {editingContact ? 'Edit Contact' : 'Add New Contact'}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <input
                                        type="text"
                                        placeholder="Name *"
                                        value={newContact.name}
                                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                        style={{
                                            padding: '6px 8px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 4,
                                            fontSize: '11px'
                                        }}
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email (optional)"
                                        value={newContact.email}
                                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                        style={{
                                            padding: '6px 8px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 4,
                                            fontSize: '11px'
                                        }}
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Phone (optional)"
                                        value={newContact.phone}
                                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                        style={{
                                            padding: '6px 8px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 4,
                                            fontSize: '11px'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleSaveContact(); }}
                                        disabled={!newContact.name.trim()}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: newContact.name.trim() ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                                            color: newContact.name.trim() ? '#10b981' : 'rgba(255, 255, 255, 0.3)',
                                            border: '1px solid rgba(16, 185, 129, 0.3)',
                                            borderRadius: 4,
                                            fontSize: '11px',
                                            cursor: newContact.name.trim() ? 'pointer' : 'not-allowed',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleCancelContact(); }}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 4,
                                            fontSize: '11px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Got the job */}
                    <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <Award style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.8)' }} />
                            <span style={{ fontWeight: 600, fontSize: '12px' }}>Got the job?</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleGotJob(true); }}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    color: '#10b981',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    borderRadius: 6,
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                YES
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleGotJob(false); }}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: 6,
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                NO
                            </button>
                        </div>
                        {lead.got_the_job && (
                            <div style={{ marginTop: 8 }}>
                                <div style={{ fontSize: '11px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>Starting date (optional):</div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input
                                        type="date"
                                        value={startingDate}
                                        onChange={(e) => {
                                            setStartingDate(e.target.value);
                                            // Silent auto-save after typing
                                            debouncedSave('starting_date', e.target.value);
                                        }}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 6,
                                            fontSize: '11px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                </div>
                                {/* Congratulations message */}
                                <div style={{
                                    marginTop: 8,
                                    padding: '8px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: 6,
                                    border: '1px solid rgba(16, 185, 129, 0.3)'
                                }}>
                                    <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, marginBottom: 4 }}>
                                        🎉 Congratulations! You got the job!
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)' }}>
                                        Potential earnings: €100,000
                                    </div>
                                </div>

                                {/* Archive button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleArchiveJob(); }}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: 'rgba(156, 163, 175, 0.1)',
                                        color: '#9ca3af',
                                        border: '1px solid rgba(156, 163, 175, 0.3)',
                                        borderRadius: 6,
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        marginTop: 8,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4
                                    }}
                                >
                                    <Archive style={{ width: '12px', height: '12px' }} />
                                    Archive Job
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // Opportunity stage: applied, has interviews, but not got the job yet
        if (lead.applied && lead.got_the_job !== true && hasInterviews) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Interview flow */}
                    {renderInterviewFlow()}

                    {/* Enhanced Opportunity Column Features */}
                    <div style={{ padding: 12, background: 'rgba(245, 158, 11, 0.08)', borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                            <Award style={{ width: '14px', height: '14px', color: '#f59e0b' }} />
                            <span style={{ fontWeight: 600, fontSize: '12px', color: 'white' }}>Interview Insights</span>
                        </div>

                        {/* Follow-up date */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '11px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>When are they going to get back at you?</div>
                            <input
                                type="date"
                                value={followUpDate}
                                onChange={(e) => {
                                    // console.log('[TYPING] follow_up_date:', e.target.value);
                                    setFollowUpDate(e.target.value);
                                    debouncedSave('follow_up_date', e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 4,
                                    fontSize: '11px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* What went well */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '11px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>Name one thing that went well:</div>
                            <textarea
                                placeholder="e.g. great chemistry with team..."
                                value={interviewWentWell}
                                onChange={(e) => {
                                    // console.log('[TYPING] interview_went_well:', e.target.value);
                                    setInterviewWentWell(e.target.value);
                                    debouncedSave('interview_went_well', e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    minHeight: '40px',
                                    padding: '6px 8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 4,
                                    fontSize: '11px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* What can improve */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '11px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>Name one thing you can improve:</div>
                            <textarea
                                placeholder="e.g. speak more confidently about pricing..."
                                value={interviewCanImprove}
                                onChange={(e) => {
                                    // console.log('[TYPING] interview_can_improve:', e.target.value);
                                    setInterviewCanImprove(e.target.value);
                                    debouncedSave('interview_can_improve', e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    minHeight: '40px',
                                    padding: '6px 8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 4,
                                    fontSize: '11px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Offer rate alignment */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '11px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>Was their offer in line with your rate?</div>
                            <textarea
                                placeholder="e.g. yes, exactly what I asked for..."
                                value={offerRateAlignment}
                                onChange={(e) => {
                                    // console.log('[TYPING] offer_rate_alignment:', e.target.value);
                                    setOfferRateAlignment(e.target.value);
                                    debouncedSave('offer_rate_alignment', e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    minHeight: '40px',
                                    padding: '6px 8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 4,
                                    fontSize: '11px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Prediction accuracy */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '11px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>Were you correct naming the reason you didn't get the job?</div>
                            <textarea
                                placeholder="Only fill if you didn't get the job..."
                                value={predictionAccuracy}
                                onChange={(e) => {
                                    // console.log('[TYPING] prediction_accuracy:', e.target.value);
                                    setPredictionAccuracy(e.target.value);
                                    debouncedSave('prediction_accuracy', e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    minHeight: '40px',
                                    padding: '6px 8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 4,
                                    fontSize: '11px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Thank you note */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '11px', marginBottom: 6, color: 'rgba(255, 255, 255, 0.7)' }}>Did you write a thank you note?</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // console.log('[CLICK] sent_thank_you_note: true');
                                        setSentThankYouNote(true);
                                        debouncedSave('sent_thank_you_note', true);
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: sentThankYouNote === true ? '#10b981' : 'rgba(16, 185, 129, 0.1)',
                                        color: sentThankYouNote === true ? '#ffffff' : '#10b981',
                                        border: `1px solid ${sentThankYouNote === true ? '#10b981' : 'rgba(16, 185, 129, 0.3)'}`,
                                        borderRadius: 6,
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    YES
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // console.log('[CLICK] sent_thank_you_note: false');
                                        setSentThankYouNote(false);
                                        debouncedSave('sent_thank_you_note', false);
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: sentThankYouNote === false ? '#ef4444' : 'rgba(239, 68, 68, 0.1)',
                                        color: sentThankYouNote === false ? '#ffffff' : '#ef4444',
                                        border: `1px solid ${sentThankYouNote === false ? '#ef4444' : 'rgba(239, 68, 68, 0.3)'}`,
                                        borderRadius: 6,
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    NO
                                </button>
                            </div>
                        </div>

                        {/* Rejection reason mentioned */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '11px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>Why did they mention you didn't get the contract?</div>
                            <textarea
                                placeholder="Only fill if you didn't get the job..."
                                value={rejectionReasonMentioned}
                                onChange={(e) => {
                                    // console.log('[TYPING] rejection_reason_mentioned:', e.target.value);
                                    setRejectionReasonMentioned(e.target.value);
                                    debouncedSave('rejection_reason_mentioned', e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    minHeight: '40px',
                                    padding: '6px 8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 4,
                                    fontSize: '11px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Why got interview */}
                        <div>
                            <div style={{ fontSize: '11px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>Why did you get an interview?</div>
                            <textarea
                                placeholder="e.g. perfect experience match, portfolio impressed them..."
                                value={whyGotInterview}
                                onChange={(e) => {
                                    // console.log('[TYPING] why_got_interview:', e.target.value);
                                    setWhyGotInterview(e.target.value);
                                    debouncedSave('why_got_interview', e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    minHeight: '40px',
                                    padding: '6px 8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 4,
                                    fontSize: '11px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    {/* Contacts */}
                    <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Users style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.8)' }} />
                                <span style={{ fontWeight: 600, fontSize: '12px', color: '#fff' }}>Contacts</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowContactForm(true); }}
                                style={{
                                    padding: '4px 8px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: 4,
                                    fontSize: '10px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                + Add
                            </button>
                        </div>

                        {/* Contact list */}
                        {contacts.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {contacts.map((contact) => (
                                    <div key={contact.id} style={{
                                        padding: '8px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: 6,
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                            <span style={{ fontSize: '11px', fontWeight: 600 }}>{contact.name}</span>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingContact(contact.id); }}
                                                    style={{
                                                        padding: '2px 4px',
                                                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                                        color: '#f59e0b',
                                                        border: '1px solid rgba(245, 158, 11, 0.3)',
                                                        borderRadius: 3,
                                                        fontSize: '9px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteContact(contact.id); }}
                                                    style={{
                                                        padding: '2px 4px',
                                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                        color: '#ef4444',
                                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                                        borderRadius: 3,
                                                        fontSize: '9px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Del
                                                </button>
                                            </div>
                                        </div>
                                        {contact.email && (
                                            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: 2 }}>
                                                📧 {contact.email}
                                            </div>
                                        )}
                                        {contact.phone && (
                                            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)' }}>
                                                📞 {contact.phone}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', padding: '8px' }}>
                                No contacts added yet
                            </div>
                        )}

                        {/* Add/Edit contact form */}
                        {showContactForm && (
                            <div style={{
                                marginTop: 12,
                                padding: '12px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: 6,
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}>
                                <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: 8 }}>
                                    {editingContact ? 'Edit Contact' : 'Add New Contact'}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <input
                                        type="text"
                                        placeholder="Name *"
                                        value={newContact.name}
                                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                        style={{
                                            padding: '6px 8px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 4,
                                            fontSize: '11px'
                                        }}
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email (optional)"
                                        value={newContact.email}
                                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                        style={{
                                            padding: '6px 8px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 4,
                                            fontSize: '11px'
                                        }}
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Phone (optional)"
                                        value={newContact.phone}
                                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                        style={{
                                            padding: '6px 8px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 4,
                                            fontSize: '11px'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleSaveContact(); }}
                                        disabled={!newContact.name.trim()}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: newContact.name.trim() ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                                            color: newContact.name.trim() ? '#10b981' : 'rgba(255, 255, 255, 0.3)',
                                            border: '1px solid rgba(16, 185, 129, 0.3)',
                                            borderRadius: 4,
                                            fontSize: '11px',
                                            cursor: newContact.name.trim() ? 'pointer' : 'not-allowed',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleCancelContact(); }}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 4,
                                            fontSize: '11px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Got the job */}
                    <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <Award style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.8)' }} />
                            <span style={{ fontWeight: 600, fontSize: '12px' }}>Got the job?</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleGotJob(true); }}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    color: '#10b981',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    borderRadius: 6,
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                YES
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleGotJob(false); }}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: 6,
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                NO
                            </button>
                        </div>
                        {lead.got_the_job && (
                            <div style={{ marginTop: 8 }}>
                                <div style={{ fontSize: '11px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>Starting date (optional):</div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input
                                        type="date"
                                        value={startingDate}
                                        onChange={(e) => {
                                            setStartingDate(e.target.value);
                                            // Silent auto-save after typing
                                            debouncedSave('starting_date', e.target.value);
                                        }}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 6,
                                            fontSize: '11px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                </div>
                                {/* Congratulations message */}
                                <div style={{
                                    marginTop: 8,
                                    padding: '8px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: 6,
                                    border: '1px solid rgba(16, 185, 129, 0.3)'
                                }}>
                                    <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, marginBottom: 4 }}>
                                        🎉 Congratulations! You got the job!
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)' }}>
                                        Potential earnings: €100,000
                                    </div>
                                </div>

                                {/* Archive button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleArchiveJob(); }}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: 'rgba(156, 163, 175, 0.1)',
                                        color: '#9ca3af',
                                        border: '1px solid rgba(156, 163, 175, 0.3)',
                                        borderRadius: 6,
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        marginTop: 8,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4
                                    }}
                                >
                                    <Archive style={{ width: '12px', height: '12px' }} />
                                    Archive Job
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // Deal stage: got the job
        if (lead.applied && lead.got_the_job === true) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Interview flow */}
                    {renderInterviewFlow()}

                    {/* Contacts */}
                    <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Users style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.8)' }} />
                                <span style={{ fontWeight: 600, fontSize: '12px', color: '#fff' }}>Contacts</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowContactForm(true); }}
                                style={{
                                    padding: '4px 8px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: 4,
                                    fontSize: '10px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                + Add
                            </button>
                        </div>

                        {/* Contact list */}
                        {contacts.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {contacts.map((contact) => (
                                    <div key={contact.id} style={{
                                        padding: '8px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: 6,
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                            <span style={{ fontSize: '11px', fontWeight: 600 }}>{contact.name}</span>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingContact(contact.id); }}
                                                    style={{
                                                        padding: '2px 4px',
                                                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                                        color: '#f59e0b',
                                                        border: '1px solid rgba(245, 158, 11, 0.3)',
                                                        borderRadius: 3,
                                                        fontSize: '9px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteContact(contact.id); }}
                                                    style={{
                                                        padding: '2px 4px',
                                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                        color: '#ef4444',
                                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                                        borderRadius: 3,
                                                        fontSize: '9px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Del
                                                </button>
                                            </div>
                                        </div>
                                        {contact.email && (
                                            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: 2 }}>
                                                📧 {contact.email}
                                            </div>
                                        )}
                                        {contact.phone && (
                                            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)' }}>
                                                📞 {contact.phone}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', padding: '8px' }}>
                                No contacts added yet
                            </div>
                        )}

                        {/* Add/Edit contact form */}
                        {showContactForm && (
                            <div style={{
                                marginTop: 12,
                                padding: '12px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: 6,
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}>
                                <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: 8 }}>
                                    {editingContact ? 'Edit Contact' : 'Add New Contact'}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <input
                                        type="text"
                                        placeholder="Name *"
                                        value={newContact.name}
                                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                        style={{
                                            padding: '6px 8px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 4,
                                            fontSize: '11px'
                                        }}
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email (optional)"
                                        value={newContact.email}
                                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                        style={{
                                            padding: '6px 8px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 4,
                                            fontSize: '11px'
                                        }}
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Phone (optional)"
                                        value={newContact.phone}
                                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                        style={{
                                            padding: '6px 8px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 4,
                                            fontSize: '11px'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleSaveContact(); }}
                                        disabled={!newContact.name.trim()}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: newContact.name.trim() ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                                            color: newContact.name.trim() ? '#10b981' : 'rgba(255, 255, 255, 0.3)',
                                            border: '1px solid rgba(16, 185, 129, 0.3)',
                                            borderRadius: 4,
                                            fontSize: '11px',
                                            cursor: newContact.name.trim() ? 'pointer' : 'not-allowed',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleCancelContact(); }}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 4,
                                            fontSize: '11px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Got the job */}
                    <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <Award style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.8)' }} />
                            <span style={{ fontWeight: 600, fontSize: '12px' }}>Got the job?</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleGotJob(true); }}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    color: '#10b981',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    borderRadius: 6,
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                YES
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleGotJob(false); }}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: 6,
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                NO
                            </button>
                        </div>
                        {lead.got_the_job && (
                            <div style={{ marginTop: 8 }}>
                                <div style={{ fontSize: '11px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>Starting date (optional):</div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input
                                        type="date"
                                        value={startingDate}
                                        onChange={(e) => {
                                            setStartingDate(e.target.value);
                                            // Silent auto-save after typing
                                            debouncedSave('starting_date', e.target.value);
                                        }}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 6,
                                            fontSize: '11px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                </div>
                                {/* Congratulations message */}
                                <div style={{
                                    marginTop: 8,
                                    padding: '8px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: 6,
                                    border: '1px solid rgba(16, 185, 129, 0.3)'
                                }}>
                                    <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, marginBottom: 4 }}>
                                        🎉 Congratulations! You got the job!
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: 8 }}>
                                        Potential earnings: €100,000
                                    </div>

                                    {/* Archive button */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleArchiveJob(); }}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: 'rgba(156, 163, 175, 0.1)',
                                            color: '#9ca3af',
                                            border: '1px solid rgba(156, 163, 175, 0.3)',
                                            borderRadius: 6,
                                            fontSize: '10px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4
                                        }}
                                    >
                                        <Archive style={{ width: '10px', height: '10px' }} />
                                        Archive Job
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Interview flow */}
                    {renderInterviewFlow()}

                    {/* Enhanced Deal Column Features */}
                    <div style={{ padding: 12, background: 'rgba(16, 185, 129, 0.08)', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                            <Award style={{ width: '14px', height: '14px', color: '#10b981' }} />
                            <span style={{ fontWeight: 600, fontSize: '12px', color: 'white' }}>Contract Details</span>
                        </div>

                        {/* Start date */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '11px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>When will I start?</div>
                            <input
                                type="date"
                                value={jobStartDate}
                                onChange={(e) => {
                                    setJobStartDate(e.target.value);
                                    debouncedSave('job_start_date', e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 4,
                                    fontSize: '11px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Contract signing date */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '11px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>When signing contract?</div>
                            <input
                                type="date"
                                value={contractSigningDate}
                                onChange={(e) => {
                                    setContractSigningDate(e.target.value);
                                    debouncedSave('contract_signing_date', e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 4,
                                    fontSize: '11px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Hourly rate */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '11px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>What's the job rate? (hourly)</div>
                            <input
                                type="text"
                                placeholder="e.g. €75/hour"
                                value={jobHourlyRate}
                                onChange={(e) => {
                                    setJobHourlyRate(e.target.value);
                                    debouncedSave('job_hourly_rate', e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 4,
                                    fontSize: '11px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Hours per week */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '11px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>How many hours a week is this job?</div>
                            <input
                                type="text"
                                placeholder="e.g. 40 hours"
                                value={hoursPerWeek}
                                onChange={(e) => {
                                    setHoursPerWeek(e.target.value);
                                    debouncedSave('hours_per_week', e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 4,
                                    fontSize: '11px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Job length */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '11px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>Total length of the job? (end date)</div>
                            <input
                                type="date"
                                value={jobTotalLength}
                                onChange={(e) => {
                                    setJobTotalLength(e.target.value);
                                    debouncedSave('job_total_length', e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 4,
                                    fontSize: '11px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Client rating */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '11px', marginBottom: 6, color: 'rgba(255, 255, 255, 0.7)' }}>Rate us? (1-5 stars)</div>
                            <div style={{ display: 'flex', gap: 4 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setClientRating(star);
                                            debouncedSave('client_rating', star);
                                        }}
                                        style={{
                                            padding: '4px 8px',
                                            backgroundColor: clientRating >= star ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                            color: clientRating >= star ? '#ffc107' : 'rgba(255, 255, 255, 0.5)',
                                            border: `1px solid ${clientRating >= star ? 'rgba(255, 193, 7, 0.4)' : 'rgba(255, 255, 255, 0.2)'}`,
                                            borderRadius: 4,
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                        }}
                                    >
                                        <Star style={{ width: '12px', height: '12px' }} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Payment interval */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '11px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>What payment interval for this job?</div>
                            <input
                                type="text"
                                placeholder="e.g. monthly, bi-weekly, per milestone..."
                                value={paymentInterval}
                                onChange={(e) => {
                                    setPaymentInterval(e.target.value);
                                    debouncedSave('payment_interval', e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 4,
                                    fontSize: '11px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Why they loved you */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '11px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>Why do you think they loved you?</div>
                            <textarea
                                placeholder="e.g. perfect cultural fit, technical expertise..."
                                value={whyTheyLovedYou}
                                onChange={(e) => {
                                    setWhyTheyLovedYou(e.target.value);
                                    debouncedSave('why_they_loved_you', e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    minHeight: '40px',
                                    padding: '6px 8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 4,
                                    fontSize: '11px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* What you did well */}
                        <div>
                            <div style={{ fontSize: '11px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>Name one thing you did well:</div>
                            <textarea
                                placeholder="e.g. communicated clearly, delivered on time..."
                                value={whatYouDidWell}
                                onChange={(e) => {
                                    setWhatYouDidWell(e.target.value);
                                    debouncedSave('what_you_did_well', e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    minHeight: '40px',
                                    padding: '6px 8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: 4,
                                    fontSize: '11px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    {/* Contacts */}
                    <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Users style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.8)' }} />
                                <span style={{ fontWeight: 600, fontSize: '12px', color: '#fff' }}>Contacts</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowContactForm(true); }}
                                style={{
                                    padding: '4px 8px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: 4,
                                    fontSize: '10px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                + Add
                            </button>
                        </div>

                        {/* Contact list */}
                        {contacts.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {contacts.map((contact) => (
                                    <div key={contact.id} style={{
                                        padding: '8px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: 6,
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                            <span style={{ fontSize: '11px', fontWeight: 600 }}>{contact.name}</span>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingContact(contact.id); }}
                                                    style={{
                                                        padding: '2px 4px',
                                                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                                        color: '#f59e0b',
                                                        border: '1px solid rgba(245, 158, 11, 0.3)',
                                                        borderRadius: 3,
                                                        fontSize: '9px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteContact(contact.id); }}
                                                    style={{
                                                        padding: '2px 4px',
                                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                        color: '#ef4444',
                                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                                        borderRadius: 3,
                                                        fontSize: '9px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Del
                                                </button>
                                            </div>
                                        </div>
                                        {contact.email && (
                                            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: 2 }}>
                                                📧 {contact.email}
                                            </div>
                                        )}
                                        {contact.phone && (
                                            <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)' }}>
                                                📞 {contact.phone}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', padding: '8px' }}>
                                No contacts added yet
                            </div>
                        )}

                        {/* Add/Edit contact form */}
                        {showContactForm && (
                            <div style={{
                                marginTop: 12,
                                padding: '12px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: 6,
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}>
                                <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: 8 }}>
                                    {editingContact ? 'Edit Contact' : 'Add New Contact'}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <input
                                        type="text"
                                        placeholder="Name *"
                                        value={newContact.name}
                                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                        style={{
                                            padding: '6px 8px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 4,
                                            fontSize: '11px'
                                        }}
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email (optional)"
                                        value={newContact.email}
                                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                        style={{
                                            padding: '6px 8px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 4,
                                            fontSize: '11px'
                                        }}
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Phone (optional)"
                                        value={newContact.phone}
                                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                        style={{
                                            padding: '6px 8px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 4,
                                            fontSize: '11px'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleSaveContact(); }}
                                        disabled={!newContact.name.trim()}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: newContact.name.trim() ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                                            color: newContact.name.trim() ? '#10b981' : 'rgba(255, 255, 255, 0.3)',
                                            border: '1px solid rgba(16, 185, 129, 0.3)',
                                            borderRadius: 4,
                                            fontSize: '11px',
                                            cursor: newContact.name.trim() ? 'pointer' : 'not-allowed',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleCancelContact(); }}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 4,
                                            fontSize: '11px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Got the job */}
                    <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <Award style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.8)' }} />
                            <span style={{ fontWeight: 600, fontSize: '12px' }}>Got the job?</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleGotJob(true); }}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    color: '#10b981',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    borderRadius: 6,
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                YES
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleGotJob(false); }}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: 6,
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                NO
                            </button>
                        </div>
                        {lead.got_the_job && (
                            <div style={{ marginTop: 8 }}>
                                <div style={{ fontSize: '11px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>Starting date (optional):</div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input
                                        type="date"
                                        value={startingDate}
                                        onChange={(e) => {
                                            setStartingDate(e.target.value);
                                            // Silent auto-save after typing
                                            debouncedSave('starting_date', e.target.value);
                                        }}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: 6,
                                            fontSize: '11px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                </div>
                                {/* Congratulations message */}
                                <div style={{
                                    marginTop: 8,
                                    padding: '8px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: 6,
                                    border: '1px solid rgba(16, 185, 129, 0.3)'
                                }}>
                                    <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, marginBottom: 4 }}>
                                        🎉 Congratulations! You got the job!
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: 8 }}>
                                        Potential earnings: €100,000
                                    </div>

                                    {/* Archive button */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleArchiveJob(); }}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: 'rgba(156, 163, 175, 0.1)',
                                            color: '#9ca3af',
                                            border: '1px solid rgba(156, 163, 175, 0.3)',
                                            borderRadius: 6,
                                            fontSize: '10px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4
                                        }}
                                    >
                                        <Archive style={{ width: '10px', height: '10px' }} />
                                        Archive Job
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // Fallback (shouldn't happen)
        return null;
    };

    // Render the card based on collapsed state
    if (isCollapsed) {
        return (
            <div
                style={{
                    background: isDragging
                        ? 'rgba(255, 255, 255, 0.95)'
                        : 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: isDragging
                        ? '0 10px 25px rgba(0, 0, 0, 0.15)'
                        : '0 2px 8px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.2s ease',
                    transform: isDragging ? 'scale(1.02)' : 'scale(1)',
                    position: 'relative',
                    marginBottom: '8px'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        {/* Job title */}
                        <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: 'white',
                            marginBottom: '8px',
                            lineHeight: '1.2'
                        }}>
                            {lead.job_title_clicked}
                        </div>

                        {/* Interview info */}
                        {getLatestInterviewInfo() && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginTop: '6px',
                                fontSize: '11px',
                                color: 'rgba(255, 255, 255, 0.7)'
                            }}>
                                <Calendar style={{ width: '12px', height: '12px' }} />
                                <span>{getLatestInterviewInfo()}</span>
                            </div>
                        )}

                        {/* Progress bar */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '8px',
                            marginRight: '60px' // Make room for buttons
                        }}>
                            <span style={{
                                fontSize: '11px',
                                color: 'rgba(255, 255, 255, 0.6)',
                                minWidth: '30px'
                            }}>
                                {progressPercentage}%
                            </span>
                            <div style={{
                                flex: 1,
                                height: '4px',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '3px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${progressPercentage}%`,
                                    height: '100%',
                                    backgroundColor: progressPercentage === 100 ? '#10b981' : '#3b82f6',
                                    borderRadius: '3px',
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        {/* Delete button - only for Prospects stage (not applied) */}
                        {!lead.applied && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAppliedClick(false); // Same as clicking "No"
                                }}
                                style={{
                                    padding: '4px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                                title="Remove job"
                            >
                                <X style={{ width: '12px', height: '12px' }} />
                            </button>
                        )}

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCollapse(false);
                            }}
                            style={{
                                padding: '4px',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: 'rgba(255, 255, 255, 0.7)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                            title="Expand"
                        >
                            <Maximize2 style={{ width: '12px', height: '12px' }} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Full card view
    return (
        <div
            onClick={onClick}
            style={{
                background: isDragging
                    ? 'rgba(255, 255, 255, 0.95)'
                    : 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: isDragging
                    ? '0 10px 25px rgba(0, 0, 0, 0.15)'
                    : '0 2px 8px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: isDragging ? 'scale(1.02)' : 'scale(1)',
                position: 'relative',
                minHeight: '300px',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Header with title and buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                    {/* Job title */}
                    <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: 'white',
                        marginBottom: '4px',
                        lineHeight: '1.3'
                    }}>
                        {lead.job_title_clicked}
                    </h3>

                    {/* Action buttons row */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginTop: '8px'
                    }}>
                        {/* View Job button */}
                        {lead.url_clicked && (
                            <a
                                href={lead.url_clicked}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 8px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                    border: '1px solid rgba(59, 130, 246, 0.4)',
                                    borderRadius: '6px',
                                    color: '#fff',
                                    textDecoration: 'none',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ExternalLink style={{ width: '12px', height: '12px' }} />
                                View Job
                            </a>
                        )}

                        {/* Job Summary button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowSummaryModal(true);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px',
                                backgroundColor: 'rgba(147, 51, 234, 0.2)',
                                border: '1px solid rgba(147, 51, 234, 0.4)',
                                borderRadius: '6px',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Info style={{ width: '12px', height: '12px' }} />
                            Job Summary
                        </button>
                    </div>
                </div>

                {/* Collapse button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleToggleCollapse(true);
                    }}
                    style={{
                        padding: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginLeft: '8px',
                        flexShrink: 0
                    }}
                >
                    <Minimize2 style={{ width: '12px', height: '12px' }} />
                </button>
            </div>

            {/* Header with priority and follow-up */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Follow-up bell */}
                    {hasFollowUp && (
                        <Bell
                            style={{
                                width: '14px',
                                height: '14px',
                                color: '#f59e0b',
                                flexShrink: 0
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Company, location and rate */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.7)',
                flexWrap: 'wrap'
            }}>
                <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500' }}>{lead.company_clicked}</span>
                {lead.location_clicked && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin style={{ width: '12px', height: '12px' }} />
                        <span>{lead.location_clicked}</span>
                    </div>
                )}
                {lead.rate_clicked && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <DollarSign style={{ width: '12px', height: '12px' }} />
                        <span>{lead.rate_clicked}</span>
                    </div>
                )}
            </div>

            {/* Stage-specific content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {renderStageContent()}
            </div>

            {/* Notes section at the bottom */}
            <div style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '8px'
                }}>
                    <StickyNote style={{ width: '14px', height: '14px', color: 'rgba(255, 255, 255, 0.7)' }} />
                    <span style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontWeight: '500'
                    }}>
                        Notes
                    </span>
                </div>
                <textarea
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Add your notes..."
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: '100%',
                        minHeight: '30px',
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '12px',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            {/* Job Summary Modal */}
            <JobSummaryModal
                isOpen={showSummaryModal}
                onClose={() => setShowSummaryModal(false)}
                jobTitle={lead.job_title_clicked}
                summary={lead.summary_clicked}
                jobUrl={lead.url_clicked}
            />
        </div>
    );
};

export default LeadCard; 