import React from 'react';
import { X, ExternalLink } from 'lucide-react';

interface JobSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobTitle: string;
    summary: string;
    jobUrl?: string;
}

const JobSummaryModal: React.FC<JobSummaryModalProps> = ({
    isOpen,
    onClose,
    jobTitle,
    summary,
    jobUrl
}) => {
    if (!isOpen) return null;

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
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '1rem'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: '#1f2937',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    maxWidth: '90vw',
                    maxHeight: '80vh',
                    overflow: 'auto',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                }}>
                    <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        margin: 0,
                        paddingRight: '1rem',
                        lineHeight: '1.4'
                    }}>
                        {jobTitle}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '6px',
                            padding: '0.5rem',
                            color: '#fff',
                            cursor: 'pointer',
                            flexShrink: 0
                        }}
                    >
                        <X style={{ width: '16px', height: '16px' }} />
                    </button>
                </div>

                {/* Summary */}
                <div style={{
                    fontSize: '0.875rem',
                    lineHeight: '1.6',
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: '1.5rem',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                }}>
                    {summary || 'No job description available.'}
                </div>

                {/* Actions */}
                <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    justifyContent: 'flex-end'
                }}>
                    {jobUrl && (
                        <a
                            href={jobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1rem',
                                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                border: '1px solid rgba(59, 130, 246, 0.4)',
                                borderRadius: '8px',
                                color: '#3b82f6',
                                textDecoration: 'none',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <ExternalLink style={{ width: '16px', height: '16px' }} />
                            View Job Posting
                        </a>
                    )}
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JobSummaryModal; 