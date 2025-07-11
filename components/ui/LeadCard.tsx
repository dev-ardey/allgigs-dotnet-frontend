import React from 'react';
import {
    MapPin,
    DollarSign,
    Clock,
    Bell,
    AlertCircle,
    Calendar,
    Star,
    TrendingUp
} from 'lucide-react';
import { Lead } from '../../types/leads';

interface LeadCardProps {
    lead: Lead;
    onClick: () => void;
    isDragging: boolean;
    hasFollowUp: boolean;
}

const LeadCard: React.FC<LeadCardProps> = ({
    lead,
    onClick,
    isDragging,
    hasFollowUp
}) => {
    // Calculate days since last update
    const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(lead.stage_updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get priority color
    const getPriorityColor = () => {
        const priority = lead.new_lead_data?.priority || 'medium';
        switch (priority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    // Get stage-specific indicator
    const getStageIndicator = () => {
        switch (lead.stage) {
            case 'new_lead':
                return {
                    icon: Clock,
                    color: '#3b82f6',
                    text: `Follow up in ${lead.new_lead_data?.follow_up_days || 3} days`
                };
            case 'applied':
                return {
                    icon: Calendar,
                    color: '#8b5cf6',
                    text: lead.applied_data?.application_date ?
                        `Applied ${new Date(lead.applied_data.application_date).toLocaleDateString()}` :
                        'Application sent'
                };
            case 'spoken':
                return {
                    icon: TrendingUp,
                    color: '#06b6d4',
                    text: `${lead.spoken_data?.conversations?.length || 0} conversations`
                };
            case 'interview':
                return {
                    icon: Star,
                    color: '#10b981',
                    text: `${lead.interview_data?.interviews?.length || 0} interviews`
                };
            case 'denied':
                return {
                    icon: AlertCircle,
                    color: '#ef4444',
                    text: 'Application denied'
                };
            case 'success':
                return {
                    icon: Star,
                    color: '#f59e0b',
                    text: lead.success_data?.offer_amount ?
                        `€${lead.success_data.offer_amount.toLocaleString()}` :
                        'Offer received!'
                };
            default:
                return {
                    icon: Clock,
                    color: '#6b7280',
                    text: 'In progress'
                };
        }
    };

    const stageIndicator = getStageIndicator();
    const StageIcon = stageIndicator.icon;

    return (
        <div
            onClick={onClick}
            style={{
                background: isDragging
                    ? 'rgba(255, 255, 255, 0.25)'
                    : 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                border: isDragging
                    ? '2px solid rgba(255, 255, 255, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                transform: isDragging ? 'scale(1.02)' : 'none',
                boxShadow: isDragging
                    ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                    : '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
                if (!isDragging) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                }
            }}
            onMouseLeave={(e) => {
                if (!isDragging) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                }
            }}
        >
            {/* Priority Indicator and Follow-up Bell */}
            <div style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                {/* Follow-up Bell Icon */}
                {hasFollowUp && (
                    <Bell style={{
                        width: '12px',
                        height: '12px',
                        color: '#f59e0b'
                    }} />
                )}

                {/* Priority Dot */}
                <div
                    style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: getPriorityColor()
                    }}
                />
            </div>

            {/* Job Title */}
            <h4 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#fff',
                lineHeight: '1.3',
                paddingRight: '1rem' // Space for priority indicator
            }}>
                {lead.job_title}
            </h4>

            {/* Company */}
            <p style={{
                margin: '0 0 0.75rem 0',
                fontSize: '0.875rem',
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: '500'
            }}>
                {lead.company}
            </p>

            {/* Location and Rate */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
                gap: '0.5rem'
            }}>
                {lead.location && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.75rem'
                    }}>
                        <MapPin style={{ width: '12px', height: '12px' }} />
                        <span>{lead.location}</span>
                    </div>
                )}

                {lead.rate && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.75rem'
                    }}>
                        <DollarSign style={{ width: '12px', height: '12px' }} />
                        <span>{lead.rate}</span>
                    </div>
                )}
            </div>

            {/* Stage Indicator */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                marginBottom: '0.5rem'
            }}>
                <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    background: stageIndicator.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <StageIcon style={{ width: '12px', height: '12px', color: '#fff' }} />
                </div>
                <span style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    flex: 1
                }}>
                    {stageIndicator.text}
                </span>
            </div>

            {/* Notes Preview */}
            {lead.notes && (
                <div style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontStyle: 'italic',
                    marginBottom: '0.5rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}>
                    "{lead.notes}"
                </div>
            )}

            {/* Days Since Update */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.5)'
            }}>
                <span>
                    {daysSinceUpdate === 0 ? 'Updated today' :
                        daysSinceUpdate === 1 ? 'Updated yesterday' :
                            `Updated ${daysSinceUpdate} days ago`}
                </span>

                {/* Stage Badge */}
                <span style={{
                    padding: '0.125rem 0.375rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    fontSize: '0.6rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: '600'
                }}>
                    {lead.stage.replace('_', ' ')}
                </span>
            </div>

            {/* Drag Handle Indicator */}
            <div style={{
                position: 'absolute',
                left: '0.25rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '3px',
                height: '20px',
                background: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '2px',
                opacity: isDragging ? 1 : 0.5
            }} />
        </div>
    );
};

export default LeadCard; 