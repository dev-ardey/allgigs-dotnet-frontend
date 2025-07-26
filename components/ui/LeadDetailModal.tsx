import React, { useState } from 'react';
import {
    X,
    MapPin,
    DollarSign,
    Calendar,
    Clock,
    User,
    Phone,
    Mail,
    MessageSquare,
    FileText,
    Edit,
    Save,
    Plus,
    Trash2,
    ExternalLink,
    Building,
    Activity,
    TrendingUp,
} from 'lucide-react';
import { LeadStage } from '../../types/leads';

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
    created_at?: string;
    job_summary?: string;
    job_url?: string;
    found_data?: {
        priority?: string;
    };
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
    } | null;
}

interface LeadDetailModalProps {
    lead: JobClickWithApplying;
    onClose: () => void;
    onUpdate: (updatedLead: JobClickWithApplying) => void;
}

interface Contact {
    id: string;
    name: string;
    role: string;
    email: string;
    phone: string;
    notes: string;
}

interface Activity {
    id: string;
    type: 'email' | 'call' | 'meeting' | 'application' | 'follow_up' | 'note';
    title: string;
    description: string;
    date: string;
    contact_id?: string;
    stage?: LeadStage;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
    lead,
    onClose,
    onUpdate
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'contacts' | 'activities'>('overview');
    const [editingNotes, setEditingNotes] = useState(false);
    const [notes, setNotes] = useState(lead.applying?.notes || '');
    const [newContact, setNewContact] = useState({ name: '', role: '', email: '', phone: '', notes: '' });
    const [showAddContact, setShowAddContact] = useState(false);
    const [newActivity, setNewActivity] = useState<{ type: Activity['type'], title: string, description: string }>({ type: 'note', title: '', description: '' });
    const [showAddActivity, setShowAddActivity] = useState(false);
    const [editingStartDate, setEditingStartDate] = useState(false);
    console.log(editingStartDate, setEditingStartDate, "editingStartDate - build fix");
    const [startDate, setStartDate] = useState(lead.applying?.starting_date || '');
    console.log(startDate, setStartDate, "startDate - build fix");
    const [editingGotJob, setEditingGotJob] = useState(false);
    console.log(editingGotJob, setEditingGotJob, "editingGotJob - build fix");
    const [gotJob, setGotJob] = useState<boolean | null>(lead.applying?.got_the_job || null);
    console.log(setGotJob, "setGotJob - build fix");

    // Mock data for demonstration
    const [contacts, setContacts] = useState<Contact[]>([
        {
            id: '1',
            name: 'Sarah Johnson',
            role: 'Hiring Manager',
            email: 'sarah.johnson@techflow.com',
            phone: '+31 20 123 4567',
            notes: 'Very responsive, prefers email communication'
        },
        {
            id: '2',
            name: 'Mark van der Berg',
            role: 'Technical Lead',
            email: 'mark.vandeberg@techflow.com',
            phone: '+31 20 123 4568',
            notes: 'Will conduct technical interview'
        }
    ]);

    const [activities, setActivities] = useState<Activity[]>([
        {
            id: '1',
            type: 'application',
            title: 'Application Submitted',
            description: 'Submitted application through LinkedIn with custom cover letter',
            date: '2025-01-13T14:30:00Z',
            contact_id: '1',
            stage: 'found'
        },
        {
            id: '2',
            type: 'email',
            title: 'Follow-up Email Sent',
            description: 'Sent follow-up email expressing continued interest',
            date: '2025-01-15T09:15:00Z',
            contact_id: '1',
            stage: 'found'
        },
        {
            id: '3',
            type: 'call',
            title: 'Initial Phone Screen',
            description: 'Had positive 30-minute phone conversation about role and company culture',
            date: '2025-01-16T16:00:00Z',
            contact_id: '1',
            stage: 'connect'
        },
        {
            id: '4',
            type: 'note',
            title: 'Research Notes',
            description: 'Company recently raised Series B funding, expanding development team',
            date: '2025-01-17T10:00:00Z',
            stage: 'found'
        },
        {
            id: '5',
            type: 'meeting',
            title: 'Technical Interview Scheduled',
            description: 'Scheduled technical interview for next Tuesday at 2 PM',
            date: '2025-01-18T11:30:00Z',
            contact_id: '2',
            stage: 'connect'
        },
        {
            id: '6',
            type: 'follow_up',
            title: 'Post-Interview Follow-up',
            description: 'Sent thank you email after technical interview',
            date: '2025-01-19T15:45:00Z',
            contact_id: '1',
            stage: 'close'
        }
    ]);

