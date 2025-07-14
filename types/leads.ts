// ==========================================
// LEADS KANBAN BOARD - TypeScript Interfaces
// ==========================================

export type LeadStage = 'found' | 'connect' | 'close';

export type ActivityType =
    | 'note'
    | 'file_upload'
    | 'call'
    | 'email'
    | 'interview_scheduled'
    | 'application_sent'
    | 'follow_up_sent'
    | 'stage_moved'
    | 'applied'
    | 'interview_prep'
    | 'interview_completed'
    | 'job_secured'
    | 'job_declined';

// ==========================================
// MAIN LEAD INTERFACE
// ==========================================
export interface Lead {
    id: string;
    user_id: string;

    // Job Information
    job_unique_id: string;
    job_title: string;
    company: string;
    location?: string;
    rate?: string;
    job_url?: string;
    job_summary?: string;

    // Pipeline Status
    stage: LeadStage;
    is_archived: boolean;

    // Timestamps
    created_at: string;
    updated_at: string;
    stage_updated_at: string;

    // General Notes
    notes?: string;

    // Stage-specific data
    found_data: FoundData;
    connect_data: ConnectData;
    close_data: CloseData;

    // Follow-up tracking
    follow_up_date?: string;
    follow_up_completed: boolean;

    // Related data (populated via joins)
    contacts?: LeadContact[];
    activities?: LeadActivity[];
}

// ==========================================
// STAGE-SPECIFIC DATA INTERFACES
// ==========================================

export interface FoundData {
    match_percentage?: number;
    possible_earnings?: number;
    above_normal_rate?: boolean;
    normal_rate?: number;
    applied?: boolean;
    follow_up_days?: number;
    follow_up_timer_started?: string; // ISO date string
    follow_up_overdue?: boolean;
    priority?: 'low' | 'medium' | 'high';
    source?: string;
    initial_notes?: string;
}

export interface ConnectData {
    interview_date?: string;
    interview_time?: string;
    interview_with?: string;
    interview_notes?: string;
    interview_rating?: 'thumbs_up' | 'thumbs_down' | null;
    prepped?: boolean;
    prep_data?: InterviewPrepData;
}

export interface InterviewPrepData {
    introduction?: string;
    company_fit?: string;
    role_description?: string;
    colleagues?: Colleague[];
    company_mission?: string;
    completed?: boolean;
}

export interface Colleague {
    id: string;
    name: string;
    email?: string;
    linkedin?: string;
    role?: string;
}

export interface CloseData {
    got_job?: boolean;
    possible_revenue?: number;
    negotiation_tips?: string[];
    contract_template?: string;
    archived_reason?: string;
}

// ==========================================
// LEGACY INTERFACES (for backward compatibility)
// ==========================================

export interface NewLeadData {
    follow_up_days?: number;
    priority?: 'low' | 'medium' | 'high';
    source?: string;
    initial_notes?: string;
}

export interface AppliedData {
    application_text?: string;
    cv_text?: string;
    cover_letter?: string;
    application_date?: string;
    files_sent?: string[];
    application_method?: 'email' | 'website' | 'linkedin' | 'other';
    follow_up_sent?: boolean;
    follow_up_text?: string;
}

export interface Conversation {
    id?: string;
    date: string;
    contact_id?: string;
    notes: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    next_steps?: string;
    duration_minutes?: number;
}

export interface SpokenData {
    conversations: Conversation[];
    total_calls?: number;
    last_contact_date?: string;
}

export interface Interview {
    id?: string;
    date: string;
    time: string;
    location: string;
    contact_id?: string;
    type?: 'phone' | 'video' | 'in_person' | 'technical' | 'cultural';
    summary?: string;
    rating?: number; // 0-10
    calendar_event_id?: string;
    preparation_notes?: string;
    outcome?: string;
}

export interface InterviewData {
    interviews: Interview[];
    total_interviews?: number;
    average_rating?: number;
}

export interface DeniedData {
    reason?: string;
    feedback?: string;
    date: string;
    lessons_learned?: string;
    reapply_date?: string;
    contact_maintained?: boolean;
}

export interface SuccessData {
    offer_amount?: number;
    start_date?: string;
    contract_type?: 'permanent' | 'contract' | 'freelance' | 'internship';
    celebration_notes?: string;
    referral_opportunity?: boolean;
    portfolio_case_study?: string;
}

