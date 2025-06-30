import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, Plus, Trash2, Upload, Sparkles, SearchCheck, MousePointerClick, Users, TrendingUp, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// import RecentlyClickedJobs from '../components/ui/RecentlyClickedJobs';
import { supabase } from '../SupabaseClient';
import { useRouter } from 'next/router';
import AddJobForm from '../components/ui/add-job-form';

// Qualified Leads Interfaces en Types
import {
  Clock, CheckCircle, Phone, Video, XCircle, Trophy, Lock, Target,
  // AlertCircle,
  // ChevronRight,
  Zap,
  // Brain,
  Mail
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
const MOCK_LEADS: Lead[] = [
  {
    UNIQUE_ID: '1',
    Title: 'Senior Frontend Developer',
    Company: 'TechCorp Amsterdam',
    Location: 'Amsterdam, NL',
    rate: '€75/hour',
    date: '2025-06-28',
    Summary: 'React, TypeScript, 5+ years experience',
    URL: 'https://example.com/job1',
    status: LeadStatus.APPLIED,
    applied_at: '2025-06-29T10:00:00Z',
    follow_up_date: '2025-07-02T10:00:00Z',
    potential_value: 15000,
    quality_score: 85,
    days_since_action: 1,
    notes: 'Interesting company, good culture fit'
  },
  {
    UNIQUE_ID: '2',
    Title: 'React Developer',
    Company: 'StartupHub',
    Location: 'Rotterdam, NL',
    rate: '€65/hour',
    date: '2025-06-27',
    Summary: 'React, Node.js, startup environment',
    URL: 'https://example.com/job2',
    status: LeadStatus.FOLLOW_UP,
    applied_at: '2025-06-26T14:00:00Z',
    follow_up_date: '2025-06-30T14:00:00Z',
    potential_value: 12000,
    quality_score: 78,
    days_since_action: 3,
    notes: 'Quick response needed, competitive role'
  },
  {
    UNIQUE_ID: '3',
    Title: 'Full Stack Engineer',
    Company: 'InnovateLabs',
    Location: 'Utrecht, NL',
    rate: '€80/hour',
    date: '2025-06-25',
    Summary: 'React, Node.js, PostgreSQL, 3+ years',
    URL: 'https://example.com/job3',
    status: LeadStatus.INTERVIEWED,
    applied_at: '2025-06-20T09:00:00Z',
    follow_up_date: '2025-06-25T16:00:00Z',
    potential_value: 18000,
    quality_score: 92,
    days_since_action: 5,
    notes: 'Great interview, waiting for final decision'
  }
];

// Sales KPI Mock Data
const MOCK_SALES_KPI: SalesKPIs = {
  total_leads: 24,
  conversion_rate: 12.5, // percentage
  potential_revenue: 45000,
  lead_quality_score: 82,
  cost_per_application: 25,
  pipeline_health: 78,
  active_applications: 8,
  interviews_scheduled: 3,
  average_response_time: 4.2
};

interface QualifiedLeadsSectionProps {
  leads: Lead[];
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
  onLogClick: (lead: Lead) => void;
}

// mock qualifiedLeads met mockdata
const QualifiedLeadsSection: React.FC<QualifiedLeadsSectionProps> = ({
  leads = MOCK_LEADS,
  onStatusChange,
  onLogClick
}) => {
  const [salesKPIs] = useState<SalesKPIs>(MOCK_SALES_KPI);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  // Popup state for locked features
  const [showFeatureModal, setShowFeatureModal] = useState<null | string>(null);
  const [notifyMe, setNotifyMe] = useState<{ [key: string]: boolean }>({});

  // Timer functie voor dagen sinds actie
  const calculateDaysSinceAction = (lead: Lead): number => {
    if (!lead.applied_at && !lead.follow_up_date) return 0;

    const lastActionDate = new Date(lead.follow_up_date || lead.applied_at || Date.now());
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastActionDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Status change handler met automatische timer
  const handleStatusChange = (leadId: string, newStatus: LeadStatus) => {
    onStatusChange(leadId, newStatus);

    // Auto-start timer voor follow-up
    if (newStatus === LeadStatus.APPLIED) {
      // Hier zou je de follow_up_date kunnen instellen
      console.log(`Timer started for lead ${leadId} - follow up in 3 days`);
    }
  };

  // Urgency indicator
  const getUrgencyColor = (daysSince: number, status: LeadStatus): string => {
    if (status === LeadStatus.DENIED || status === LeadStatus.SUCCEEDED) return '#6b7280';
    if (daysSince > 7) return '#ef4444';
    if (daysSince > 3) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '24px',
      padding: '2rem',
      marginBottom: '2rem',
      color: 'white',
      position: 'relative',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease'
    }}>

      {/* Feature Modal Popup */}
      {showFeatureModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.35)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            color: '#222',
            borderRadius: '24px',
            padding: '2rem',
            minWidth: '320px',
            boxShadow: '0 4px 32px rgba(0,0,0,0.15)',
            position: 'relative',
            textAlign: 'center',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.25)',
          }}>
            <button
              onClick={() => setShowFeatureModal(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: '#888',
                fontSize: '1.25rem',
                cursor: 'pointer',
              }}
              aria-label="Close"
            >
              <X style={{ width: '20px', height: '20px' }} />
            </button>
            <h2 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: '1rem', color: '#fff' }}>{showFeatureModal}</h2>
            <p style={{ marginBottom: '1rem', color: '#fff', fontSize: '1rem' }}>
              {showFeatureModal === 'AI Agent' && (
                <>This AI agent will search for jobs, apply with your profile, contact the lead, make calendar appointments with recruiters, and more.</>
              )}
              {showFeatureModal === 'Tooling' && (
                <>Get access to tools that help you get better results and streamline your job search process.</>
              )}
              {showFeatureModal === 'Marketing' && (
                <>Access checklists, extra information, and tips for higher success rates in your applications.</>
              )}
            </p>
            <p style={{ marginBottom: '1.5rem', color: '#fff' }}>Interested?</p>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontWeight: 600, fontSize: '1rem', color: '#fff' }}>
              <span>Notify me when it's done</span>
              <input
                type="checkbox"
                checked={!!notifyMe[showFeatureModal]}
                onChange={() => setNotifyMe((prev) => ({ ...prev, [showFeatureModal]: !prev[showFeatureModal] }))}
                style={{ width: '20px', height: '20px' }}
              />
            </label>
          </div>
        </div>
      )}

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

          {/* CRM Features (Locked) */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {[
              { icon: Mail, label: 'Marketing' },
              { icon: Zap, label: 'Tooling' },
              { icon: Sparkles, label: 'AI Agent' }
            ].map((feature, index) => (
              <button
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  opacity: 1
                }}
                onClick={() => setShowFeatureModal(feature.label)}
              >
                <feature.icon style={{ width: '16px', height: '16px' }} />
                {feature.label}
                <Lock style={{ width: '14px', height: '14px' }} />
              </button>
            ))}
          </div>
        </div>

        {/* Sales KPIs Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {[
            { label: 'Total Leads', value: salesKPIs.total_leads, suffix: '' },
            { label: 'Conversion Rate', value: salesKPIs.conversion_rate, suffix: '%' },
            { label: 'Potential Revenue', value: `€${(salesKPIs.potential_revenue / 1000).toFixed(0)}K`, suffix: '' },
            { label: 'Pipeline Health', value: salesKPIs.pipeline_health, suffix: '%' },
            { label: 'Active Apps', value: salesKPIs.active_applications, suffix: '' },
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

        {/* Leads Table */}
        <div style={{
          background: 'transparent',
          backdropFilter: 'blur(16px)',
          borderRadius: '20px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(8px)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#fff',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <TrendingUp style={{ width: '20px', height: '20px' }} />
              Lead Pipeline
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'transparent' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#fff', fontWeight: '600' }}>Lead</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#fff', fontWeight: '600' }}>Status</th>
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
                                  transition: 'all 0.2s',
                                  opacity: isActive ? 1 : 0.7,
                                  backdropFilter: 'blur(8px)'
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
      </div>
    </div>
  );
};