    const handleSaveNotes = () => {
        if (onUpdate && lead.applying) {
            const updatedLead = {
                ...lead,
                applying: {
                    ...lead.applying,
                    notes
                }
            };
            onUpdate(updatedLead);
            setEditingNotes(false);
        }
    };

    const handleAddContact = () => {
        if (newContact.name && newContact.email) {
            const contact: Contact = {
                id: Date.now().toString(),
                ...newContact
            };
            setContacts([...contacts, contact]);
            setNewContact({ name: '', role: '', email: '', phone: '', notes: '' });
            setShowAddContact(false);
        }
    };

    const handleAddActivity = () => {
        if (newActivity.title && newActivity.description) {
            const activity: Activity = {
                id: Date.now().toString(),
                ...newActivity,
                date: new Date().toISOString(),
                stage: lead.applying?.got_the_job ? 'close' : 'connect' // Automatically assign current lead stage
            };
            setActivities([activity, ...activities]);
            setNewActivity({ type: 'note', title: '', description: '' });
            setShowAddActivity(false);
        }
    };

    const handleSaveStartDate = () => {
        if (onUpdate && lead.applying) {
            const updatedLead = {
                ...lead,
                applying: {
                    ...lead.applying,
                    starting_date: startDate
                }
            };
            onUpdate(updatedLead);
            setEditingStartDate(false);
        }
    };

    console.log(handleSaveStartDate(), "handleSaveStartDate - build fix");

    const handleSaveGotJob = () => {
        if (onUpdate && lead.applying) {
            const updatedLead = {
                ...lead,
                applying: {
                    ...lead.applying,
                    got_the_job: gotJob
                }
            };
            onUpdate(updatedLead);
            setEditingGotJob(false);
        }
    };
    console.log(handleSaveGotJob(), "handleSaveGotJob - build fix");

    const getActivityIcon = (type: Activity['type']) => {
        switch (type) {
            case 'email': return <Mail style={{ width: '16px', height: '16px' }} />;
            case 'call': return <Phone style={{ width: '16px', height: '16px' }} />;
            case 'meeting': return <Calendar style={{ width: '16px', height: '16px' }} />;
            case 'application': return <FileText style={{ width: '16px', height: '16px' }} />;
            case 'follow_up': return <Clock style={{ width: '16px', height: '16px' }} />;
            case 'note': return <MessageSquare style={{ width: '16px', height: '16px' }} />;
            default: return <Activity style={{ width: '16px', height: '16px' }} />;
        }
    };

