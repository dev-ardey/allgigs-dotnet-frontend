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
    Archive
} from 'lucide-react';
// import { Lead } from '../../types/leads';
import { supabase } from '../../SupabaseClient';

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
        rating: boolean;
    }>;
}

interface LeadCardProps {
    lead: JobClickWithApplying;
    onClick: () => void;
    isDragging: boolean;
    hasFollowUp: boolean;
    onStageAction?: (action: string, data?: any) => void;
    onArchived?: (leadId: string) => void;
    onStateChanged?: () => void;
    index: number;
}

const LeadCard: React.FC<LeadCardProps> = ({
    lead,
    onClick,
    isDragging,
    hasFollowUp,
    onStageAction,
    onArchived,
    onStateChanged
}) => {
    // Timer states
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isOverdue, setIsOverdue] = useState(false);
    const [foundTimeLeft, setFoundTimeLeft] = useState<string>('');
    const [foundIsOverdue, setFoundIsOverdue] = useState(false);
    const [notes, setNotes] = useState(lead.notes || '');

    // Silent auto-save function (no visual feedback)
    const debouncedSave = useCallback(
        (() => {
            let timeoutId: NodeJS.Timeout;
            return (field: string, value: any) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(async () => {
                    try {
                        await supabase
                            .from('applying')
                            .update({ [field]: value })
                            .eq('applying_id', lead.applying_id);
                        // Silent success - no user notification
                    } catch (err) {
                        // Silent error - just log, no user notification
                        console.error('Auto-save failed:', err);
                    }
                }, 1500); // 1.5 second delay after user stops typing
            };
        })(),
        [lead.applying_id]
    );

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
        }
    }, [lead.applied, lead.created_at, lead.follow_up_completed]);

    // Calculate Found stage countdown timer (2 days to apply)
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
            const interval = setInterval(updateFoundTimer, 60000); // Update every minute

            return () => clearInterval(interval);
        } else {
            // Clear timer if not applicable
            setFoundTimeLeft('');
            setFoundIsOverdue(false);
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
    const [interviewPrepComplete, setInterviewPrepComplete] = useState(false);
    const [interviewPrepData, setInterviewPrepData] = useState({
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
    console.log(canRateInterview, "canRateInterview - build fix");
    // Follow-up state
    const [followUpMessage, setFollowUpMessage] = useState(lead.follow_up_message || '');

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

        // Follow-up sent: +20% (assuming receive_confirmation means follow-up was sent)
        if (lead.receive_confirmation) progress += 20;

        // Contacts added: +5% (if contacts array has items)
        if (contacts.length > 0) progress += 5;

        // Interviews: +20%
        if (lead.interviews && lead.interviews.length > 0) {
            progress += 20;
        }

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

    console.log(getPriorityColor(), "getPriorityColor - build fix");

    // Check if card should be collapsed
    // Check collapse state from applying record or job_clicks record
    const [localCollapsed, setLocalCollapsed] = useState(
        lead.collapsed_card !== undefined ? lead.collapsed_card : false
    );

    // Update local state when props change
    useEffect(() => {
        // Prioritize job_clicks.collapsed_job_click_card since it's always updated
        const newCollapsed = lead.collapsed_card !== undefined ? lead.collapsed_card : false;
        console.log('LeadCard useEffect - updating local state:', {
            leadId: lead.applying_id,
            applyingCollapsed: lead.collapsed_card,
            jobClicksCollapsed: lead.collapsed_job_click_card,
            newCollapsed,
            currentLocalCollapsed: localCollapsed
        });
        setLocalCollapsed(newCollapsed);
    }, [lead.collapsed_card]);

    const isCollapsed = localCollapsed;

    // Debug log for collapse state
    console.log('LeadCard collapse state:', {
        leadId: lead.applying_id,
        applyingCollapsed: lead.collapsed_card,
        jobClicksCollapsed: lead.collapsed_job_click_card,
        finalCollapsed: isCollapsed
    });

    // Handle button actions
    const handleAppliedClick = async (applied: boolean) => {
        try {
            if (applied) {
                // If YES in Found stage - mark as applied
                await supabase
                    .from('applying')
                    .update({ applied: true })
                    .eq('applying_id', lead.applying_id);

                // Update local state immediately (optimistic update)
                lead.applied = true;
                triggerRerender();

                // Notify parent that state changed (for column movement)
                if (onStateChanged) {
                    onStateChanged();
                }
            } else {
                // If NO in Found stage - delete the job (don't archive)
                await supabase
                    .from('applying')
                    .delete()
                    .eq('applying_id', lead.applying_id);

                // Notify parent that lead was deleted (component will be removed)
                if (onArchived) {
                    onArchived(lead.applying_id);
                }
            }
        } catch (err) {
            console.error('Error updating applied status:', err);
        }
    };

    const handleFollowUpComplete = async (completed: boolean) => {
        try {
            await supabase
                .from('applying')
                .update({
                    follow_up_completed: completed,
                    follow_up_completed_at: completed ? new Date().toISOString() : null
                })
                .eq('applying_id', lead.applying_id);

            // Update local state immediately
            lead.follow_up_completed = completed;
            if (completed) {
                lead.follow_up_completed_at = new Date().toISOString();
            } else {
                (lead as any).follow_up_completed_at = null;
            }
            triggerRerender();
        } catch (err) {
            console.error('Error updating follow-up status:', err);
        }
    };

    const handleGotJob = async (gotJob: boolean, startingDate?: string) => {
        try {
            if (gotJob === false) {
                // If "No" - only archive if this was an applied job (not Found stage)
                if (lead.applied) {
                    await supabase
                        .from('applying')
                        .update({
                            is_archived: true,
                            archived_at: new Date().toISOString(),
                            got_the_job: false
                        })
                        .eq('applying_id', lead.applying_id);

                    // Update local state immediately
                    lead.got_the_job = false;
                    lead.is_archived = true;
                    triggerRerender();

                    // Notify parent that lead was archived
                    if (onArchived) {
                        onArchived(lead.applying_id);
                    }
                } else {
                    // If not applied yet, just delete (don't archive)
                    await supabase
                        .from('applying')
                        .delete()
                        .eq('applying_id', lead.applying_id);

                    // Notify parent that lead was deleted
                    if (onArchived) {
                        onArchived(lead.applying_id);
                    }
                }
            } else {
                // If "Yes", update got_the_job but don't archive yet (show archive button)
                await supabase
                    .from('applying')
                    .update({
                        got_the_job: true,
                        starting_date: startingDate || null
                    })
                    .eq('applying_id', lead.applying_id);

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
            console.error('Error updating got_the_job status:', err);
        }
    };

    const handleArchiveJob = async () => {
        if (lead.applied) {
            try {
                // Only archive if job was actually applied to
                await supabase
                    .from('applying')
                    .update({
                        is_archived: true,
                        archived_at: new Date().toISOString()
                    })
                    .eq('applying_id', lead.applying_id);

                // Update local state immediately
                lead.is_archived = true;
                triggerRerender();

                // Notify parent that lead was archived
                if (onArchived) {
                    onArchived(lead.applying_id);
                }
            } catch (err) {
                console.error('Error archiving job:', err);
            }
        }
    };

    // Contact handlers
    const handleSaveContact = async () => {
        if (!newContact.name.trim() || !lead.applying_id) return;

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

            // Update in database
            const { error } = await supabase
                .from('applying')
                .update({ contacts: updatedContacts })
                .eq('applying_id', lead.applying_id);

            if (error) throw error;

            // Update local state
            setContacts(updatedContacts);

            // Reset form
            setNewContact({ name: '', phone: '', email: '' });
            setShowContactForm(false);
            setEditingContact(null);
        } catch (err: any) {
            console.error('Error saving contact:', err);
        }
    };

    const handleCancelContact = () => {
        setNewContact({ name: '', phone: '', email: '' });
        setEditingContact(null);
        setShowContactForm(false);
    };

    const handleDeleteContact = async (contactId: string) => {
        try {
            const { error } = await supabase
                .from('applying')
                .update({ contacts: (lead.contacts || []).filter(c => c.id !== contactId) })
                .eq('applying_id', lead.applying_id);

            if (error) throw error;

            setContacts((lead.contacts || []).filter(contact => contact.id !== contactId));
        } catch (err: any) {
            console.error('Error deleting contact:', err);
        }
    };

    // Collapse/Expand handler
    const handleToggleCollapse = async (collapsed: boolean) => {
        console.log('handleToggleCollapse called:', {
            leadId: lead.applying_id,
            collapsed,
            hasApplying: !!lead.applying_id,
            currentCollapsed: isCollapsed
        });

        try {
            // Always update both tables to ensure consistency
            if (lead.applying_id) {
                // Update applying table
                console.log('Updating applying table for lead:', lead.applying_id);
                const { error: applyingError } = await supabase
                    .from('applying')
                    .update({ collapsed_card: collapsed })
                    .eq('applying_id', lead.applying_id);

                if (applyingError) throw applyingError;
                console.log('Successfully updated applying table');
            }

            // Always update job_clicks table
            console.log('Updating job_clicks table for lead:', lead.applying_id);
            const { error: jobClicksError } = await supabase
                .from('job_clicks')
                .update({ collapsed_job_click_card: collapsed })
                .eq('id', lead.applying_id)
                .eq('user_id', lead.user_id);

            if (jobClicksError) throw jobClicksError;
            console.log('Successfully updated job_clicks table');

            // Update local state immediately
            setLocalCollapsed(collapsed);

            // Update parent state
            if (onStageAction) {
                console.log('Calling onStageAction with collapsed:', collapsed);
                onStageAction('toggle_collapse', { collapsed });
            }
        } catch (err: any) {
            console.error('Error toggling collapse:', err);
        }
    };

    // Load contacts on component mount
    useEffect(() => {
        // Load contacts directly from lead object
        if (lead.contacts) {
            setContacts(lead.contacts);
        } else {
            setContacts([]);
        }
    }, [lead.contacts, lead.applying_id]);

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
    };

    // const handleInterviewRating = (rating: 'thumbs_up' | 'thumbs_down') => {
    //     if (onStageAction) {
    //         onStageAction('interview_rating', { rating });
    //     }
    // };

    console.log(handleOpenPrepModal(), "handleOpenPrepModal - build fix");

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
        console.log(doneTypes, "doneTypes - build fix");
        // All types are always available (don't filter out done types)
        const availableTypes = INTERVIEW_TYPES;


        // Helper om label te krijgen
        const getLabel = (key: string) => {
            const type = INTERVIEW_TYPES.find(t => t.key === key);
            return type ? type.label : key.charAt(0).toUpperCase() + key.slice(1);
        };

        // Sla interview data en rating op na klikken Good/Bad
        const handleRating = async (rating: boolean) => {
            if (!lead.applying_id || !selectedInterviewType || !interviewDate) return;

            console.log('[DEBUG] Saving interview:', {
                applying_id: lead.applying_id,
                selectedInterviewType,
                interviewDate,
                rating,
                currentInterviews: lead.interviews
            });

            try {
                const currentInterviews = Array.isArray(lead.interviews) ? lead.interviews : [];

                // Create new interview object
                const newInterview = {
                    id: crypto.randomUUID(),
                    type: selectedInterviewType,
                    date: interviewDate,
                    rating: rating,
                    created_at: new Date().toISOString()
                };

                // Add to interviews array
                const updatedInterviews = [...currentInterviews, newInterview];

                console.log('[DEBUG] Updating interviews in database:', updatedInterviews);

                // For JSONB: send array directly (PostgreSQL handles JSON conversion)
                const { data, error } = await supabase
                    .from('applying')
                    .update({ interviews: updatedInterviews })
                    .eq('applying_id', lead.applying_id)
                    .select();

                if (error) {
                    console.error('[DEBUG] Database error:', error);
                    throw error;
                }

                console.log('[DEBUG] Interview saved successfully, returned data:', data);

                // Reset form
                setShowNewInterview(false);
                setInterviewDate('');
                setSelectedInterviewType('');

                // Update local state and refresh UI
                lead.interviews = updatedInterviews;
                triggerRerender();
            } catch (err: any) {
                console.error('[DEBUG] Error saving interview:', err);
                alert('Error saving interview: ' + err.message);
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
                                color: '#3b82f6',
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

                {/* Toon reeds ingevulde interviews */}
                {currentInterviews.map((interview: any) => (
                    <div key={interview.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 8,
                        padding: '8px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: 6
                    }}>
                        <span style={{ fontWeight: 600, fontSize: '12px' }}>
                            {getLabel(interview.type)}:
                        </span>
                        <span style={{ fontSize: '12px' }}>
                            {new Date(interview.date).toLocaleDateString()}
                        </span>
                        <span style={{
                            color: interview.rating ? '#10b981' : '#ef4444',
                            fontWeight: 600,
                            fontSize: '12px'
                        }}>
                            {interview.rating ? 'Good' : 'Bad'}
                        </span>
                    </div>
                ))}

                {/* Add new interview */}
                {showNewInterview && availableTypes.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ marginBottom: 8, fontWeight: 600, fontSize: '12px' }}>Add interview</div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <select value={selectedInterviewType} onChange={e => setSelectedInterviewType(e.target.value)} style={{
                                padding: '6px 12px',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: 6,
                                fontSize: '11px',
                                cursor: 'pointer'
                            }}>
                                <option value="" style={{ backgroundColor: '#1f2937', color: 'white' }}>Select interview type...</option>
                                {availableTypes.map(t => (
                                    <option key={t.key} value={t.key} style={{ backgroundColor: '#1f2937', color: 'white' }}>{t.label}</option>
                                ))}
                            </select>
                            <input type="date" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} style={{
                                padding: '6px 12px',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: 6,
                                fontSize: '11px',
                                cursor: 'pointer'
                            }} />
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
                                    onClick={() => handleRating(true)}
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
                                    onClick={() => handleRating(false)}
                                >Bad</button>
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
                                        setInterviewPrepComplete(true);
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
        // Found stage: basic job info with apply option
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
                </div>
            );
        }

        // Check if job has interviews (for Close stage)
        const hasInterviews = lead.interviews && lead.interviews.length > 0;
        console.log(hasInterviews, "hasInterviews - build fix");
        // Connect stage: applied but not got the job yet (regardless of interviews)
        if (lead.applied && lead.got_the_job !== true) {


            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Follow-up reminder - MOVED TO TOP */}
                    {timeLeft && !lead.follow_up_completed && (
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
                                    color: '#3b82f6',
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

                    {/* Interview flow - REMOVED: Now at top */}

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

        // Close stage: got the job
        if (lead.applied && lead.got_the_job === true) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Interview flow */}
                    {renderInterviewFlow()}

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
                        {/* Delete button - only for Found stage (not applied) */}
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
            {/* Header with title and collapse button */}
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
        </div>
    );
};

export default LeadCard; 