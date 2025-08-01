import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Sparkles, TrendingUp, Target, Mail, Zap, Lock, BarChart3, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../SupabaseClient';
// import { useRouter } from 'next/router';
import AddJobForm from '../components/ui/add-job-form';
import GlobalNav from '../components/ui/GlobalNav';
import LoginForm from '../components/ui/login';
import CompleteProfileForm from '../components/ui/CompleteProfileForm';
import { useProfileCheck } from '../components/ui/useProfileCheck';
import LeadsPipeline from '../components/ui/LeadsPipeline';

// Qualified Leads Interfaces en Types
import {
  Clock, Phone, Video, XCircle, Trophy,
  // AlertCircle,
  // ChevronRight,
  // Brain,
} from 'lucide-react';

// Lead Status Enum
enum LeadStatus {
  NEW = 'new',
  APPLIED = 'applied',
  FOLLOW_UP = 'follow_up',
  SPOKEN = 'spoken',
  INTERVIEWED = 'interviewed',
  DENIED = 'denied',
  SUCCEEDED = 'succeeded'
}

// Lead Interface
interface Lead {
  UNIQUE_ID?: string;
  Title?: string;
  Company?: string;
  Location?: string;
  rate?: string;
  date?: string;
  Summary?: string;
  URL?: string;
  created_at?: string;
  inserted_at?: string;
  added_by?: string;
  added_by_email?: string;
  poster_name?: string;
  source?: string;
  tags?: string;
  clicked_at?: string;

  // CRM specifieke velden
  status?: LeadStatus;
  applied_at?: string;
  follow_up_date?: string;
  last_contact?: string;
  notes?: string;
  potential_value?: number;
  quality_score?: number;
  days_since_action?: number;
  next_action_due?: string;
}

// Sales KPI Interface
export interface SalesKPIs {
  total_leads: number;
  conversion_rate: number;
  potential_revenue: number;
  lead_quality_score: number;
  cost_per_application: number;
  pipeline_health: number;
  active_applications: number;
  interviews_scheduled: number;
  average_response_time: number;
}

// Status configuratie met styling en acties
const STATUS_CONFIG = {
  [LeadStatus.NEW]: {
    label: 'New Lead',
    color: '#6366f1',
    bgColor: '#f0f9ff',
    icon: Clock,
    nextAction: 'Review & Apply',
    daysUntilNext: 0
  },
  [LeadStatus.APPLIED]: {
    label: 'Applied',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    icon: CheckCircle,
    nextAction: 'Follow-up',
    daysUntilNext: 3
  },
  [LeadStatus.FOLLOW_UP]: {
    label: 'Follow-up Sent',
    color: '#3b82f6',
    bgColor: '#eff6ff',
    icon: Clock,
    nextAction: 'Phone Call',
    daysUntilNext: 5
  },
  [LeadStatus.SPOKEN]: {
    label: 'Spoken',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    icon: Phone,
    nextAction: 'Interview',
    daysUntilNext: 7
  },
  [LeadStatus.INTERVIEWED]: {
    label: 'Interviewed',
    color: '#06b6d4',
    bgColor: '#ecfeff',
    icon: Video,
    nextAction: 'Await Response',
    daysUntilNext: 10
  },
  [LeadStatus.DENIED]: {
    label: 'Denied',
    color: '#ef4444',
    bgColor: '#fef2f2',
    icon: XCircle,
    nextAction: 'Learn & Improve',
    daysUntilNext: 0
  },
  [LeadStatus.SUCCEEDED]: {
    label: 'Success!',
    color: '#10b981',
    bgColor: '#f0fdf4',
    icon: Trophy,
    nextAction: 'Celebrate',
    daysUntilNext: 0
  }
};

// Mock data voor demo
// const MOCK_LEADS: Lead[] = [
//   {
//     UNIQUE_ID: '1',
//     Title: 'Senior Frontend Developer',
//     Company: 'TechCorp Amsterdam',
//     Location: 'Amsterdam, NL',
//     rate: '€75/hour',
//     date: '2025-06-28',
//     Summary: 'React, TypeScript, 5+ years experience',
//     URL: 'https://example.com/job1',
//     status: LeadStatus.APPLIED,
//     applied_at: '2025-06-29T10:00:00Z',
//     follow_up_date: '2025-07-02T10:00:00Z',
//     potential_value: 15000,
//     quality_score: 85,
//     days_since_action: 1,
//     notes: 'Interesting company, good culture fit'
//   },
//   {
//     UNIQUE_ID: '2',
//     Title: 'React Developer',
//     Company: 'StartupHub',
//     Location: 'Rotterdam, NL',
//     rate: '€65/hour',
//     date: '2025-06-27',
//     Summary: 'React, Node.js, startup environment',
//     URL: 'https://example.com/job2',
//     status: LeadStatus.FOLLOW_UP,
//     applied_at: '2025-06-26T14:00:00Z',
//     follow_up_date: '2025-06-30T14:00:00Z',
//     potential_value: 12000,
//     quality_score: 78,
//     days_since_action: 3,
//     notes: 'Quick response needed, competitive role'
//   },
//   {
//     UNIQUE_ID: '3',
//     Title: 'Full Stack Engineer',
//     Company: 'InnovateLabs',
//     Location: 'Utrecht, NL',
//     rate: '€80/hour',
//     date: '2025-06-25',
//     Summary: 'React, Node.js, PostgreSQL, 3+ years',
//     URL: 'https://example.com/job3',
//     status: LeadStatus.INTERVIEWED,
//     applied_at: '2025-06-20T09:00:00Z',
//     follow_up_date: '2025-06-25T16:00:00Z',
//     potential_value: 18000,
//     quality_score: 92,
//     days_since_action: 5,
//     notes: 'Great interview, waiting for final decision'
//   }
// ];

