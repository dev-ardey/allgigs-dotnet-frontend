import React, { useState, useEffect } from 'react';
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
    TrendingDown
} from 'lucide-react';
import { Lead } from '../../types/leads';

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
    } | null;
}

interface LeadCardProps {
    lead: JobClickWithApplying;
    onClick: () => void;
    isDragging: boolean;
    hasFollowUp: boolean;
    onStageAction?: (action: string, data?: any) => void;
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

    // Pas de priority-dot aan:
    const getPriorityColor = () => {
        switch (mockPriority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

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

        // State voor nieuwe interview
        const [selectedType, setSelectedType] = React.useState<string>(availableTypes[0]?.key || 'recruiter');
        const [date, setDate] = React.useState('');
        const [showNew, setShowNew] = React.useState(true);
        const [canRate, setCanRate] = React.useState(false);

        // Helper om label te krijgen
        const getLabel = (key: string) => INTERVIEW_TYPES.find(t => t.key === key)?.label || key;

        // Toon Good/Bad buttons alleen als type en datum zijn ingevuld
        React.useEffect(() => {
            if (selectedType && date) {
                setCanRate(true);
            } else {
                setCanRate(false);
            }
        }, [selectedType, date]);

        // Sla interview data en rating op na klikken Good/Bad
        const handleRating = (rating: boolean) => {
            if (onStageAction && lead.applying?.applying_id && selectedType && date) {
                // Eerst interview data opslaan
                onStageAction('interview_date', {
                    applyingId: lead.applying.applying_id,
                    interviewData: {
                        type: selectedType as 'recruiter' | 'technical' | 'hiringmanager',
                        date
                    }
                });

                // Dan rating opslaan
                onStageAction('interview_rating', {
                    applyingId: lead.applying.applying_id,
                    interviewData: {
                        type: selectedType as 'recruiter' | 'technical' | 'hiringmanager',
                        date,
                        rating
                    }
                });
                setShowNew(false);
                setDate('');
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
                {showNew && availableTypes.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ marginBottom: 8, fontWeight: 600, fontSize: '12px' }}>Add interview</div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <select value={selectedType} onChange={e => setSelectedType(e.target.value)} style={{ padding: 6, borderRadius: 4, fontSize: '11px' }}>
                                {availableTypes.map(t => (
                                    <option key={t.key} value={t.key}>{t.label}</option>
                                ))}
                            </select>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: 6, borderRadius: 4, fontSize: '11px' }} />
                        </div>
                        {canRate && (
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
        // Toon altijd de 'Applied?' knoppen als er geen applying record is of applied = false
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

        // Voor alles met applying.applied = true, render interview flow + follow-up + got job
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

                {/* Got the job */}
                <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Award style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.8)' }} />
                        <span style={{ fontWeight: 600, fontSize: '12px' }}>Got the job?</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
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
                </div>
            </div>
        );
    };

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