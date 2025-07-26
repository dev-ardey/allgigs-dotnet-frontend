import React, { useState, useEffect } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import {
    MapPin,
    DollarSign,
    Bell,
    AlertCircle,
    Calendar,
    ThumbsUp,
    ThumbsDown,
    Users,
    Target,
    Award,
    Timer,
    CircleCheckBig,
    StickyNote,
    TrendingDown,
    CheckCircle,
    Maximize2,
    Minimize2
} from 'lucide-react';
import { Lead } from '../../types/leads';
import { supabase } from '../../SupabaseClient';

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
        priority: string;
        match_percentage: number;
        possible_earnings: number;
        above_normal_rate: boolean;
        follow_up_overdue: boolean;
        collapsed_card?: boolean;
    } | null;
}

interface LeadCardProps {
    lead: JobClickWithApplying;
    onClick: () => void;
    isDragging: boolean;
    hasFollowUp: boolean;
    onStageAction?: (action: string, data?: any) => void;
    index: number;
}

const LeadCard: React.FC<LeadCardProps> = ({
    lead,
    onClick,
    isDragging,
    hasFollowUp,
    onStageAction
}) => {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isOverdue, setIsOverdue] = useState(false);
    const [notes, setNotes] = useState(lead.applying?.notes || '');

    // Calculate follow-up timer
    useEffect(() => {
        if (lead.applying && lead.applying.applied && lead.applying.created_at) {
            const startDate = new Date(lead.applying.created_at);
            const followUpDays = lead.applying.receive_confirmation ? 3 : 7; // Default to 3 days if no confirmation
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
        }

        return undefined;
    }, [lead.applying]);

    // Voeg direct na de useState hooks toe:
    // Zet het type van mockPriority expliciet op string:
    const mockPriority: string = 'medium'; // 'high', 'medium', 'low'
    const mockMatchPercentage = 85;
    const mockPossibleEarnings = 75000;
    const mockAboveNormalRate = true;
    const mockFollowUpOverdue = false;

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
        portfolioReview: ''
    });

    // Interview flow states (moved from renderInterviewFlow)
    const [selectedInterviewType, setSelectedInterviewType] = useState<string>('recruiter');
    const [interviewDate, setInterviewDate] = useState('');
    const [showNewInterview, setShowNewInterview] = useState(true);
    const [canRateInterview, setCanRateInterview] = useState(false);

    // Calculate progress percentage
    const calculateProgress = () => {
        if (!lead.applying) return 0;

        let progress = 0;

        // Applied: +30%
        if (lead.applying.applied) progress += 30;

        // Notes: +10%
        if (lead.applying.notes && lead.applying.notes.trim()) progress += 10;

        // Follow-up sent: +20% (assuming receive_confirmation means follow-up was sent)
        if (lead.applying.receive_confirmation) progress += 20;

        // Contacts added: +5% (if contacts array has items)
        if (contacts.length > 0) progress += 5;

        // Interviews: +20%
        if (lead.applying.recruiter_interview ||
            lead.applying.technical_interview ||
            lead.applying.hiringmanager_interview) {
            progress += 20;
        }

        // Got the job: fill to 100%
        if (lead.applying.got_the_job) {
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

    // Check if card should be collapsed
    // Check collapse state from applying record or job_clicks record
    const isCollapsed = lead.applying?.collapsed_card || (lead as any).collapsed_job_click_card || false;

    // Handle button actions
    const handleAppliedClick = (applied: boolean) => {
        if (onStageAction) {
            onStageAction('apply', { applied });
        }
    };

    const handleFollowUpComplete = (completed: boolean) => {
        if (onStageAction) {
            onStageAction('follow_up_complete', { completed });
        }
    };

    const handleInvitedToInterview = () => {
        if (onStageAction) {
            onStageAction('invited_to_interview');
        }
    };

    const handleGotJob = (gotJob: boolean) => {
        if (onStageAction) {
            onStageAction('got_job', { gotJob });
        }
    };

    // Contact handlers
    const handleSaveContact = async () => {
        if (!newContact.name.trim() || !lead.applying?.applying_id) return;

        try {
            if (editingContact) {
                // Edit existing contact
                const { error } = await supabase
                    .from('applying_contact_details')
                    .update({
                        name: newContact.name,
                        phone: newContact.phone || null,
                        email: newContact.email || null
                    })
                    .eq('id', editingContact);

                if (error) throw error;

                setContacts(contacts.map(contact =>
                    contact.id === editingContact
                        ? { ...contact, ...newContact }
                        : contact
                ));
                setEditingContact(null);
            } else {
                // Add new contact
                const { data, error } = await supabase
                    .from('applying_contact_details')
                    .insert([{
                        applying_id: lead.applying.applying_id,
                        name: newContact.name,
                        phone: newContact.phone || null,
                        email: newContact.email || null
                    }])
                    .select();

                if (error) throw error;

                if (data && data[0]) {
                    setContacts([...contacts, data[0]]);
                }
            }

            // Reset form
            setNewContact({ name: '', phone: '', email: '' });
            setShowContactForm(false);
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
                .from('applying_contact_details')
                .delete()
                .eq('id', contactId);

            if (error) throw error;

            setContacts(contacts.filter(contact => contact.id !== contactId));
        } catch (err: any) {
            console.error('Error deleting contact:', err);
        }
    };

    // Collapse/Expand handler
    const handleToggleCollapse = async (collapsed: boolean) => {
        try {
            if (lead.applying?.applying_id) {
                // Job is in applying table - update there
                const { error } = await supabase
                    .from('applying')
                    .update({ collapsed_card: collapsed })
                    .eq('applying_id', lead.applying.applying_id);

                if (error) throw error;
            } else {
                // Job is only in job_clicks - update collapsed_job_click_card in job_clicks table
                const { error } = await supabase
                    .from('job_clicks')
                    .update({ collapsed_job_click_card: collapsed })
                    .eq('id', lead.id)
                    .eq('user_id', lead.user_id);

                if (error) throw error;
            }

            // Update local state
            if (onStageAction) {
                onStageAction('toggle_collapse', { collapsed });
            }
        } catch (err: any) {
            console.error('Error toggling collapse:', err);
        }
    };

    // Load contacts on component mount
    useEffect(() => {
        const loadContacts = async () => {
            if (!lead.applying?.applying_id) return;

            try {
                const { data, error } = await supabase
                    .from('applying_contact_details')
                    .select('*')
                    .eq('applying_id', lead.applying.applying_id);

                if (error) throw error;

                setContacts(data || []);
            } catch (err: any) {
                console.error('Error loading contacts:', err);
            }
        };

        loadContacts();
    }, [lead.applying?.applying_id]);

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

    const handleInterviewRating = (rating: 'thumbs_up' | 'thumbs_down') => {
        if (onStageAction) {
            onStageAction('interview_rating', { rating });
        }
    };

    const [notesChanged, setNotesChanged] = React.useState(false);
    const [originalNotes, setOriginalNotes] = React.useState(notes);
    const [startingDate, setStartingDate] = React.useState(lead.applying?.starting_date || '');

    const handleNotesChange = (newNotes: string) => {
        setNotes(newNotes);
        setNotesChanged(newNotes !== originalNotes);
    };

    const handleNotesSave = () => {
        if (onStageAction && lead.applying?.applying_id) {
            onStageAction('update_notes', {
                applyingId: lead.applying.applying_id,
                notes
            });
            setNotesChanged(false);
            setOriginalNotes(notes);
        }
    };

    const handleNotesCancel = () => {
        setNotes(originalNotes);
        setNotesChanged(false);
    };

    const INTERVIEW_TYPES = [
        { key: 'recruiter', label: 'Recruiter' },
        { key: 'technical', label: 'Technical' },
        { key: 'hiringmanager', label: 'Hiring Manager' }
    ];

    const renderInterviewFlow = () => {
        if (!lead.applying || !lead.applying.applied) return null;

        // Verzamel welke interviews al zijn ingevuld
        const doneTypes = INTERVIEW_TYPES.filter(t => {
            if (t.key === 'recruiter') return lead.applying?.recruiter_interview && lead.applying?.interview_rating_recruiter !== null;
            if (t.key === 'technical') return lead.applying?.technical_interview && lead.applying?.interview_rating_technical !== null;
            if (t.key === 'hiringmanager') return lead.applying?.hiringmanager_interview && lead.applying?.interview_rating_hiringmanager !== null;
            return false;
        }).map(t => t.key);

        // Types die nog niet zijn ingevuld
        const availableTypes = INTERVIEW_TYPES.filter(t => !doneTypes.includes(t.key));

        // Helper om label te krijgen
        const getLabel = (key: string) => INTERVIEW_TYPES.find(t => t.key === key)?.label || key;

        // Sla interview data en rating op na klikken Good/Bad
        const handleRating = (rating: boolean) => {
            if (onStageAction && lead.applying?.applying_id && selectedInterviewType && interviewDate) {
                // Eerst interview data opslaan
                onStageAction('interview_date', {
                    applyingId: lead.applying.applying_id,
                    interviewData: {
                        type: selectedInterviewType as 'recruiter' | 'technical' | 'hiringmanager',
                        date: interviewDate
                    }
                });

                // Dan rating opslaan
                onStageAction('interview_rating', {
                    applyingId: lead.applying.applying_id,
                    interviewData: {
                        type: selectedInterviewType as 'recruiter' | 'technical' | 'hiringmanager',
                        date: interviewDate,
                        rating
                    }
                });
                setShowNewInterview(false);
                setInterviewDate('');
            }
        };

        return (
            <div style={{ padding: 12, background: 'rgba(59,130,246,0.15)', borderRadius: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <Users style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.8)' }} />
                    <span style={{ fontWeight: 600, color: 'white' }}>Interviews</span>
                </div>

                {/* Toon reeds ingevulde interviews */}
                {INTERVIEW_TYPES.map(t => {
                    let d = null, r = null;
                    if (t.key === 'recruiter') {
                        d = lead.applying?.recruiter_interview;
                        r = lead.applying?.interview_rating_recruiter;
                    }
                    if (t.key === 'technical') {
                        d = lead.applying?.technical_interview;
                        r = lead.applying?.interview_rating_technical;
                    }
                    if (t.key === 'hiringmanager') {
                        d = lead.applying?.hiringmanager_interview;
                        r = lead.applying?.interview_rating_hiringmanager;
                    }
                    if (!d) return null;
                    return (
                        <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: '12px' }}>{getLabel(t.key)}:</span>
                            <span style={{ fontSize: '12px' }}>{new Date(d).toLocaleDateString()}</span>
                            <span style={{ color: r ? '#10b981' : '#ef4444', fontWeight: 600, fontSize: '12px' }}>{r === true ? 'Good' : r === false ? 'Bad' : ''}</span>
                        </div>
                    );
                })}

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
                        {canRateInterview && (
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

            </div>
        );
    };

    // Render stage-specific content
    const renderStageContent = () => {
        // Found stage: Toon altijd de 'Applied?' knoppen als er geen applying record is of applied = false
        if (!lead.applying || !lead.applying.applied) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* URL */}
                    {lead.url && (
                        <div style={{ marginBottom: '12px' }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(lead.url, '_blank', 'noopener,noreferrer');
                                }}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                    color: 'white',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    backdropFilter: 'blur(10px)',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Target style={{ width: '12px', height: '12px' }} />
                                View Job Posting
                            </button>
                        </div>
                    )}
                    {/* Applied status */}
                    <div>
                        <div style={{ fontSize: '13px', marginBottom: '8px', fontWeight: '500', color: 'rgba(255, 255, 255, 0.7)' }}>Applied?</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={(e) => { e.stopPropagation(); handleAppliedClick(true); }} style={{ padding: '8px 16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '600', backdropFilter: 'blur(10px)', transition: 'all 0.2s ease' }}>YES</button>
                            <button onClick={(e) => { e.stopPropagation(); handleAppliedClick(false); }} style={{ padding: '8px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '600', backdropFilter: 'blur(10px)', transition: 'all 0.2s ease' }}>NO</button>
                        </div>
                    </div>
                </div>
            );
        }

        // Check if job has interviews (for Close stage)
        const hasInterviews = lead.applying?.recruiter_interview ||
            lead.applying?.technical_interview ||
            lead.applying?.hiringmanager_interview;

        // Connect stage: applied but no interviews yet
        if (lead.applying && lead.applying.applied && !hasInterviews) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Interview prep */}
                    <div style={{ padding: 12, background: 'rgba(59, 130, 246, 0.08)', borderRadius: 8 }}>
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
                                    <Target style={{ width: '14px', height: '14px' }} />
                                    Prep for interview
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
                                                resize: 'vertical'
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
                                                resize: 'vertical'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '10px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>
                                            What specific questions do you want to ask?
                                        </div>
                                        <textarea
                                            value={interviewPrepData.specificQuestions}
                                            onChange={(e) => setInterviewPrepData({ ...interviewPrepData, specificQuestions: e.target.value })}
                                            placeholder="Prepare thoughtful questions to ask during the interview..."
                                            style={{
                                                width: '100%',
                                                minHeight: '40px',
                                                padding: '6px 8px',
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                color: 'white',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                borderRadius: 4,
                                                fontSize: '10px',
                                                resize: 'vertical'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '10px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>
                                            What should you review in your portfolio?
                                        </div>
                                        <textarea
                                            value={interviewPrepData.portfolioReview}
                                            onChange={(e) => setInterviewPrepData({ ...interviewPrepData, portfolioReview: e.target.value })}
                                            placeholder="Note which projects and skills to highlight..."
                                            style={{
                                                width: '100%',
                                                minHeight: '40px',
                                                padding: '6px 8px',
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                color: 'white',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                borderRadius: 4,
                                                fontSize: '10px',
                                                resize: 'vertical'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                                    {!interviewPrepComplete && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setInterviewPrepComplete(true);
                                                setShowInterviewPrep(false);
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                color: '#10b981',
                                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                                borderRadius: 4,
                                                fontSize: '11px',
                                                cursor: 'pointer',
                                                fontWeight: '600'
                                            }}
                                        >
                                            Save
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowInterviewPrep(false); }}
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
                                        {interviewPrepComplete ? 'Close' : 'Cancel'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Contacts */}
                    <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Users style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.8)' }} />
                                <span style={{ fontWeight: 600, fontSize: '12px' }}>Contacts</span>
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

                    {/* Interview flow */}
                    {renderInterviewFlow()}

                    {/* Follow-up reminder */}
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
                            <button
                                onClick={(e) => { e.stopPropagation(); handleFollowUpComplete(true); }}
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
                                Mark Complete
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        // Close stage: has interviews
        if (lead.applying && lead.applying.applied && hasInterviews) {
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
                        {lead.applying?.got_the_job && (
                            <div style={{ marginTop: 8 }}>
                                <div style={{ fontSize: '11px', marginBottom: 4, color: 'rgba(255, 255, 255, 0.7)' }}>Starting date (optional):</div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input
                                        type="date"
                                        value={startingDate}
                                        onChange={(e) => setStartingDate(e.target.value)}
                                        onBlur={(e) => {
                                            if (e.target.value && onStageAction) {
                                                onStageAction('got_job', { gotJob: true, startingDate: e.target.value });
                                            }
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
                            {lead.job_title}
                        </div>

                        {/* Progress bar */}
                        <div style={{ marginBottom: '8px' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '4px'
                            }}>
                                <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Progress
                                </span>
                                <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: '600' }}>
                                    {progressPercentage}%
                                </span>
                            </div>
                            <div style={{
                                width: '100%',
                                height: '6px',
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

                    {/* Expand button */}
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
                            cursor: 'pointer',
                            marginLeft: '8px'
                        }}
                    >
                        <Maximize2 style={{ width: '12px', height: '12px' }} />
                    </button>
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
            {/* Collapse button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
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
                        cursor: 'pointer'
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
                    {/* Priority dot */}
                    <div
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: getPriorityColor(),
                            flexShrink: 0
                        }}
                    />
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

            {/* Job title */}
            <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                marginBottom: '4px',
                lineHeight: '1.3'
            }}>
                {lead.job_title}
            </h3>

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
                <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500' }}>{lead.company}</span>
                {lead.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin style={{ width: '12px', height: '12px' }} />
                        <span>{lead.location}</span>
                    </div>
                )}
                {lead.rate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <DollarSign style={{ width: '12px', height: '12px' }} />
                        <span>{lead.rate}</span>
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
                {notesChanged && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button onClick={(e) => { e.stopPropagation(); handleNotesSave(); }} style={{ padding: '6px 12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>Save</button>
                        <button onClick={(e) => { e.stopPropagation(); handleNotesCancel(); }} style={{ padding: '6px 12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeadCard; 