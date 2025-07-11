import React, { useState } from 'react';
import { Archive, Search, X, RotateCcw, Trash2 } from 'lucide-react';
import { Lead } from '../../types/leads';

interface ArchiveModalProps {
    onClose: () => void;
    user: any;
    archivedLeads?: Lead[]; // Optional array of archived leads
    onRestoreLead?: (leadId: string) => void;
    onDeleteLead?: (leadId: string) => void;
}

const ArchiveModal: React.FC<ArchiveModalProps> = ({
    onClose,
    user,
    archivedLeads = [], // Default to empty array
    onRestoreLead,
    onDeleteLead
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter archived leads based on search term
    const filteredLeads = archivedLeads.filter(lead =>
        lead.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.notes && lead.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1a0b2e 0%, #16213e 25%, #0f3460 50%, #16213e 75%, #1a0b2e 100%)',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '80vh',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Archive style={{ width: '24px', height: '24px' }} />
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
                            Archived Leads ({archivedLeads.length})
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '8px',
                            padding: '0.5rem',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X style={{ width: '16px', height: '16px' }} />
                    </button>
                </div>

                {/* Search Bar */}
                <div style={{
                    position: 'relative',
                    marginBottom: '1.5rem'
                }}>
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
                        placeholder="Search archived leads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.875rem',
                            outline: 'none'
                        }}
                    />
                </div>

                {/* Content Area */}
                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    minHeight: '200px'
                }}>
                    {archivedLeads.length === 0 ? (
                        // Empty state
                        <div style={{
                            textAlign: 'center',
                            padding: '3rem 1rem',
                            color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                            <Archive style={{
                                width: '48px',
                                height: '48px',
                                margin: '0 auto 1rem auto',
                                opacity: 0.5
                            }} />
                            <h3 style={{
                                margin: '0 0 0.5rem 0',
                                fontSize: '1.125rem',
                                fontWeight: '600'
                            }}>
                                No Archived Leads
                            </h3>
                            <p style={{
                                margin: 0,
                                fontSize: '0.875rem',
                                opacity: 0.8
                            }}>
                                When you archive leads, they will appear here for easy management.
                            </p>
                        </div>
                    ) : filteredLeads.length === 0 ? (
                        // No search results
                        <div style={{
                            textAlign: 'center',
                            padding: '2rem 1rem',
                            color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                            <Search style={{
                                width: '32px',
                                height: '32px',
                                margin: '0 auto 1rem auto',
                                opacity: 0.5
                            }} />
                            <p style={{ margin: 0, fontSize: '0.875rem' }}>
                                No archived leads match "{searchTerm}"
                            </p>
                        </div>
                    ) : (
                        // Archived leads list
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                        }}>
                            {filteredLeads.map(lead => (
                                <div key={lead.id} style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{
                                            margin: '0 0 0.25rem 0',
                                            fontSize: '1rem',
                                            fontWeight: '600'
                                        }}>
                                            {lead.job_title}
                                        </h4>
                                        <p style={{
                                            margin: '0 0 0.25rem 0',
                                            fontSize: '0.875rem',
                                            opacity: 0.8
                                        }}>
                                            {lead.company}
                                        </p>
                                        <p style={{
                                            margin: 0,
                                            fontSize: '0.75rem',
                                            opacity: 0.6
                                        }}>
                                            Archived {new Date(lead.updated_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        gap: '0.5rem'
                                    }}>
                                        <button
                                            onClick={() => onRestoreLead?.(lead.id)}
                                            style={{
                                                padding: '0.5rem',
                                                background: 'rgba(16, 185, 129, 0.2)',
                                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                                borderRadius: '6px',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                fontSize: '0.75rem'
                                            }}
                                            title="Restore lead"
                                        >
                                            <RotateCcw style={{ width: '12px', height: '12px' }} />
                                            Restore
                                        </button>
                                        <button
                                            onClick={() => onDeleteLead?.(lead.id)}
                                            style={{
                                                padding: '0.5rem',
                                                background: 'rgba(239, 68, 68, 0.2)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                borderRadius: '6px',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                fontSize: '0.75rem'
                                            }}
                                            title="Delete permanently"
                                        >
                                            <Trash2 style={{ width: '12px', height: '12px' }} />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    marginTop: '1.5rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <p style={{
                        margin: 0,
                        fontSize: '0.75rem',
                        opacity: 0.7
                    }}>
                        {archivedLeads.length === 0
                            ? "No archived leads"
                            : `${archivedLeads.length} archived lead${archivedLeads.length !== 1 ? 's' : ''}`
                        }
                    </p>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '8px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ArchiveModal; 