// Sales KPI Mock Data
// const MOCK_SALES_KPI: SalesKPIs = {
//   total_leads: 24,
//   conversion_rate: 12.5, // percentage
//   potential_revenue: 45000,
//   lead_quality_score: 82,
//   cost_per_application: 25,
//   pipeline_health: 78,
//   active_applications: 8,
//   interviews_scheduled: 3,
//   average_response_time: 4.2
// };

interface QualifiedLeadsSectionProps {
  leads: Lead[];
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
  onLogClick: (lead: Lead) => void;
  statsData: StatsDay[];
}

// Original QualifiedLeadsSection (kept for reference but not used)
const QualifiedLeadsSectionOriginal: React.FC<QualifiedLeadsSectionProps> = ({
  leads,
  onStatusChange,
  onLogClick,
  statsData
}) => {
  console.log('QualifiedLeadsSectionOriginal - unused component for reference');
  // Calculate dynamic KPIs based on actual leads
  const salesKPIs = useMemo(() => {
    const totalLeads = leads.length;
    const interviewedLeads = leads.filter(lead => lead.status === LeadStatus.INTERVIEWED).length;
    const succeededLeads = leads.filter(lead => lead.status === LeadStatus.SUCCEEDED).length;
    const activeLeads = leads.filter(lead =>
      [LeadStatus.APPLIED, LeadStatus.FOLLOW_UP, LeadStatus.SPOKEN, LeadStatus.INTERVIEWED].includes(lead.status || LeadStatus.NEW)
    ).length;

    const conversionRate = totalLeads > 0 ? (succeededLeads / totalLeads) * 100 : 0;
    const potentialRevenue = leads.reduce((sum, lead) => sum + (lead.potential_value || 0), 0);
    const avgQualityScore = totalLeads > 0 ?
      leads.reduce((sum, lead) => sum + (lead.quality_score || 0), 0) / totalLeads : 0;

    return {
      total_leads: totalLeads,
      conversion_rate: Math.round(conversionRate * 10) / 10,
      potential_revenue: potentialRevenue,
      lead_quality_score: Math.round(avgQualityScore),
      cost_per_application: 25, // Static for now
      pipeline_health: Math.round(avgQualityScore * 0.9), // Based on quality score
      active_applications: activeLeads,
      interviews_scheduled: interviewedLeads,
      average_response_time: 4.2 // Static for now
    };
  }, [leads]);
  console.log('salesKPIs - build fix:', salesKPIs);
  // Popup state for locked features
  const [showFeatureModal, setShowFeatureModal] = useState<null | string>(null);
  const [notifyMe, setNotifyMe] = useState<{ [key: string]: boolean }>({});
  console.log('QualifiedLeadsSectionOriginal variables:', { showFeatureModal, notifyMe, setShowFeatureModal, setNotifyMe });
  console.log(QualifiedLeadsSectionOriginal, "build")
  // Timer functie voor dagen sinds actie
  const calculateDaysSinceAction = useCallback((lead: Lead): number => {
    if (!lead.applied_at && !lead.follow_up_date) return 0;

    const lastActionDate = new Date(lead.follow_up_date || lead.applied_at || Date.now());
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastActionDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  // Status change handler met automatische timer
  const handleStatusChange = useCallback((leadId: string, newStatus: LeadStatus) => {
    onStatusChange(leadId, newStatus);

    // Auto-start timer voor follow-up
    if (newStatus === LeadStatus.APPLIED) {
      // Hier zou je de follow_up_date kunnen instellen
      console.log(`Timer started for lead ${leadId} - follow up in 3 days`);
    }
  }, [onStatusChange]);

  // Urgency indicator
  const getUrgencyColor = useCallback((daysSince: number, status: LeadStatus): string => {
    if (status === LeadStatus.DENIED || status === LeadStatus.SUCCEEDED) return '#6b7280';
    if (daysSince > 7) return '#ef4444';
    if (daysSince > 3) return '#f59e0b';
    return '#10b981';
  }, []);

  return (
    <div style={{ color: 'white', marginBottom: '2rem' }}>
      {/* Feature Modal Popup */}

      {/* Content */}
      <div style={{ position: 'relative' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem'
        }}>
          <div>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: '700',
              margin: '0 0 0.5rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Target style={{ width: '32px', height: '32px' }} />
              Qualified Leads
            </h2>
            <p style={{
              fontSize: '1.1rem',
              opacity: 0.9,
              margin: 0
            }}>
              Track your sales pipeline and manage lead progression
            </p>
          </div>

          {/* Horizontal Rule */}
          <hr style={{
            border: 'none',
            height: '1px',
            background: 'rgba(255, 255, 255, 0.2)',
            margin: '1.5rem 0'
          }} />

          {/* CRM Features (Locked) */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {[
              { icon: Mail, label: 'Marketing', color: 'rgba(16, 185, 129, 0.3)', borderColor: 'rgba(16, 185, 129, 0.4)' },
              { icon: Zap, label: 'Tooling', color: 'rgba(59, 130, 246, 0.3)', borderColor: 'rgba(59, 130, 246, 0.4)' },
              { icon: Sparkles, label: 'AI Agent', color: 'rgba(147, 51, 234, 0.3)', borderColor: 'rgba(147, 51, 234, 0.4)' }
            ].map((feature, index) => (
              <div key={index} style={{ position: 'relative' }}>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    background: feature.color,
                    border: `1px solid ${feature.borderColor}`,
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: 1,
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                  onClick={() => setShowFeatureModal(feature.label)}
                >
                  <feature.icon style={{ width: '16px', height: '16px' }} />
                  {feature.label}
                  <Lock style={{ width: '14px', height: '14px' }} />
                </button>

                {/* Balloon Tooltip */}
                {showFeatureModal === feature.label && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: '0.5rem',
                    background: feature.color.replace('0.3', '0.8'),
                    border: `1px solid ${feature.borderColor}`,
                    borderRadius: '16px',
                    padding: '1.5rem',
                    minWidth: '280px',
                    maxWidth: '320px',
                    backdropFilter: 'blur(60px) saturate(200%)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    zIndex: 1000,
                    color: '#fff'
                  }}>
                    {/* Arrow pointing up */}
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderBottom: `8px solid ${feature.borderColor}`,
                    }} />

                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      marginBottom: '0.75rem',
                      color: '#fff'
                    }}>
                      {feature.label}
                    </h3>

                    <p style={{
                      fontSize: '0.95rem',
                      marginBottom: '1rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      lineHeight: '1.4'
                    }}>
                      {feature.label === 'AI Agent' && (
                        <>This AI agent will search for jobs, apply with your profile, contact the lead, make calendar appointments with recruiters, and more.</>
                      )}
                      {feature.label === 'Tooling' && (
                        <>Get access to tools that help you get better results and streamline your job search process.</>
                      )}
                      {feature.label === 'Marketing' && (
                        <>Access checklists, extra information, and tips for higher success rates in your applications.</>
                      )}
                    </p>

                    <div style={{ textAlign: 'center' }}>
                      <p style={{
                        fontSize: '0.9rem',
                        marginBottom: '1rem',
                        color: '#fff',
                        fontWeight: '600'
                      }}>
                        Interested?
                      </p>

                      <button
                        onClick={() => {
                          setNotifyMe((prev) => ({ ...prev, [feature.label]: !prev[feature.label] }));
                          setShowFeatureModal(null);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: 'rgba(255, 255, 255, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          backdropFilter: 'blur(8px)'
                        }}
                      >
                        {notifyMe[feature.label] ? '✓ Notify me when ready' : 'Notify me when ready'}
                      </button>
                    </div>

                    <button
                      onClick={() => setShowFeatureModal(null)}
                      style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.7)',
                        cursor: 'pointer',
                        padding: '0.25rem'
                      }}
                    >
                      <X style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>



        {/* Leads Table */}
        <hr style={{
          border: 'none',
          height: '1px',
          background: 'rgba(255, 255, 255, 0.2)',
          margin: '1.5rem 0'
        }} />

        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#fff',
          margin: 0,
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <BarChart3 style={{ width: '20px', height: '20px' }} />
          Lead Pipeline
        </h3>
        <p style={{
          fontSize: '0.9rem',
          color: 'rgba(255, 255, 255, 0.7)',
          margin: '0 0 1rem 0'
        }}>
          Detailed overview with tools to maximise your opportunities
        </p>

        <div style={{
          overflowX: 'auto',
          maxHeight: leads.length > 10 ? '400px' : 'auto',
          overflowY: leads.length > 10 ? 'auto' : 'visible'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <tr style={{
                background: 'transparent',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#fff', fontWeight: '600' }}>Lead</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#fff', fontWeight: '600', minWidth: '160px' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#fff', fontWeight: '600' }}>Progress</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#fff', fontWeight: '600' }}>Value</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#fff', fontWeight: '600' }}>Timer</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#fff', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const daysSince = calculateDaysSinceAction(lead);
                const status = lead.status || LeadStatus.NEW;
                const config = STATUS_CONFIG[status];
                const urgencyColor = getUrgencyColor(daysSince, status);

                return (
                  <tr
                    key={lead.UNIQUE_ID}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    onClick={() => onLogClick(lead)}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.95rem' }}>
                          {lead.Title}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                          {lead.Company} • {lead.Location}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        background: config.bgColor,
                        color: config.color
                      }}>
                        <config.icon style={{ width: '14px', height: '14px' }} />
                        {config.label}
                      </span>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '100px',
                          height: '6px',
                          background: '#e5e7eb',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${(Object.keys(LeadStatus).indexOf(status) + 1) * 14.28}%`,
                            height: '100%',
                            background: `linear-gradient(90deg, ${config.color}, ${config.color}cc)`,
                            borderRadius: '3px'
                          }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                          {Math.round((Object.keys(LeadStatus).indexOf(status) + 1) * 14.28)}%
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ color: '#10b981', fontWeight: '600', fontSize: '0.95rem' }}>
                        €{(lead.potential_value || 0).toLocaleString()}
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }}>
                        Quality: {lead.quality_score || 0}%
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: urgencyColor
                        }} />
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: urgencyColor
                        }}>
                          {daysSince}d
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                        {config.nextAction}
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {Object.values(LeadStatus).map((statusOption) => {
                          const isActive = statusOption === status;
                          const optionConfig = STATUS_CONFIG[statusOption];

                          return (
                            <button
                              key={statusOption}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(lead.UNIQUE_ID!, statusOption);
                              }}
                              style={{
                                padding: '0.5rem',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                background: isActive ? optionConfig.color : 'rgba(255, 255, 255, 0.1)',
                                color: isActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
                                transition: 'all 0.1s ease',
                                opacity: isActive ? 1 : 0.7,
                                backdropFilter: 'blur(8px)',
                                transform: 'scale(1)'
                              }}
                              onMouseEnter={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                                  e.currentTarget.style.color = '#fff';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                                }
                              }}
                            >
                              <optionConfig.icon style={{ width: '16px', height: '16px' }} />
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics Section */}
      <hr style={{
        border: 'none',
        height: '1px',
        background: 'rgba(255, 255, 255, 0.2)',
        margin: '1.5rem 0'
      }} />

      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#fff',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <TrendingUp style={{ width: '20px', height: '20px' }} />
        Lead Statistics
      </h3>

      <div style={{
        height: '192px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '1rem',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* @ts-ignore */}
        <ResponsiveContainer width="100%" height="100%">
          {/* @ts-ignore */}
          <LineChart data={statsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)" />
            {/* @ts-ignore */}
            <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.8)" fontSize={12} />
            {/* @ts-ignore */}
            <YAxis stroke="rgba(255, 255, 255, 0.8)" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#fff'
              }}
            />
            {/* @ts-ignore */}
            <Line
              type="monotone"
              dataKey="views"
              stroke="#9333ea"
              strokeWidth={3}
              dot={{ fill: '#9333ea', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sales KPIs Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginTop: '1.5rem'
      }}>
        {[
          { label: 'Total Weekly Leads', value: statsData.reduce((acc, day) => acc + day.views, 0), suffix: '' },
          { label: 'Conversion Rate', value: salesKPIs.conversion_rate, suffix: '%' },
          { label: 'Potential Revenue', value: `€${(salesKPIs.potential_revenue / 1000).toFixed(0)}K`, suffix: '' },
          { label: 'Pipeline Health', value: salesKPIs.pipeline_health, suffix: '%' },
          { label: 'Active Appl', value: salesKPIs.active_applications, suffix: '' },
          { label: 'Interviews', value: salesKPIs.interviews_scheduled, suffix: '' }
        ].map((kpi, index) => (
          <div
            key={index}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              padding: '1.25rem',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.25rem' }}>
              {kpi.value}{kpi.suffix}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
              {kpi.label}
            </div>
          </div>
        ))}
      </div>


    </div>
  );
};


// interface Profile {
//   firstName: string;
//   lastName: string;
//   job_title: string;
//   location: string;
//   linkedIn?: string;
//   industry: string;
//   linkedin_URL: string;
//   isAvailableForWork?: boolean;
//   hourlyRate?: number;
//   age?: number;
//   lastYearEarnings?: number;
//   gender?: string;
//   interests?: string;
//   mainProblem?: string;
// }

// interface Document {
//   id: string;
//   name: string;
//   type: string;
//   size: string;
//   uploadedAt: string;
// }

interface Job {
  UNIQUE_ID?: string;
  Title?: string;
  Company?: string;
  Location?: string;
  rate?: string;
  date?: string;
  Summary?: string;
  URL?: string;
  created_at?: string;
  inserted_at?: string;
  added_by?: string;
  added_by_email?: string;
  poster_name?: string;
  source?: string;
  tags?: string;
  clicked_at?: string;
}


// Interface voor stats data
interface StatsDay {
  name: string;
  date: string;
  views: number;
}

export default function Dashboard() {
  // const [isAvailable, setIsAvailable] = useState(true);
  // const [editKeywords, setEditKeywords] = useState(false);
  // const [newKeyword, setNewKeyword] = useState('');
  // const [keywords, setKeywords] = useState(["Frontend", "Backend", "React", "Node.js", "TypeScript"]);
  // const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [recentlyClickedJobs, setRecentlyClickedJobs] = useState<Job[]>([]);
  const [showRecentlyClicked] = useState(false);
  const [loadingRecentlyClicked, setLoadingRecentlyClicked] = useState(false);
  console.log(loadingRecentlyClicked, "loadingRecentlyClicked");
  console.log(showRecentlyClicked, "showRecentlyClicked - build fix");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // const router = useRouter();
  // const searchJobs = (keyword: string) => {
  //   router.push(`/leadSearch?search=${encodeURIComponent(keyword)}`);
  // };
  // const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  // const emptyProfile: Profile = {
  //   firstName: '',
  //   lastName: '',
  //   job_title: '',
  //   location: '',
  //   linkedIn: '',
  //   industry: '',
  //   linkedin_URL: '',
  //   isAvailableForWork: true,
  //   hourlyRate: 75,
  //   age: 30,
  //   lastYearEarnings: 75000,
  //   gender: 'Prefer not to say',
  //   interests: 'Technology, Innovation, Problem Solving',
  //   mainProblem: 'Finding the right opportunities',
  // };
  // const [profile, setProfile] = useState<Profile>(emptyProfile);
  // const [editedProfile, setEditedProfile] = useState<Profile>(emptyProfile);
  // const [editMode, setEditMode] = useState(false);

  // Mail notification settings
  // const [mailNotifications, setMailNotifications] = useState({
  //   leadNotifications: true,
  //   followUpReminders: true,
  //   weeklyDigest: true,
  //   applicationStatusUpdates: true,
  //   interviewReminders: true,
  //   marketInsights: false,
  //   systemUpdates: true
  // });
  // const [followUpDays, setFollowUpDays] = useState(3);

  const getLast7Days = (): StatsDay[] => {
    const days: StatsDay[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const dayNames = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
      const dayName = dayNames[date.getDay()];
      const dateString = date.toISOString().split('T')[0];

      // Null checks voor TypeScript
      if (dayName && dateString) {
        days.push({
          name: dayName,
          date: dateString,
          views: 0 // Wordt gevuld met echte data
        });
      }
    }

    return days;
  };

  // Voeg deze state toe aan je component:
  const [statsData, setStatsData] = useState<StatsDay[]>(getLast7Days());
  // const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  console.log(loadingStats, "build error")

  // Functie om job clicks per dag op te halen
  const fetchJobClicksStats = async () => {
    if (!user || !user.id) return;

    setLoadingStats(true);
    try {
      // Haal de laatste 7 dagen op
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const { data: clicks, error } = await supabase
        .from('job_clicks')
        .select('clicked_at')
        .eq('user_id', user.id)
        .gte('clicked_at', startDate.toISOString())
        .lte('clicked_at', endDate.toISOString())
        .order('clicked_at', { ascending: true });

      if (error) {
        console.error('Error fetching job clicks stats:', error);
        return;
      }

      // Genereer de laatste 7 dagen
      const last7Days = getLast7Days();

      // Tel clicks per dag
      const clicksPerDay: { [key: string]: number } = {};
      clicks?.forEach(click => {
        if (click.clicked_at) {
          const clickDate = new Date(click.clicked_at).toISOString().split('T')[0];
          if (clickDate) {
            clicksPerDay[clickDate] = (clicksPerDay[clickDate] || 0) + 1;
          }
        }
      });

      // Vul de stats data met echte cijfers
      const updatedStats: StatsDay[] = last7Days.map(day => ({
        ...day,
        views: clicksPerDay[day.date] || 0
      }));

      setStatsData(updatedStats);

    } catch (error) {
      console.error('Error in fetchJobClicksStats:', error);
    } finally {
      setLoadingStats(false);
    }
  };




  // const handleLogout = async () => {
  //   await supabase.auth.signOut();
  //   window.location.reload();
  // };















  // Voeg deze useEffect toe aan je component:
  useEffect(() => {
    if (user && user.id) {
      fetchJobClicksStats();
    }
  }, [user]);

  // Fetch future features from Supabase
  useEffect(() => {
    const fetchFutureFeatures = async () => {
      if (!user) {
        console.log('No user found, skipping future features fetch');
        return;
      }

      console.log('Fetching future features for user:', user.id);

      try {
        const { data, error } = await supabase
          .from('future_features')
          .select('marketing, agent, tooling, interview_optimisation, value_proposition')
          .eq('user_id', user.id)
          .single();

        console.log('Future features query result:', { data, error });

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error fetching future features:', error);
        } else if (data) {
          console.log('Found future features data:', data);
          setFutureFeatures({
            marketing: data.marketing ?? false,
            agent: data.agent ?? false,
            tooling: data.tooling ?? false,
            interview_optimisation: data.interview_optimisation ?? false,
            value_proposition: data.value_proposition ?? false
          });
        } else {
          // No data found, create default record
          console.log('No future features found, creating default record');
          const defaultFeatures = {
            marketing: false,
            agent: false,
            tooling: false,
            interview_optimisation: false,
            value_proposition: false
          };
          setFutureFeatures(defaultFeatures);
          await saveFutureFeatures(defaultFeatures);
        }
      } catch (error) {
        console.error('Error fetching future features:', error);
      }
    };

    fetchFutureFeatures();
  }, [user]);

  // Save future features to Supabase
  const saveFutureFeatures = async (newFeatures: typeof futureFeatures) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const featureData = {
        user_id: user.id,
        marketing: newFeatures.marketing,
        agent: newFeatures.agent,
        tooling: newFeatures.tooling,
        interview_optimisation: newFeatures.interview_optimisation,
        value_proposition: newFeatures.value_proposition
      };

      console.log('Saving future features:', featureData);

      const { error } = await supabase
        .from('future_features')
        .upsert(featureData);

      if (error) {
        console.error('Error saving future features:', error);
      } else {
        console.log('Future features saved successfully');
      }
    } catch (error) {
      console.error('Error saving future features:', error);
    }
  };

  // Optioneel: refresh stats wanneer er een nieuwe job click is
  // Voeg dit toe aan je logJobClick functie:
  const logJobClick = async (job: Job) => {
    if (!user || !user.id) return;
    try {
      await supabase.from("job_clicks").insert([
        {
          user_id: user.id,
          job_id: job.UNIQUE_ID,
          job_title: job.Title,
          company: job.Company,
          location: job.Location,
          rate: job.rate,
          date_posted: job.date,
          summary: job.Summary,
          url: job.URL,
        },
      ]);
      console.log("Job click logged:", job.Title);

      // Refresh stats na nieuwe click
      fetchJobClicksStats();

    } catch (err) {
      console.error("Log job click failed:", err);
    }
  };

  console.log(logJobClick, "logJobClick");

  // Add profile check
  const { needsProfile, loading: profileLoading } = useProfileCheck(user);

  // useEffect(() => {
  //   const fetchProfile = async () => {
  //     const {
  //       data: { user },
  //     } = await supabase.auth.getUser();

  //     if (!user) return;

  //     const { data, error } = await supabase
  //       .from('profiles')
  //       .select('*')
  //       .eq('id', user.id)
  //       .single();

  //     if (error) {
  //       console.error('Fout bij ophalen profiel:', error);
  //     } else {
  //       const fetchedProfile: Profile = {
  //         firstName: data.first_name || '',
  //         lastName: data.last_name || '',
  //         // linkedIn: data.linkedin_URL || '',
  //         industry: data.industry || '',
  //         location: data.location || '',
  //         job_title: data.job_title || '',
  //         linkedin_URL: data.linkedin_URL || ''
  //       };
  //       // setProfile(fetchedProfile);
  //       // setEditedProfile(fetchedProfile);
  //     }
  //   };

  //   fetchProfile();
  // }, []);

  // const saveProfile = async () => {
  //   if (!editedProfile) return;

  //   const {
  //     data: { user },
  //   } = await supabase.auth.getUser();
  //   if (!user) return;

  //   const updates = {
  //     first_name: editedProfile.firstName,
  //     last_name: editedProfile.lastName,
  //     linkedin_URL: editedProfile.linkedIn,
  //     industry: editedProfile.industry,
  //     location: editedProfile.location,
  //     job_title: editedProfile.location,
  //     updated_at: new Date().toISOString(),
  //   };

  //   const { error } = await supabase
  //     .from('profiles')
  //     .update(updates)
  //     .eq('id', user.id);

  //   if (error) {
  //     console.error('Fout bij opslaan profiel:', error);
  //   } else {
  //     // setProfile(editedProfile);
  //     // setEditMode(false);
  //   }
  // };

  // const cancelEdit = () => {
  //   setEditedProfile(profile);
  //   setEditMode(false);
  // };

  // const fetchRecommendedJobs = async (keywords: string[]) => {
  //   const limitPerKeyword = 5;
  //   const jobsPerKeyword: { [keyword: string]: Job[] } = {};

  //   for (const keyword of keywords) {
  //     const { data, error } = await supabase
  //       .from("Allgigs_All_vacancies_NEW")
  //       .select("*")
  //       .ilike("Title", `%${keyword}%`)
  //       .order("date", { ascending: false })
  //       .limit(limitPerKeyword);

  //     console.log(`Result for "${keyword}":`, data);


  //     if (error) {
  //       console.error(`Error fetching jobs for keyword "${keyword}":`, error);
  //       jobsPerKeyword[keyword] = [];
  //     } else {
  //       jobsPerKeyword[keyword] = data || [];
  //     }
  //   }

  //   const merged: Job[] = [];
  //   let index = 0;
  //   while (merged.length < 5) {
  //     let added = false;
  //     for (const keyword of keywords) {
  //       const job = jobsPerKeyword[keyword]?.[index];
  //       if (job) {
  //         merged.push(job);
  //         added = true;
  //         if (merged.length === 5) break;
  //       }
  //     }
  //     if (!added) break;
  //     index++;
  //   }

  //   // setRecommendedJobs(merged);
  // };


  // useEffect(() => {
  //   console.log("Keywords used:", keywords);
  //   if (keywords.length > 0) {
  //     fetchRecommendedJobs(keywords);
  //   } else {
  //     setRecommendedJobs([]);
  //   }
  // }, [keywords]);



  useEffect(() => {
    // Check auth state on mount
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    // Listen for login/logout
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setUser(user);
      setLoading(false);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    if (user && user.id) {
      console.log("[Effect] Fetching recently clicked jobs...");
      fetchRecentlyClickedJobs();
    }
  }, [user]);

  const fetchRecentlyClickedJobs = async () => {
    if (!user || !user.id) return;

    setLoadingRecentlyClicked(true);
    try {
      const { data: clicks } = await supabase
        .from("job_clicks")
        .select("job_id, clicked_at")
        .eq("user_id", user.id)
        .order("clicked_at", { ascending: false });

      const jobIds = clicks?.map(c => c.job_id).filter(Boolean);
      const uniqueJobIds = [...new Set(jobIds)];

      if (!uniqueJobIds.length) return setRecentlyClickedJobs([]);

      const { data: jobsData } = await supabase
        .from("Allgigs_All_vacancies_NEW")
        .select("UNIQUE_ID, Title, Company, URL, date, Location, Summary, rate")
        .in("UNIQUE_ID", uniqueJobIds);

      const finalJobs =
        jobsData?.map(job => ({
          ...job,
          clicked_at: clicks?.find(c => c.job_id === job.UNIQUE_ID)?.clicked_at,
        })) ?? [];

      setRecentlyClickedJobs(finalJobs);
    } catch (e) {
      console.error("fetchRecentlyClickedJobs error", e);
      setRecentlyClickedJobs([]);
    } finally {
      setLoadingRecentlyClicked(false);
      setLoading(false);
    }
  };


  // const [documents, setDocuments] = useState<Document[]>([
  //   { id: "1", name: "Resume.pdf", type: "PDF", size: "2.3 MB", uploadedAt: "2025-06-20" },
  //   { id: "2", name: "Motivation.docx", type: "DOCX", size: "1.1 MB", uploadedAt: "2025-06-18" },
  //   { id: "3", name: "Portfolio.pdf", type: "PDF", size: "4.7 MB", uploadedAt: "2025-06-15" },
  // ]);

  const [showAddJobForm, setShowAddJobForm] = useState(false);
  console.log(showAddJobForm, setShowAddJobForm, "showAddJobForm - build fix");

  // Future features state
  const [futureFeatures, setFutureFeatures] = useState({
    marketing: false,
    agent: false,
    tooling: false,
    interview_optimisation: false,
    value_proposition: false
  });

  // Feature modal state
  const [showFeatureModal, setShowFeatureModal] = useState<null | string>(null);
  const [notifyMe, setNotifyMe] = useState<{ [key: string]: boolean }>({});
  console.log(notifyMe, setNotifyMe, "notifyMe - build fix");
  console.log(showFeatureModal, setShowFeatureModal, "showFeatureModal - build fix");

  // const toggleAvailable = () => setIsAvailable(prev => !prev);

  // const handleKeywordAdd = () => {
  //   if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
  //     setKeywords([...keywords, newKeyword.trim()]);
  //     setNewKeyword('');
  //   }
  // };

  // const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
  //   if (e.key === 'Enter') {
  //     handleKeywordAdd();
  //   }
  // };

  // const removeKeyword = (index: number) => {
  //   setKeywords(keywords.filter((_, i) => i !== index));
  // };



  // const removeDocument = (id: string) => {
  //   setDocuments(documents.filter(doc => doc.id !== id));
  // };

  useEffect(() => {
    if (showRecentlyClicked && recentlyClickedJobs.length === 0) {
      fetchRecentlyClickedJobs();
    }
  }, [showRecentlyClicked]);




  useEffect(() => {
    const fetchIfNeeded = async () => {
      const userResult = await supabase.auth.getUser();
      const user = userResult.data.user;
      if (user && user.id && showRecentlyClicked) {
        fetchRecentlyClickedJobs();
      }
    };
    fetchIfNeeded();
  }, [showRecentlyClicked]);



  const [qualifiedLeads, setQualifiedLeads] = useState<Lead[]>([]);
  // Removed showPipeline state - always show pipeline now

  // Map recentlyClickedJobs to Lead objects with status and CRM fields
  useEffect(() => {
    setQualifiedLeads(
      recentlyClickedJobs
        .filter((job: any) => typeof job.UNIQUE_ID === 'string')
        .map((job: any) => ({
          ...job,
          UNIQUE_ID: job.UNIQUE_ID as string,
          Title: job.Title || '',
          Company: job.Company || '',
          Location: job.Location || '',
          rate: job.rate || '',
          date: job.date || '',
          Summary: job.Summary || '',
          URL: job.URL || '',
          clicked_at: job.clicked_at || '',
          status: job.status as LeadStatus || LeadStatus.NEW,
          // Add default CRM values
          potential_value: job.potential_value || Math.floor(Math.random() * 20000) + 5000, // Random value between 5K-25K
          quality_score: job.quality_score || Math.floor(Math.random() * 40) + 60, // Random score between 60-100
          days_since_action: job.days_since_action || 0,
          notes: job.notes || '',
          applied_at: job.applied_at || null,
          follow_up_date: job.follow_up_date || null,
          last_contact: job.last_contact || null,
          next_action_due: job.next_action_due || null
        }))
    );
  }, [recentlyClickedJobs]);
  console.log(qualifiedLeads, "qualifiedLeads - build fix");
  // Update status in Supabase and local state
  const handleLeadStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    if (!user || !user.id) return;
    try {
      // Update status in Supabase job_clicks for this user/job
      await supabase
        .from('job_clicks')
        .update({ status: newStatus })
        .eq('user_id', user.id)
        .eq('job_id', leadId);

      // Update local state for immediate UI feedback
      setQualifiedLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead.UNIQUE_ID === leadId ? { ...lead, status: newStatus } : lead
        )
      );
    } catch (error) {
      console.error('Failed to update lead status:', error);
    }
  };

  const handleLeadLogClick = (lead: Lead) => {
    // hier jouw logica bij click
    console.log('Lead aangeklikt:', lead);
  };
  console.log(handleLeadStatusChange, "handleLeadStatusChange - build fix");
  console.log(handleLeadLogClick, "handleLeadLogClick - build fix");
  // Authentication checks - exactly like leadSearch.tsx
  if (!user) {
    return (
      <div>
        <LoginForm />
      </div>
    );
  }

  if (profileLoading || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `
          radial-gradient(ellipse at top left, rgba(139, 69, 189, 0.15) 0%, transparent 50%), 
          radial-gradient(ellipse at bottom right, rgba(59, 130, 246, 0.15) 0%, transparent 50%), 
          linear-gradient(135deg, #1a0b2e 0%, #16213e 25%, #0f3460 50%, #16213e 75%, #1a0b2e 100%)
        `,
        fontFamily: "'Montserrat', Arial, sans-serif",
        color: '#fff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          textAlign: 'center',
          paddingTop: '20vh'
        }}>
          {/* Loading indicator can be added here if needed */}
        </div>
      </div>
    );
  }

  if (needsProfile) {
    return <CompleteProfileForm onComplete={() => window.location.reload()} />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(ellipse at top left, rgba(139, 69, 189, 0.15) 0%, transparent 50%), 
        radial-gradient(ellipse at bottom right, rgba(59, 130, 246, 0.15) 0%, transparent 50%), 
        linear-gradient(135deg, #1a0b2e 0%, #16213e 25%, #0f3460 50%, #16213e 75%, #1a0b2e 100%)
      `,
      fontFamily: "'Montserrat', Arial, sans-serif",
      color: '#fff',
      position: 'relative',
      overflow: 'hidden'
    }}
      onClick={() => setShowFeatureModal(null)}
    >
      <GlobalNav currentPage="dashboard" />
      {/* Floating Orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '15%',
        width: '300px',
        height: '300px',
        background: `radial-gradient(circle, 
          rgba(147, 51, 234, 0.1) 0%, 
          rgba(147, 51, 234, 0.05) 40%, 
          transparent 70%
        )`,
        borderRadius: '50%',
        filter: 'blur(40px)',
        animation: 'float1 6s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '10%',
        width: '200px',
        height: '200px',
        background: `radial-gradient(circle, 
          rgba(59, 130, 246, 0.08) 0%, 
          rgba(59, 130, 246, 0.04) 40%, 
          transparent 70%
        )`,
        borderRadius: '50%',
        filter: 'blur(30px)',
        animation: 'float2 8s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        position: 'absolute',
        top: '60%',
        right: '40%',
        width: '120px',
        height: '120px',
        background: `radial-gradient(circle, 
          rgba(236, 72, 153, 0.06) 0%, 
          transparent 60%
        )`,
        borderRadius: '50%',
        filter: 'blur(20px)',
        animation: 'float3 10s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Main dashboard content */}
      <div style={{ filter: 'none', transition: 'filter 0.2s' }}>
        {/* Removed toggle button - always show pipeline now */}

        <div style={{ padding: '2rem', position: 'relative', zIndex: 5 }}>
          {/* Replace old pipeline with new kanban board */}
          <LeadsPipeline user={user} statsData={statsData} />
        </div>


        {/* Main Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>

          {/* Keywords Card - COMMENTED OUT (moved to Recommended Leads section) */}
          {/*
          <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '24px',
              padding: '1.5rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <SearchCheck style={{ width: '20px', height: '20px' }} />
                Quicksearch
              </h2>
              <button
                onClick={() => setEditKeywords(!editKeywords)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                borderRadius: '12px',
                  border: 'none',
                  fontWeight: '600',
                cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }}
              >
                <Edit2 style={{ width: '16px', height: '16px' }} />
                {editKeywords ? 'Done' : 'Edit'}
              </button>
            </div>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)', margin: '0.5rem 0 0.5rem 0' }}>
              Click to quicksearch jobs
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              {keywords.map((keyword, index) => (
                <span
                  key={index}
                  onClick={() => !editKeywords && searchJobs(keyword)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '999px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                        background: editKeywords ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: '#fff',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                    cursor: editKeywords ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                        backdropFilter: 'blur(8px)'
                  }}
                  onMouseEnter={(e) => {
                    if (!editKeywords) {
                          e.currentTarget.style.background = 'rgba(245, 158, 11, 0.4)';
                          e.currentTarget.style.color = '#fff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!editKeywords) {
                          e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)';
                          e.currentTarget.style.color = '#fff';
                    }
                  }}
                >
                  {keyword}
                  {editKeywords && (
                    <button
                      onClick={() => removeKeyword(index)}
                      style={{
                        marginLeft: '0.25rem',
                        background: 'none',
                        border: 'none',
                          color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <X style={{ width: '12px', height: '12px' }} />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {editKeywords && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                  placeholder="Nieuwe zoekterm..."
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
                <button
                  onClick={handleKeywordAdd}
                  style={{
                    padding: '0.75rem',
                        background: 'rgba(245, 158, 11, 0.2)',
                        color: '#fff',
                        borderRadius: '12px',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        cursor: 'pointer',
                        backdropFilter: 'blur(8px)',
                        transition: 'all 0.3s ease'
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            )}
          </div>
              */}

          {/* Stats Card - REMOVED (moved to Qualified Leads section) */}

          {/* Post a Job Card - COMMENTED OUT */}
          {/*
          <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '24px',
            padding: '2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
                background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
                <Plus style={{ width: '24px', height: '24px', color: '#fff' }} />
            </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', marginBottom: '0.5rem' }}>Post a Job</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Add an interesting job that you found
            </p>
            <button
              onClick={() => setShowAddJobForm(true)}
              style={{
                padding: '0.75rem 1.5rem',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  borderRadius: '12px',
                border: 'none',
                fontWeight: '600',
                fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
              }}
            >
              Submit new job
            </button>
          </div>
            */}

        </div>

        {/* Profile Dashboard */}

      </div>

      {showAddJobForm && user && (
        <AddJobForm
          onClose={() => setShowAddJobForm(false)}
          onJobAdded={() => {
            // Optioneel: herlaad jobs
            console.log("Job toegevoegd");
          }}
          user={user}
        />
      )}

      {/* Global styles for placeholders */}
      <style jsx global>{`
        input::placeholder,
        textarea::placeholder {
          color: rgba(255, 255, 255, 0.7) !important;
          font-style: italic;
          font-weight: 400;
        }
        
        input:focus::placeholder,
        textarea:focus::placeholder {
          color: rgba(255, 255, 255, 0.8) !important;
        }
      `}</style>
    </div>
  )
}