interface Profile {
  firstName: string;
  lastName: string;
  job_title: string;
  location: string;
  linkedIn?: string;
  industry: string;
  linkedin_URL: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
}

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
  const [isAvailable, setIsAvailable] = useState(true);
  const [editKeywords, setEditKeywords] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [keywords, setKeywords] = useState(["Frontend", "Backend", "React", "Node.js", "TypeScript"]);
  // const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [recentlyClickedJobs, setRecentlyClickedJobs] = useState<Job[]>([]);
  const [showRecentlyClicked] = useState(false);
  const [loadingRecentlyClicked, setLoadingRecentlyClicked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const searchJobs = (keyword: string) => {
    router.push(`/?search=${encodeURIComponent(keyword)}`);
  };
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const emptyProfile: Profile = {
    firstName: '',
    lastName: '',
    job_title: '',
    location: '',
    linkedIn: '',
    industry: '',
    linkedin_URL: '',

  };
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [editedProfile, setEditedProfile] = useState<Profile>(emptyProfile);
  const [editMode, setEditMode] = useState(false);

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




  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };















  // Voeg deze useEffect toe aan je component:
  useEffect(() => {
    if (user && user.id) {
      fetchJobClicksStats();
    }
  }, [user]);

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


  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Fout bij ophalen profiel:', error);
      } else {
        const fetchedProfile: Profile = {
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          // linkedIn: data.linkedin_URL || '',
          industry: data.industry || '',
          location: data.location || '',
          job_title: data.job_title || '',
          linkedin_URL: data.linkedin_URL || ''
        };
        setProfile(fetchedProfile);
        setEditedProfile(fetchedProfile);
      }
    };

    fetchProfile();
  }, []);

  const saveProfile = async () => {
    if (!editedProfile) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const updates = {
      first_name: editedProfile.firstName,
      last_name: editedProfile.lastName,
      linkedin_URL: editedProfile.linkedIn,
      industry: editedProfile.industry,
      location: editedProfile.location,
      job_title: editedProfile.location,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      console.error('Fout bij opslaan profiel:', error);
    } else {
      setProfile(editedProfile);
      setEditMode(false);
    }
  };

  const cancelEdit = () => {
    setEditedProfile(profile);
    setEditMode(false);
  };

  const fetchRecommendedJobs = async (keywords: string[]) => {
    const limitPerKeyword = 5;
    const jobsPerKeyword: { [keyword: string]: Job[] } = {};

    for (const keyword of keywords) {
      const { data, error } = await supabase
        .from("Allgigs_All_vacancies_NEW")
        .select("*")
        .ilike("Title", `%${keyword}%`)
        .order("date", { ascending: false })
        .limit(limitPerKeyword);

      console.log(`Result for "${keyword}":`, data);


      if (error) {
        console.error(`Error fetching jobs for keyword "${keyword}":`, error);
        jobsPerKeyword[keyword] = [];
      } else {
        jobsPerKeyword[keyword] = data || [];
      }
    }

    const merged: Job[] = [];
    let index = 0;
    while (merged.length < 5) {
      let added = false;
      for (const keyword of keywords) {
        const job = jobsPerKeyword[keyword]?.[index];
        if (job) {
          merged.push(job);
          added = true;
          if (merged.length === 5) break;
        }
      }
      if (!added) break;
      index++;
    }

    setRecommendedJobs(merged);
  };


  useEffect(() => {
    console.log("Keywords used:", keywords);
    if (keywords.length > 0) {
      fetchRecommendedJobs(keywords);
    } else {
      setRecommendedJobs([]);
    }
  }, [keywords]);



  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        console.log("[User] OK:", data.user);
        setUser(data.user);
      } else {
        console.error("[User] error:", error);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
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
    }
  };


  const [documents, setDocuments] = useState<Document[]>([
    { id: "1", name: "Resume.pdf", type: "PDF", size: "2.3 MB", uploadedAt: "2025-06-20" },
    { id: "2", name: "Motivation.docx", type: "DOCX", size: "1.1 MB", uploadedAt: "2025-06-18" },
    { id: "3", name: "Portfolio.pdf", type: "PDF", size: "4.7 MB", uploadedAt: "2025-06-15" },
  ]);

  const [showAddJobForm, setShowAddJobForm] = useState(false);


  const toggleAvailable = () => setIsAvailable(prev => !prev);

  const handleKeywordAdd = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleKeywordAdd();
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };



  const removeDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

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

  // Map recentlyClickedJobs to Lead objects with status
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
        }))
    );
  }, [recentlyClickedJobs]);

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

      {/* Header */}
      <header style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '1.5rem 2rem',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '1100px', margin: '0 auto' }}>

          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: 'white',
            display: 'flex',
            alignItems: 'center'
          }}>
            <img
              src="/images/allGigs-logo-white.svg"
              alt="AllGigs Logo"
              style={{ height: "40px", transition: "opacity 0.3s" }}
            />
            Dashboard
          </h1>
          <button
            onClick={handleLogout}
            style={{
              width: 'fit-content',
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              marginLeft: 'auto',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.1)'
            }}
          >
            Log out
          </button>

        </div>

      </header>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem', position: 'relative', zIndex: 5 }}>


        {/* Link to allGigs */}
        {/* <div style={{
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid #e5e7eb',
          padding: '1.5rem',
          marginBottom: '2rem'

        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#000',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Search style={{ width: '20px', height: '20px' }} />
            Search entire database for all Jobs
          </h2>



          <button style={{
            width: '100%',
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#0ccf83',
            color: '#000',
            border: 'none',
            borderRadius: '999px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
            onClick={() => window.location.href = '/'}
          >
            allGigs
          </button>
        </div> */}

        <QualifiedLeadsSection
          leads={qualifiedLeads}
          onStatusChange={handleLeadStatusChange}
          onLogClick={handleLeadLogClick}
        />



        {/* Availability Toggle */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '24px',
            padding: '1rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={toggleAvailable}
                  style={{ display: 'none' }}
                />
                <div style={{
                  width: '52px',
                  height: '28px',
                  borderRadius: '14px',
                  background: isAvailable
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(255, 255, 255, 0.15)',
                  border: isAvailable
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    background: isAvailable
                      ? 'rgba(255, 255, 255, 0.95)'
                      : 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '50%',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    transform: isAvailable ? 'translateX(26px)' : 'translateX(2px)',
                    transition: 'all 0.3s ease',
                    marginTop: '2px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(4px)'
                  }} />
                </div>
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff' }}>
                Available to recruiters
              </span>
              <span style={{
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                fontSize: '0.875rem',
                fontWeight: '600',
                background: isAvailable ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                color: isAvailable ? '#10b981' : 'rgba(255, 255, 255, 0.8)',
                border: isAvailable ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)'
              }}>
                {isAvailable ? 'Active' : 'No data is visible for recruiters'}
              </span>
            </label>
          </div>
        </div>
        {/* Recently Clicked Jobs Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '24px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#fff',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <MousePointerClick style={{ width: '20px', height: '20px' }} />
            Manage Jobs
          </h2>

          {loadingRecentlyClicked ? (
            <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>Loading...</p>
          ) : recentlyClickedJobs.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>No recently clicked jobs</p>
          ) : (
            <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
              <table style={{ minWidth: '600px', width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)' }}>Title</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)' }}>Company</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)' }}>Location</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentlyClickedJobs.map((job) => (
                    <tr
                      key={job.UNIQUE_ID}
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', cursor: 'pointer' }}
                      onClick={() => logJobClick(job)}
                    >
                      <td style={{ padding: '0.75rem', fontWeight: 500, color: '#fff' }}>{job.Title}</td>
                      <td style={{ padding: '0.75rem', color: 'rgba(255, 255, 255, 0.8)' }}>{job.Company}</td>
                      <td style={{ padding: '0.75rem', color: 'rgba(255, 255, 255, 0.8)' }}>{job.Location}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>{job.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recommended Jobs */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '24px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#fff',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Sparkles style={{ width: '20px', height: '20px' }} />
            Recommended gigs
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recommendedJobs.map((job) => (
              <div
                key={job.UNIQUE_ID}
                style={{
                  padding: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(8px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <h3 style={{ fontWeight: '600', color: '#fff', margin: '0 0 0.25rem 0', fontSize: '1rem' }}>{job.Title}</h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '0 0 0.25rem 0', fontSize: '0.875rem' }}>{job.Company} • {job.Location}</p>
                {job.rate && (
                  <p style={{ color: '#fff', fontWeight: '600', margin: 0, fontSize: '0.875rem' }}>{job.rate}</p>
                )}
              </div>
            ))}
          </div>

          <button style={{
            width: '100%',
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'rgba(255, 255, 255, 0.2)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.875rem',
            transition: 'all 0.3s ease'
          }}
            onClick={() => window.location.href = '/'}
          >
            Search entire database on allGigs
          </button>
        </div>


        {/* Main Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>



          {/* Keywords Card */}
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
                    background: editKeywords ? '#f3f4f6' : '#f3f4f6',
                    color: '#000',
                    border: '1px solid #e5e7eb',
                    cursor: editKeywords ? 'default' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!editKeywords) {
                      e.currentTarget.style.background = '#0ccf83';
                      e.currentTarget.style.color = '#000';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!editKeywords) {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.color = '#000';
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
                        color: '#666',
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
                    background: '#0ccf83',
                    color: '#000',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            )}
          </div>

          {/* Stats Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '24px',
            padding: '1.5rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <TrendingUp style={{ width: '20px', height: '20px' }} />
              Statistics
            </h2>

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
                    stroke="#fff"
                    strokeWidth={3}
                    dot={{ fill: '#fff', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p style={{
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.8)',
              marginTop: '0.5rem'
            }}>
              Total this week: {statsData.reduce((acc, day) => acc + day.views, 0)} clicked jobs
            </p>
          </div>





          {/* Documents Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '24px',
            padding: '1.5rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText style={{ width: '20px', height: '20px' }} />
              Documents
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              {documents.map((doc) => (
                <div key={doc.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(8px)'
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '600', color: '#fff', margin: '0 0 0.25rem 0', fontSize: '0.875rem' }}>{doc.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>{doc.type} • {doc.size}</p>
                  </div>
                  <button
                    onClick={() => removeDocument(doc.id)}
                    style={{
                      color: '#dc2626',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                  >
                    <Trash2 style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>


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


          {/* Drag & Drop Upload */}
          <div
            style={{
              border: '2px dashed rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              transition: 'border-color 0.3s',
              marginTop: '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)'
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onDrop={(e) => {
              e.preventDefault();
              alert('Bestanden geüpload (mock)');
            }}
          >
            <Upload style={{ width: '32px', height: '32px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)', margin: '0.25rem 0' }}>
              Drag your files or <span style={{ color: '#fff', fontWeight: '600', cursor: 'pointer' }}>browse files</span>
            </p>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>Max 10MB per file</p>
          </div>

        </div>


        {/* Profile Card */}
        {isAvailable && (
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
                <Users style={{ width: '20px', height: '20px' }} />
                Profile
              </h2>
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
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
                  Edit
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={saveProfile}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
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
                    <Save style={{ width: '16px', height: '16px' }} />
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '12px',
                      border: 'none',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <X style={{ width: '16px', height: '16px' }} />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {editMode ? (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.25rem' }}>First name</label>
                    <input
                      type="text"
                      value={editedProfile.firstName}
                      onChange={(e) => setEditedProfile({ ...editedProfile, firstName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        backdropFilter: 'blur(8px)'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.25rem' }}>Last name</label>
                    <input
                      type="text"
                      value={editedProfile.lastName}
                      onChange={(e) => setEditedProfile({ ...editedProfile, lastName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        backdropFilter: 'blur(8px)'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.25rem' }}>Location</label>
                    <input
                      type="location"
                      value={editedProfile.location}
                      onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        backdropFilter: 'blur(8px)'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.25rem' }}>Job title</label>
                    <input
                      type="jobtitle"
                      value={editedProfile.job_title}
                      onChange={(e) => setEditedProfile({ ...editedProfile, job_title: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        backdropFilter: 'blur(8px)'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.25rem' }}>LinkedIn</label>
                    <input
                      type="url"
                      value={editedProfile.linkedIn}
                      onChange={(e) => setEditedProfile({ ...editedProfile, linkedIn: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        backdropFilter: 'blur(8px)'
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>Name</span>
                    <p style={{ fontWeight: '600', margin: '0.25rem 0 0 0', color: '#fff' }}>{profile.firstName} {profile.lastName}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>Location</span>
                    <p style={{ fontWeight: '600', margin: '0.25rem 0 0 0', color: '#fff' }}>{profile.location}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>Job title</span>
                    <p style={{ fontWeight: '600', margin: '0.25rem 0 0 0', color: '#fff' }}>{profile.job_title}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>LinkedIn</span>
                    <a href={profile.linkedIn} style={{ fontWeight: '600', color: '#fff', textDecoration: 'none', display: 'block', marginTop: '0.25rem' }} target="_blank" rel="noopener noreferrer">
                      LinkedIn profile
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

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


      </div>
    </div>
  )
}