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

interface LeadCardProps {
    lead: Lead;
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
    const [notes, setNotes] = useState(lead.notes || '');

    // Calculate follow-up timer
    useEffect(() => {
        if (lead.stage === 'found' && lead.found_data.follow_up_timer_started) {
            const startDate = new Date(lead.found_data.follow_up_timer_started);
            const followUpDays = lead.found_data.follow_up_days || 3;
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
    }, [lead.stage, lead.found_data.follow_up_timer_started, lead.found_data.follow_up_days]);

    // Get priority color
    const getPriorityColor = () => {
        const priority = lead.found_data?.priority || 'medium';
        switch (priority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    // Handle button actions
    const handleAppliedClick = (applied: boolean) => {
        if (onStageAction) {
            onStageAction('applied', { applied });
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

    const handleNotesChange = (newNotes: string) => {
        setNotes(newNotes);
        if (onStageAction) {
            onStageAction('update_notes', { notes: newNotes });
        }
    };

    // Render stage-specific content
    const renderStageContent = () => {
        switch (lead.stage) {
            case 'found':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Match percentage */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            color: '#10b981',
                            fontWeight: '500'
                        }}>
                            <Target style={{ width: '14px', height: '14px' }} />
                            <span>{lead.found_data.match_percentage}% match, based on your profile</span>
                        </div>

                        {/* Possible earnings */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            fontWeight: '500'
                        }}>
                            <DollarSign style={{ width: '14px', height: '14px', color: '#10b981' }} />
                            <span>
                                Possible earnings: €{lead.found_data.possible_earnings?.toLocaleString()}
                            </span>
                            <span style={{
                                color: lead.found_data.above_normal_rate ? '#10b981' : '#ef4444',
                                fontWeight: '600'
                            }}>
                                {lead.found_data.above_normal_rate ? 'Above' : 'Under'} your rate
                            </span>
                        </div>

                        {/* Applied status */}
                        {!lead.found_data.applied ? (
                            <div>
                                <div style={{
                                    fontSize: '13px',
                                    marginBottom: '8px',
                                    fontWeight: '500',
                                    color: 'rgba(255, 255, 255, 0.7)'
                                }}>
                                    Applied?
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAppliedClick(true);
                                        }}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                            color: '#10b981',
                                            border: '1px solid rgba(16, 185, 129, 0.3)',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            backdropFilter: 'blur(10px)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        YES
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAppliedClick(false);
                                        }}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            color: '#ef4444',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            backdropFilter: 'blur(10px)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        NO
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Follow-up timer */}
                                {lead.found_data.follow_up_timer_started && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '13px',
                                        color: isOverdue ? '#ef4444' : '#10b981',
                                        fontWeight: '500'
                                    }}>
                                        <Timer style={{ width: '14px', height: '14px' }} />
                                        <span>
                                            {isOverdue ? 'Time for a followup!' : `Follow up in ${timeLeft}`}
                                        </span>
                                    </div>
                                )}

                                {/* Follow-up completion */}
                                {isOverdue && (
                                    <div>
                                        <div style={{
                                            fontSize: '13px',
                                            marginBottom: '8px',
                                            fontWeight: '500',
                                            color: 'rgba(255, 255, 255, 0.7)'
                                        }}>
                                            Have you completed this task?
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFollowUpComplete(true);
                                                }}
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                    color: '#10b981',
                                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    backdropFilter: 'blur(10px)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                YES
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFollowUpComplete(false);
                                                }}
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                    color: '#ef4444',
                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    backdropFilter: 'blur(10px)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                NO
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Losing opportunity warning */}
                                {lead.found_data.follow_up_overdue && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '13px',
                                        color: '#ef4444',
                                        fontWeight: '600',
                                        padding: '8px',
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(239, 68, 68, 0.2)'
                                    }}>
                                        <AlertCircle style={{ width: '14px', height: '14px' }} />
                                        <span>
                                            Possibly losing €{lead.found_data.possible_earnings?.toLocaleString()}, Follow up to secure the job
                                        </span>
                                    </div>
                                )}

                                {/* Invited to interview button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleInvitedToInterview();
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                        color: 'white',
                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        backdropFilter: 'blur(10px)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <Calendar style={{ width: '14px', height: '14px' }} />
                                    Invited to Interview
                                </button>
                            </>
                        )}
                    </div>
                );

            case 'connect':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Interview details */}
                        {lead.connect_data.interview_date && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '13px',
                                color: '#10b981',
                                fontWeight: '500'
                            }}>
                                <Calendar style={{ width: '14px', height: '14px' }} />
                                <span>
                                    Interview: {new Date(lead.connect_data.interview_date).toLocaleDateString()} at {lead.connect_data.interview_time}
                                </span>
                            </div>
                        )}

                        {/* Interview with */}
                        {lead.connect_data.interview_with && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '13px',
                                color: 'rgba(255, 255, 255, 0.7)',
                                fontWeight: '500'
                            }}>
                                <Users style={{ width: '14px', height: '14px' }} />
                                <span>With: {lead.connect_data.interview_with}</span>
                            </div>
                        )}

                        {/* Interview notes */}
                        {lead.connect_data.interview_notes && (
                            <div style={{
                                fontSize: '13px',
                                color: 'rgba(255, 255, 255, 0.7)',
                                fontStyle: 'italic',
                                padding: '8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '6px'
                            }}>
                                {lead.connect_data.interview_notes}
                            </div>
                        )}

                        {/* Prepped button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPrepModal();
                            }}
                            style={{
                                padding: '10px 16px',
                                backgroundColor: lead.connect_data.prepped ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                border: `1px solid ${lead.connect_data.prepped ? '#10b981' : '#3b82f6'}`,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: lead.connect_data.prepped ? '#10b981' : 'white',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {lead.connect_data.prepped && (
                                <CircleCheckBig style={{ width: '16px', height: '16px' }} />
                            )}
                            <span>
                                {lead.connect_data.prepped ? 'Prepped' : 'Click to prep'}
                            </span>
                        </button>

                        {/* Interview rating - at the bottom */}
                        <div style={{ marginTop: 'auto' }}>
                            <div style={{
                                fontSize: '13px',
                                fontWeight: '500',
                                color: 'rgba(255, 255, 255, 0.7)',
                                marginBottom: '8px'
                            }}>
                                How did the interview go?
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleInterviewRating('thumbs_up');
                                    }}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: lead.connect_data.interview_rating === 'thumbs_up' ? '#10b981' : 'rgba(16, 185, 129, 0.1)',
                                        color: lead.connect_data.interview_rating === 'thumbs_up' ? 'white' : '#10b981',
                                        border: `1px solid #10b981`,
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        boxShadow: lead.connect_data.interview_rating === 'thumbs_up' ? '0 2px 4px rgba(16, 185, 129, 0.3)' : 'none'
                                    }}
                                >
                                    <ThumbsUp style={{ width: '14px', height: '14px' }} />
                                    Good
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleInterviewRating('thumbs_down');
                                    }}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: lead.connect_data.interview_rating === 'thumbs_down' ? '#ef4444' : 'rgba(239, 68, 68, 0.1)',
                                        color: lead.connect_data.interview_rating === 'thumbs_down' ? 'white' : '#ef4444',
                                        border: `1px solid #ef4444`,
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        boxShadow: lead.connect_data.interview_rating === 'thumbs_down' ? '0 2px 4px rgba(239, 68, 68, 0.3)' : 'none'
                                    }}
                                >
                                    <ThumbsDown style={{ width: '14px', height: '14px' }} />
                                    Bad
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'close':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Got the job question */}
                        {lead.close_data.got_job === undefined && (
                            <div>
                                <div style={{
                                    fontSize: '14px',
                                    marginBottom: '12px',
                                    fontWeight: '600',
                                    color: 'rgba(255, 255, 255, 0.7)'
                                }}>
                                    Got the job?
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleGotJob(true);
                                        }}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                            color: '#10b981',
                                            border: '1px solid rgba(16, 185, 129, 0.3)',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            backdropFilter: 'blur(10px)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        YES
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleGotJob(false);
                                        }}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            color: '#ef4444',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            backdropFilter: 'blur(10px)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        NO
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Success content */}
                        {lead.close_data.got_job === true && (
                            <div style={{
                                padding: '12px',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                borderRadius: '8px',
                                border: '1px solid rgba(16, 185, 129, 0.2)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    marginBottom: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#10b981'
                                }}>
                                    <Award style={{ width: '16px', height: '16px' }} />
                                    Congratulations! 🎉
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#10b981',
                                    marginBottom: '6px',
                                    fontWeight: '500'
                                }}>
                                    Revenue: €{lead.close_data.possible_revenue?.toLocaleString()}
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    marginBottom: '8px'
                                }}>
                                    Negotiation tips & contract template available
                                </div>
                            </div>
                        )}

                        {/* Missed opportunity content */}
                        {lead.close_data.got_job === false && (
                            <div style={{
                                padding: '12px',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: '8px',
                                border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    marginBottom: '8px',
                                    fontSize: '13px',
                                    color: '#ef4444',
                                    fontWeight: '600'
                                }}>
                                    <TrendingDown style={{ width: '14px', height: '14px' }} />
                                    Let's work on that
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#ef4444',
                                    marginBottom: '8px',
                                    fontWeight: '500'
                                }}>
                                    Missed Revenue: €{lead.close_data.possible_revenue?.toLocaleString()}
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // TODO: Implement analysis functionality
                                    }}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                        color: 'white',
                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        backdropFilter: 'blur(10px)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    Click for analysis and tips
                                </button>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
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

            {/* Company */}
            <p style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '12px',
                fontWeight: '500'
            }}>
                {lead.company}
            </p>

            {/* Location and rate */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.7)'
            }}>
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
                        minHeight: '60px',
                        padding: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '12px',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                    }}
                />
            </div>
        </div>
    );
};

export default LeadCard; 