// ==========================================
// CONTACT INTERFACE
// ==========================================
export interface LeadContact {
    id: string;
    lead_id: string;
    name: string;
    email?: string;
    phone?: string;
    role?: string; // recruiter, team member, manager, etc.
    stage: LeadStage;
    created_at: string;
    updated_at: string;
}

// ==========================================
// ACTIVITY INTERFACE
// ==========================================
export interface LeadActivity {
    id: string;
    lead_id: string;
    stage: LeadStage;
    activity_type: ActivityType;
    content?: string;
    created_at: string;
    created_by?: string;
}

// ==========================================
// UI/UX INTERFACES
// ==========================================

export interface KanbanColumn {
    id: LeadStage;
    title: string;
    leads: Lead[];
    color: string;
    icon: string;
}

export interface DragItem {
    id: string;
    type: 'lead';
    lead: Lead;
    sourceColumn: LeadStage;
}

export interface DropResult {
    leadId: string;
    sourceStage: LeadStage;
    targetStage: LeadStage;
    targetIndex?: number;
}

// ==========================================
// FORM INTERFACES
// ==========================================

export interface NewLeadForm {
    follow_up_days: number;
    priority: 'low' | 'medium' | 'high';
    initial_notes: string;
}

export interface AppliedForm {
    application_text: string;
    cv_text: string;
    cover_letter: string;
    application_date: string;
    application_method: 'email' | 'website' | 'linkedin' | 'other';
}

export interface SpokenForm {
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    contact_role: string;
    conversation_notes: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    next_steps: string;
}

export interface InterviewForm {
    date: string;
    time: string;
    location: string;
    contact_id: string;
    type: 'phone' | 'video' | 'in_person' | 'technical' | 'cultural';
    preparation_notes: string;
}

export interface InterviewSummaryForm {
    summary: string;
    rating: number;
    outcome: string;
}

export interface DeniedForm {
    reason: string;
    feedback: string;
    lessons_learned: string;
    reapply_date: string;
    contact_maintained: boolean;
}

export interface SuccessForm {
    offer_amount: number;
    start_date: string;
    contract_type: 'permanent' | 'contract' | 'freelance' | 'internship';
    celebration_notes: string;
}

// ==========================================
// API RESPONSE INTERFACES
// ==========================================

export interface LeadsResponse {
    leads: Lead[];
    total: number;
    archived_count: number;
}

export interface LeadResponse {
    lead: Lead;
    success: boolean;
    message?: string;
}

export interface ArchiveResponse {
    archived_leads: Lead[];
    total: number;
}

// ==========================================
// FILTER & SEARCH INTERFACES
// ==========================================

export interface LeadFilters {
    stage?: LeadStage[];
    priority?: ('low' | 'medium' | 'high')[];
    date_range?: {
        start: string;
        end: string;
    };
    search_term?: string;
    needs_follow_up?: boolean;
}

// ==========================================
// NOTIFICATION INTERFACES
// ==========================================

export interface FollowUpNotification {
    lead_id: string;
    lead_title: string;
    company: string;
    days_overdue: number;
    follow_up_date: string;
}

// ==========================================
// CALENDAR INTEGRATION INTERFACES
// ==========================================

export interface CalendarEvent {
    title: string;
    description: string;
    start_date: string;
    start_time: string;
    end_time: string;
    location: string;
    attendees?: string[];
}

export interface CalendarProvider {
    name: 'google' | 'apple' | 'outlook' | 'ical';
    url: string;
}

// ==========================================
// ANALYTICS INTERFACES
// ==========================================

export interface LeadAnalytics {
    total_leads: number;
    leads_by_stage: Record<LeadStage, number>;
    conversion_rates: Record<string, number>;
    average_time_per_stage: Record<LeadStage, number>;
    success_rate: number;
    total_potential_value: number;
    follow_ups_needed: number;
}

// ==========================================
// EXPORT ALL TYPES
// ==========================================

export type {
    Lead,
    LeadContact,
    LeadActivity,
    KanbanColumn,
    DragItem,
    DropResult,
    NewLeadForm,
    AppliedForm,
    SpokenForm,
    InterviewForm,
    InterviewSummaryForm,
    DeniedForm,
    SuccessForm,
    LeadsResponse,
    LeadResponse,
    ArchiveResponse,
    LeadFilters,
    FollowUpNotification,
    CalendarEvent,
    CalendarProvider,
    LeadAnalytics
}; 