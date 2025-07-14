import React, { useState } from 'react';
import {
    X,
    CheckCircle,
    User,
    Building,
    Target,
    Users,
    Lightbulb,
    Plus,
    Trash2,
    Save,
    ExternalLink,
    Mail
} from 'lucide-react';
import { Lead, Colleague, InterviewPrepData } from '../../types/leads';

interface InterviewPrepModalProps {
    lead: Lead;
    onClose: () => void;
    onUpdate: (updatedLead: Lead) => void;
}

const InterviewPrepModal: React.FC<InterviewPrepModalProps> = ({
    lead,
    onClose,
    onUpdate
}) => {
    const [prepData, setPrepData] = useState<InterviewPrepData>(
        lead.connect_data.prep_data || {
            introduction: '',
            company_fit: '',
            role_description: '',
            colleagues: [],
            company_mission: '',
            completed: false
        }
    );

    const [newColleague, setNewColleague] = useState<Omit<Colleague, 'id'>>({
        name: '',
        email: '',
        linkedin: '',
        role: ''
    });

    const [showAddColleague, setShowAddColleague] = useState(false);

    const handleSave = () => {
        // Check if all required fields are filled
        const isCompleted = !!(
            prepData.introduction &&
            prepData.company_fit &&
            prepData.role_description &&
            prepData.company_mission &&
            (prepData.colleagues?.length || 0) > 0
        );

        const updatedPrepData = {
            ...prepData,
            completed: isCompleted
        };

        const updatedLead = {
            ...lead,
            connect_data: {
                ...lead.connect_data,
                prep_data: updatedPrepData,
                prepped: isCompleted
            }
        };

        onUpdate(updatedLead);
        onClose();
    };

    const handleAddColleague = () => {
        if (newColleague.name) {
            const colleague: Colleague = {
                id: Date.now().toString(),
                ...newColleague
            };

            setPrepData(prev => ({
                ...prev,
                colleagues: [...(prev.colleagues || []), colleague]
            }));

            setNewColleague({ name: '', email: '', linkedin: '', role: '' });
            setShowAddColleague(false);
        }
    };

    const handleRemoveColleague = (colleagueId: string) => {
        setPrepData(prev => ({
            ...prev,
            colleagues: (prev.colleagues || []).filter(c => c.id !== colleagueId)
        }));
    };

    const getCompletionPercentage = () => {
        const fields = [
            prepData.introduction,
            prepData.company_fit,
            prepData.role_description,
            prepData.company_mission,
            (prepData.colleagues?.length || 0) > 0
        ];

        const completed = fields.filter(Boolean).length;
        return Math.round((completed / fields.length) * 100);
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000,
                padding: '20px'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '20px',
                    padding: '0',
                    width: '90%',
                    maxWidth: '800px',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    position: 'relative'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '24px 32px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '600',
                            color: 'white',
                            margin: 0,
                            marginBottom: '8px'
                        }}>
                            Interview Preparation
                        </h2>
                        <p style={{
                            fontSize: '14px',
                            color: 'rgba(255, 255, 255, 0.7)',
                            margin: 0
                        }}>
                            {lead.job_title} at {lead.company}
                        </p>
                        <div style={{
                            marginTop: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <div style={{
                                width: '100px',
                                height: '6px',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: '3px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${getCompletionPercentage()}%`,
                                    height: '100%',
                                    backgroundColor: getCompletionPercentage() === 100 ? '#10b981' : '#f59e0b',
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                            <span style={{
                                fontSize: '12px',
                                color: 'rgba(255, 255, 255, 0.7)',
                                fontWeight: '500'
                            }}>
                                {getCompletionPercentage()}% Complete
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X style={{ width: '20px', height: '20px', color: 'white' }} />
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    padding: '32px',
                    maxHeight: 'calc(90vh - 140px)',
                    overflowY: 'auto',
                    backgroundColor: 'white'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* Introduction */}
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#1f2937',
                                marginBottom: '12px'
                            }}>
                                <User style={{ width: '18px', height: '18px', color: '#6366f1' }} />
                                What is your introduction?
                            </label>
                            <textarea
                                value={prepData.introduction}
                                onChange={(e) => setPrepData(prev => ({ ...prev, introduction: e.target.value }))}
                                placeholder="Tell me about yourself and your background..."
                                style={{
                                    width: '100%',
                                    minHeight: '80px',
                                    padding: '12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        {/* Company Fit */}
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#1f2937',
                                marginBottom: '12px'
                            }}>
                                <Building style={{ width: '18px', height: '18px', color: '#6366f1' }} />
                                How do you fit with the company?
                            </label>
                            <textarea
                                value={prepData.company_fit}
                                onChange={(e) => setPrepData(prev => ({ ...prev, company_fit: e.target.value }))}
                                placeholder="Why are you interested in this company? How do your values align?"
                                style={{
                                    width: '100%',
                                    minHeight: '80px',
                                    padding: '12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        {/* Role Description */}
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#1f2937',
                                marginBottom: '12px'
                            }}>
                                <Target style={{ width: '18px', height: '18px', color: '#6366f1' }} />
                                What will you do in this role?
                            </label>
                            <textarea
                                value={prepData.role_description}
                                onChange={(e) => setPrepData(prev => ({ ...prev, role_description: e.target.value }))}
                                placeholder="Describe your understanding of the role and what you'll contribute..."
                                style={{
                                    width: '100%',
                                    minHeight: '80px',
                                    padding: '12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        {/* Colleagues */}
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#1f2937',
                                marginBottom: '12px'
                            }}>
                                <Users style={{ width: '18px', height: '18px', color: '#6366f1' }} />
                                Who will be your colleagues?
                            </label>

                            {/* Existing colleagues */}
                            <div style={{ marginBottom: '16px' }}>
                                {(prepData.colleagues || []).map(colleague => (
                                    <div key={colleague.id} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px',
                                        backgroundColor: '#f9fafb',
                                        borderRadius: '8px',
                                        marginBottom: '8px'
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontWeight: '500',
                                                fontSize: '14px',
                                                marginBottom: '4px'
                                            }}>
                                                {colleague.name}
                                            </div>
                                            <div style={{
                                                fontSize: '12px',
                                                color: '#6b7280',
                                                marginBottom: '4px'
                                            }}>
                                                {colleague.role}
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                gap: '12px',
                                                fontSize: '12px'
                                            }}>
                                                {colleague.email && (
                                                    <a href={`mailto:${colleague.email}`} style={{
                                                        color: '#6366f1',
                                                        textDecoration: 'none',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <Mail style={{ width: '12px', height: '12px' }} />
                                                        {colleague.email}
                                                    </a>
                                                )}
                                                {colleague.linkedin && (
                                                    <a href={colleague.linkedin} target="_blank" rel="noopener noreferrer" style={{
                                                        color: '#6366f1',
                                                        textDecoration: 'none',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <ExternalLink style={{ width: '12px', height: '12px' }} />
                                                        LinkedIn
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveColleague(colleague.id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: '#ef4444',
                                                padding: '4px'
                                            }}
                                        >
                                            <Trash2 style={{ width: '16px', height: '16px' }} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add colleague form */}
                            {showAddColleague ? (
                                <div style={{
                                    padding: '16px',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '8px',
                                    marginBottom: '8px'
                                }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                        <input
                                            type="text"
                                            placeholder="e.g. Sarah Johnson"
                                            value={newColleague.name}
                                            onChange={(e) => setNewColleague(prev => ({ ...prev, name: e.target.value }))}
                                            style={{
                                                padding: '8px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '6px',
                                                fontSize: '14px'
                                            }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="e.g. Lead Developer"
                                            value={newColleague.role}
                                            onChange={(e) => setNewColleague(prev => ({ ...prev, role: e.target.value }))}
                                            style={{
                                                padding: '8px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '6px',
                                                fontSize: '14px'
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                        <input
                                            type="email"
                                            placeholder="e.g. sarah.johnson@company.com"
                                            value={newColleague.email}
                                            onChange={(e) => setNewColleague(prev => ({ ...prev, email: e.target.value }))}
                                            style={{
                                                padding: '8px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '6px',
                                                fontSize: '14px'
                                            }}
                                        />
                                        <input
                                            type="url"
                                            placeholder="e.g. linkedin.com/in/sarahjohnson"
                                            value={newColleague.linkedin}
                                            onChange={(e) => setNewColleague(prev => ({ ...prev, linkedin: e.target.value }))}
                                            style={{
                                                padding: '8px',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '6px',
                                                fontSize: '14px'
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={handleAddColleague}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: '#6366f1',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            <Save style={{ width: '14px', height: '14px' }} />
                                            Add
                                        </button>
                                        <button
                                            onClick={() => setShowAddColleague(false)}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: '#6b7280',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowAddColleague(true)}
                                    style={{
                                        padding: '12px',
                                        backgroundColor: '#f3f4f6',
                                        border: '2px dashed #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        color: '#6b7280',
                                        width: '100%'
                                    }}
                                >
                                    <Plus style={{ width: '16px', height: '16px' }} />
                                    Add Colleague
                                </button>
                            )}
                        </div>

                        {/* Company Mission */}
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#1f2937',
                                marginBottom: '12px'
                            }}>
                                <Lightbulb style={{ width: '18px', height: '18px', color: '#6366f1' }} />
                                What is the company's mission?
                            </label>
                            <textarea
                                value={prepData.company_mission}
                                onChange={(e) => setPrepData(prev => ({ ...prev, company_mission: e.target.value }))}
                                placeholder="What is the company's mission and how do you contribute to it?"
                                style={{
                                    width: '100%',
                                    minHeight: '80px',
                                    padding: '12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        {/* Action buttons */}
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'flex-end',
                            paddingTop: '24px',
                            borderTop: '1px solid #e5e7eb'
                        }}>
                            <button
                                onClick={onClose}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: getCompletionPercentage() === 100 ? '#10b981' : '#6366f1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                {getCompletionPercentage() === 100 ? (
                                    <CheckCircle style={{ width: '16px', height: '16px' }} />
                                ) : (
                                    <Save style={{ width: '16px', height: '16px' }} />
                                )}
                                {getCompletionPercentage() === 100 ? 'Complete Prep' : 'Save Progress'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterviewPrepModal; 