    const getStageColor = (stage: LeadStage) => {
        switch (stage) {
            case 'found': return '#3b82f6';
            case 'connect': return '#f59e0b';
            case 'close': return '#10b981';
            default: return '#6b7280';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatStageName = (stage: LeadStage) => {
        switch (stage) {
            case 'found': return 'Found';
            case 'connect': return 'Connect';
            case 'close': return 'Close';
            default: return stage;
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <TrendingUp style={{ width: '16px', height: '16px' }} /> },
        { id: 'interviews', label: 'Interview Details', icon: <Calendar style={{ width: '16px', height: '16px' }} /> },
        { id: 'notes', label: 'Notes', icon: <FileText style={{ width: '16px', height: '16px' }} /> },
        { id: 'contacts', label: 'Contacts', icon: <User style={{ width: '16px', height: '16px' }} /> },
        { id: 'activities', label: 'Activities', icon: <Activity style={{ width: '16px', height: '16px' }} /> }
    ];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1a0b2e 0%, #16213e 25%, #0f3460 50%, #16213e 75%, #1a0b2e 100%)',
                borderRadius: '16px',
                maxWidth: '900px',
                width: '100%',
                maxHeight: '90vh',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(16px)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.5rem'
                        }}>
                            <div style={{
                                padding: '0.25rem 0.75rem',
                                background: getStageColor(lead.applying?.got_the_job ? 'close' : 'connect'),
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                textTransform: 'uppercase'
                            }}>
                                {lead.applying?.got_the_job ? 'Closed' : 'Open'}
                            </div>
                            {lead.found_data?.priority && (
                                <div style={{
                                    padding: '0.25rem 0.75rem',
                                    background: lead.found_data.priority === 'high' ? '#ef4444' :
                                        lead.found_data.priority === 'medium' ? '#f59e0b' : '#10b981',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    textTransform: 'uppercase'
                                }}>
                                    {lead.found_data.priority} priority
                                </div>
                            )}
                        </div>
                        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '700' }}>
                            {lead.job_title}
                        </h2>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '0.875rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Building style={{ width: '16px', height: '16px' }} />
                                {lead.company}
                            </div>
                            {lead.location && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <MapPin style={{ width: '16px', height: '16px' }} />
                                    {lead.location}
                                </div>
                            )}
                            {lead.rate && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <DollarSign style={{ width: '16px', height: '16px' }} />
                                    {lead.rate}
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            padding: '0.5rem',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X style={{ width: '20px', height: '20px' }} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '0 1.5rem'
                }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                padding: '1rem 1.5rem',
                                background: 'transparent',
                                border: 'none',
                                color: activeTab === tab.id ? '#fff' : 'rgba(255, 255, 255, 0.6)',
                                cursor: 'pointer',
                                borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{
                    flex: 1,
                    padding: '1.5rem',
                    overflow: 'auto'
                }}>
                    {activeTab === 'overview' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Job Summary */}
                            <div>
                                <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
                                    Job Summary
                                </h3>
                                <p style={{
                                    margin: 0,
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    lineHeight: '1.6'
                                }}>
                                    {lead.job_summary}
                                </p>
                                {lead.job_url && (
                                    <a
                                        href={lead.job_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            color: '#3b82f6',
                                            textDecoration: 'none',
                                            marginTop: '0.75rem',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        <ExternalLink style={{ width: '16px', height: '16px' }} />
                                        View Original Job Posting
                                    </a>
                                )}
                            </div>

                            {/* Timeline */}
                            <div>
                                <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
                                    Timeline
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '8px'
                                    }}>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: '#3b82f6'
                                        }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                                                Lead Created
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                                                {formatDate(lead.created_at || lead.clicked_at)}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '8px'
                                    }}>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: lead.applying ? '#f59e0b' : '#3b82f6'
                                        }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                                                Moved to {lead.applying ? 'Applied' : 'Found'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                                                {formatDate(lead.applying?.created_at || lead.clicked_at)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div>
                                <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
                                    Quick Stats
                                </h3>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                    gap: '1rem'
                                }}>
                                    <div style={{
                                        padding: '1rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>
                                            {Math.floor((Date.now() - new Date(lead.clicked_at).getTime()) / (1000 * 60 * 60 * 24))}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                                            Days Active
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '1rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                                            {contacts.length}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                                            Contacts
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '1rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
                                            {activities.length}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                                            Activities
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Job Info */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 8 }}>Job Info</h3>
                                <div><strong>Title:</strong> {lead.job_title}</div>
                                <div><strong>Company:</strong> {lead.company}</div>
                                {lead.location && <div><strong>Location:</strong> {lead.location}</div>}
                                {lead.rate && <div><strong>Rate:</strong> {lead.rate}</div>}
                                {lead.job_url && <div><a href={lead.job_url} target="_blank" rel="noopener noreferrer">View Job Posting</a></div>}
                            </div>

                            {lead.applying && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 8 }}>Application Info</h3>
                                    <div><strong>Applied:</strong> {lead.applying.applied ? 'Yes' : 'No'}</div>
                                    <div><strong>Notes:</strong> <input value={lead.applying.notes || ''} onChange={() => {/* update logic */ }} /></div>
                                    <div><strong>Start Date:</strong> <input type="date" value={lead.applying.starting_date ? lead.applying.starting_date.split('T')[0] : ''} onChange={() => {/* update logic */ }} /></div>
                                    <div><strong>Got the job:</strong> <select value={lead.applying.got_the_job === true ? 'yes' : lead.applying.got_the_job === false ? 'no' : ''} onChange={() => {/* update logic */ }}><option value="">-</option><option value="yes">Yes</option><option value="no">No</option></select></div>
                                </div>
                            )}

                            {lead.applying && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 8 }}>Interviews</h3>
                                    {lead.applying.recruiter_interview && <div><strong>Recruiter interview:</strong> {lead.applying.recruiter_interview} ({lead.applying.interview_rating_recruiter === true ? 'Good' : lead.applying.interview_rating_recruiter === false ? 'Bad' : ''})</div>}
                                    {lead.applying.technical_interview && <div><strong>Technical interview:</strong> {lead.applying.technical_interview} ({lead.applying.interview_rating_technical === true ? 'Good' : lead.applying.interview_rating_technical === false ? 'Bad' : ''})</div>}
                                    {lead.applying.hiringmanager_interview && <div><strong>Hiring Manager interview:</strong> {lead.applying.hiringmanager_interview} ({lead.applying.interview_rating_hiringmanager === true ? 'Good' : lead.applying.interview_rating_hiringmanager === false ? 'Bad' : ''})</div>}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1rem'
                            }}>
                                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                                    Notes
                                </h3>
                                {!editingNotes && (
                                    <button
                                        onClick={() => setEditingNotes(true)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            background: 'rgba(59, 130, 246, 0.2)',
                                            border: '1px solid rgba(59, 130, 246, 0.4)',
                                            borderRadius: '8px',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        <Edit style={{ width: '16px', height: '16px' }} />
                                        Edit
                                    </button>
                                )}
                            </div>
                            {editingNotes ? (
                                <div>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Add your notes about this lead..."
                                        style={{
                                            width: '100%',
                                            height: '200px',
                                            padding: '1rem',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: '8px',
                                            color: '#fff',
                                            fontSize: '0.875rem',
                                            resize: 'vertical',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                    <div style={{
                                        display: 'flex',
                                        gap: '0.5rem',
                                        marginTop: '1rem'
                                    }}>
                                        <button
                                            onClick={handleSaveNotes}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: 'rgba(16, 185, 129, 0.2)',
                                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            <Save style={{ width: '16px', height: '16px' }} />
                                            Save
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingNotes(false);
                                                setNotes(lead.applying?.notes || '');
                                            }}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    padding: '1rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '8px',
                                    minHeight: '100px',
                                    color: notes ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                                    fontSize: '0.875rem',
                                    lineHeight: '1.6'
                                }}>
                                    {notes || 'No notes yet. Click Edit to add notes about this lead.'}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'contacts' && (
                        <div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1rem'
                            }}>
                                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                                    Contacts
                                </h3>
                                <button
                                    onClick={() => setShowAddContact(true)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: 'rgba(59, 130, 246, 0.2)',
                                        border: '1px solid rgba(59, 130, 246, 0.4)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    <Plus style={{ width: '16px', height: '16px' }} />
                                    Add Contact
                                </button>
                            </div>

                            {showAddContact && (
                                <div style={{
                                    padding: '1rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '8px',
                                    marginBottom: '1rem'
                                }}>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                        gap: '1rem',
                                        marginBottom: '1rem'
                                    }}>
                                        <input
                                            type="text"
                                            placeholder="Name"
                                            value={newContact.name}
                                            onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                            style={{
                                                padding: '0.5rem',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                borderRadius: '6px',
                                                color: '#fff',
                                                fontSize: '0.875rem'
                                            }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Role"
                                            value={newContact.role}
                                            onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                                            style={{
                                                padding: '0.5rem',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                borderRadius: '6px',
                                                color: '#fff',
                                                fontSize: '0.875rem'
                                            }}
                                        />
                                        <input
                                            type="email"
                                            placeholder="Email"
                                            value={newContact.email}
                                            onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                            style={{
                                                padding: '0.5rem',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                borderRadius: '6px',
                                                color: '#fff',
                                                fontSize: '0.875rem'
                                            }}
                                        />
                                        <input
                                            type="tel"
                                            placeholder="Phone"
                                            value={newContact.phone}
                                            onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                            style={{
                                                padding: '0.5rem',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                borderRadius: '6px',
                                                color: '#fff',
                                                fontSize: '0.875rem'
                                            }}
                                        />
                                    </div>
                                    <textarea
                                        placeholder="Notes about this contact..."
                                        value={newContact.notes}
                                        onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                                        style={{
                                            width: '100%',
                                            height: '60px',
                                            padding: '0.5rem',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            fontSize: '0.875rem',
                                            resize: 'vertical',
                                            fontFamily: 'inherit',
                                            marginBottom: '1rem'
                                        }}
                                    />
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={handleAddContact}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: 'rgba(16, 185, 129, 0.2)',
                                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            Add Contact
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowAddContact(false);
                                                setNewContact({ name: '', role: '', email: '', phone: '', notes: '' });
                                            }}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {contacts.map(contact => (
                                    <div key={contact.id} style={{
                                        padding: '1rem',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: '600' }}>
                                                    {contact.name}
                                                </h4>
                                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                                                    {contact.role}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setContacts(contacts.filter(c => c.id !== contact.id))}
                                                style={{
                                                    background: 'rgba(239, 68, 68, 0.2)',
                                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                                    borderRadius: '6px',
                                                    padding: '0.25rem',
                                                    color: '#fff',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Trash2 style={{ width: '14px', height: '14px' }} />
                                            </button>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.25rem',
                                            fontSize: '0.875rem',
                                            color: 'rgba(255, 255, 255, 0.8)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Mail style={{ width: '14px', height: '14px' }} />
                                                <a href={`mailto:${contact.email}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                                                    {contact.email}
                                                </a>
                                            </div>
                                            {contact.phone && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Phone style={{ width: '14px', height: '14px' }} />
                                                    <a href={`tel:${contact.phone}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                                                        {contact.phone}
                                                    </a>
                                                </div>
                                            )}
                                            {contact.notes && (
                                                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                                                    {contact.notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'activities' && (
                        <div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1rem'
                            }}>
                                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                                    Activities
                                </h3>
                                <button
                                    onClick={() => setShowAddActivity(true)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: 'rgba(59, 130, 246, 0.2)',
                                        border: '1px solid rgba(59, 130, 246, 0.4)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    <Plus style={{ width: '16px', height: '16px' }} />
                                    Add Activity
                                </button>
                            </div>

                            {showAddActivity && (
                                <div style={{
                                    padding: '1rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '8px',
                                    marginBottom: '1rem'
                                }}>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                        gap: '1rem',
                                        marginBottom: '1rem'
                                    }}>
                                        <select
                                            value={newActivity.type}
                                            onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value as Activity['type'] })}
                                            style={{
                                                padding: '0.5rem',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                borderRadius: '6px',
                                                color: '#fff',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            <option value="note">Note</option>
                                            <option value="email">Email</option>
                                            <option value="call">Call</option>
                                            <option value="meeting">Meeting</option>
                                            <option value="application">Application</option>
                                            <option value="follow_up">Follow-up</option>
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Title"
                                            value={newActivity.title}
                                            onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                                            style={{
                                                padding: '0.5rem',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                borderRadius: '6px',
                                                color: '#fff',
                                                fontSize: '0.875rem'
                                            }}
                                        />
                                    </div>
                                    <textarea
                                        placeholder="Activity description..."
                                        value={newActivity.description}
                                        onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                                        style={{
                                            width: '100%',
                                            height: '80px',
                                            padding: '0.5rem',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            fontSize: '0.875rem',
                                            resize: 'vertical',
                                            fontFamily: 'inherit',
                                            marginBottom: '1rem'
                                        }}
                                    />
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={handleAddActivity}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: 'rgba(16, 185, 129, 0.2)',
                                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            Add Activity
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowAddActivity(false);
                                                setNewActivity({ type: 'note', title: '', description: '' });
                                            }}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {activities.map(activity => {
                                    const contact = contacts.find(c => c.id === activity.contact_id);
                                    return (
                                        <div key={activity.id} style={{
                                            padding: '1rem',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '0.75rem'
                                            }}>
                                                <div style={{
                                                    padding: '0.5rem',
                                                    background: 'rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    {getActivityIcon(activity.type)}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'flex-start',
                                                        marginBottom: '0.5rem'
                                                    }}>
                                                        <div>
                                                            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: '600' }}>
                                                                {activity.title}
                                                            </h4>
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.5rem',
                                                                fontSize: '0.75rem',
                                                                color: 'rgba(255, 255, 255, 0.6)',
                                                                flexWrap: 'wrap'
                                                            }}>
                                                                <span style={{
                                                                    padding: '0.125rem 0.5rem',
                                                                    background: 'rgba(255, 255, 255, 0.1)',
                                                                    borderRadius: '4px',
                                                                    textTransform: 'uppercase',
                                                                    fontWeight: '600'
                                                                }}>
                                                                    {activity.type.replace('_', ' ')}
                                                                </span>
                                                                {activity.stage && (
                                                                    <span style={{
                                                                        padding: '0.125rem 0.5rem',
                                                                        background: getStageColor(activity.stage),
                                                                        borderRadius: '12px',
                                                                        fontSize: '0.7rem',
                                                                        fontWeight: '600',
                                                                        color: '#fff',
                                                                        textTransform: 'uppercase'
                                                                    }}>
                                                                        ({formatStageName(activity.stage)})
                                                                    </span>
                                                                )}
                                                                <span>{formatDate(activity.date)}</span>
                                                                {contact && <span>• {contact.name}</span>}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setActivities(activities.filter(a => a.id !== activity.id))}
                                                            style={{
                                                                background: 'rgba(239, 68, 68, 0.2)',
                                                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                                                borderRadius: '6px',
                                                                padding: '0.25rem',
                                                                color: '#fff',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <Trash2 style={{ width: '14px', height: '14px' }} />
                                                        </button>
                                                    </div>
                                                    <p style={{
                                                        margin: 0,
                                                        fontSize: '0.875rem',
                                                        color: 'rgba(255, 255, 255, 0.8)',
                                                        lineHeight: '1.5'
                                                    }}>
                                                        {activity.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeadDetailModal; 