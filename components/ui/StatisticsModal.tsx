import React from 'react';
import { X, BarChart3, Target, Users, CircleCheckBig, TrendingUp, DollarSign } from 'lucide-react';

interface StatisticsModalProps {
    onClose: () => void;
    leads: any[];
    statsData?: any[];
}

const StatisticsModal: React.FC<StatisticsModalProps> = ({ onClose, leads = [] }) => {
    // Calculate statistics
    const totalLeads = leads.length;
    const foundLeads = leads.filter(lead => !lead.applied).length;
    const connectLeads = leads.filter(lead =>
        lead.applied &&
        lead.got_the_job !== true &&
        !lead.recruiter_interview &&
        !lead.technical_interview &&
        !lead.hiringmanager_interview
    ).length;
    const closeLeads = leads.filter(lead =>
        lead.applied &&
        (lead.got_the_job === true ||
            lead.recruiter_interview ||
            lead.technical_interview ||
            lead.hiringmanager_interview)
    ).length;

    const appliedLeads = leads.filter(lead => lead.applied).length;
    const gotJobLeads = leads.filter(lead => lead.got_the_job === true).length;
    const successRate = appliedLeads > 0 ? ((gotJobLeads / appliedLeads) * 100).toFixed(1) : '0';

    const totalPotentialValue = leads
        .filter(lead => lead.value_rate && lead.value_weeks)
        .reduce((sum, lead) => {
            const rate = lead.value_rate || 0;
            const weeks = lead.value_weeks || 0;
            const hoursPerWeek = lead.value_hour_per_week ? parseInt(lead.value_hour_per_week) : 40;
            return sum + (rate * hoursPerWeek * weeks);
        }, 0);

    const averageRate = leads
        .filter(lead => lead.value_rate)
        .reduce((sum, lead) => sum + (lead.value_rate || 0), 0) /
        leads.filter(lead => lead.value_rate).length || 0;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)'
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '900px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
                color: '#fff'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                    paddingBottom: '1rem'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <BarChart3 style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
                            Lead Statistics
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.7)',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        <X style={{ width: '20px', height: '20px' }} />
                    </button>
                </div>

                {/* Statistics Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    {/* Total Leads */}
                    <div style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        textAlign: 'center'
                    }}>
                        <Target style={{ width: '32px', height: '32px', color: '#3b82f6', marginBottom: '0.5rem' }} />
                        <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                            {totalLeads}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                            Total Leads
                        </div>
                    </div>

                    {/* Found Stage */}
                    <div style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        textAlign: 'center'
                    }}>
                        <Target style={{ width: '32px', height: '32px', color: '#3b82f6', marginBottom: '0.5rem' }} />
                        <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                            {foundLeads}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                            Found
                        </div>
                    </div>

                    {/* Connect Stage */}
                    <div style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        textAlign: 'center'
                    }}>
                        <Users style={{ width: '32px', height: '32px', color: '#f59e0b', marginBottom: '0.5rem' }} />
                        <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                            {connectLeads}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                            Connect
                        </div>
                    </div>

                    {/* Close Stage */}
                    <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        textAlign: 'center'
                    }}>
                        <CircleCheckBig style={{ width: '32px', height: '32px', color: '#10b981', marginBottom: '0.5rem' }} />
                        <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                            {closeLeads}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                            Close
                        </div>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {/* Success Rate */}
                    <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '12px',
                        padding: '1.5rem'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '1rem'
                        }}>
                            <TrendingUp style={{ width: '20px', height: '20px', color: '#10b981' }} />
                            <span style={{ fontWeight: '600' }}>Success Rate</span>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                            {successRate}%
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                            {gotJobLeads} out of {appliedLeads} applied leads
                        </div>
                    </div>

                    {/* Average Rate */}
                    <div style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '12px',
                        padding: '1.5rem'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '1rem'
                        }}>
                            <DollarSign style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
                            <span style={{ fontWeight: '600' }}>Average Rate</span>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                            €{averageRate.toFixed(0)}/hr
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                            Across all leads with rates
                        </div>
                    </div>

                    {/* Total Potential Value */}
                    <div style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '12px',
                        padding: '1.5rem'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '1rem'
                        }}>
                            <DollarSign style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
                            <span style={{ fontWeight: '600' }}>Potential Value</span>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                            €{totalPotentialValue.toLocaleString()}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                            Total potential earnings
                        </div>
                    </div>
                </div>

                {/* Close Button */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '2rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.75rem 2rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StatisticsModal; 