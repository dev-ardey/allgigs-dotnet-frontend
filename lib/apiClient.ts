// API Client for backend communication

// Profile interface matching backend response
export interface ProfileResponse {
    id: string;
    firstName: string;
    lastName: string;
    linkedInUrl: string | null;
    industry: string;
    jobTitle: string;
    location: string;
    availableToRecruiters: boolean;
    dateAvailableToRecruiters: string | null;
    rate: string | null;
    age: string | null;
    lastYearsEarnings: number | null;
    gender: string | null;
    testimonials: string | null;
    mainProblem: string | null;
    interests: string | null;
    links: string | null;
    postponedInfo: number | null;
    postponedTime: string | null;
    updatedAt: string;
    quickSearch: string[] | null;
    linkedInFeedEnabled: boolean | null;
}

export interface FutureFeaturesResponse {
    userId: string;
    marketing: boolean;
    agent: boolean;
    tooling: boolean;
    interviewOptimisation: boolean;
    valueProposition: boolean;
}

// Interface for applying records
export interface ApplyingDto {
    applyingId: string;
    userId: string;
    uniqueIdJob: string;
    applied: boolean;
    createdAt?: string;
    sentCv?: boolean;
    sentPortfolio?: boolean;
    sentCoverLetter?: boolean;
    followUpDate?: string;
    isArchived?: boolean;
    jobTitle?: string;
    company?: string;
    location?: string;
    rate?: string;
    jobUrl?: string;
    summary?: string;
    // Add other fields as needed
}

export interface ApplyingListResponse {
    applications: ApplyingDto[];
    total: number;
}

export interface RecentJobClickDto {
    job: {
        uniqueId?: string;
        title?: string;
        company?: string;
        location?: string;
        rate?: string;
        url?: string;
        summary?: string;
        date?: string;
    };
    clickedAt: string;
}

export interface JobClicksResponse {
    clicks: Array<{
        id: number;
        userId: string;
        jobId: string;
        clickedAt: string;
    }>;
    total: number;
}

export interface AutomationDetailDto {
    id: number;
    companyName?: string;
    industry?: string;
    companySize?: string;
    technologies?: string;
    location?: string;
    website?: string;
    description?: string;
}

export interface AutomationDetailsResponse {
    details: AutomationDetailDto[];
    total: number;
}

class ApiClient {
    private baseUrl: string;
    private token: string | null = null;

    constructor(baseUrl?: string) {
        this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://allgigs-v3-backend-production.up.railway.app';
    }

    setToken(token: string) {
        this.token = token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        // Always refresh session before API calls to ensure token is not expired
        const { supabase } = await import('../SupabaseClient');

        // Get current session (Supabase auto-refreshes expired tokens)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.access_token) {
            throw new Error('No authentication token available. Please log in again.');
        }

        // Always use the latest token from session
        const currentToken = session.access_token;

        const url = `${this.baseUrl}${endpoint}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`,
        };

        // Merge with existing headers if they exist
        if (options.headers) {
            Object.assign(headers, options.headers);
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            // Try to get error details from response
            let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.error || errorData.message) {
                    errorMessage = errorData.error || errorData.message || errorMessage;
                }
            } catch (e) {
                // If response is not JSON, use status text
            }
            const error = new Error(errorMessage);
            (error as any).status = response.status;
            throw error;
        }

        return response.json();
    }

    // Jobs API
    async getJobs(page: number = 1, pageSize: number = 50) {
        return this.request(`/api/jobs?page=${page}&pageSize=${pageSize}`);
    }

    async searchJobs(query: string, page: number = 1, pageSize: number = 50) {
        return this.request(`/api/jobs/search?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`);
    }

    async getJobById(jobId: string) {
        return this.request(`/api/jobs/${jobId}`);
    }

    // Search Logs API
    async logSearch(searchTerm: string, filters?: any) {
        return this.request('/api/searchlogs', {
            method: 'POST',
            body: JSON.stringify({
                searchTerm,
                filters: filters || {}
            })
        });
    }

    async getSearchHistory(limit: number = 50) {
        return this.request(`/api/searchlogs/history?limit=${limit}`);
    }

    // Job Applications API
    async createApplication(jobId: string, applied: boolean = false, sentCv?: boolean, sentPortfolio?: boolean, sentCoverLetter?: boolean) {
        return this.request<ApplyingDto>('/api/applying', {
            method: 'POST',
            body: JSON.stringify({
                jobId,
                applied,
                sentCv,
                sentPortfolio,
                sentCoverLetter
            })
        });
    }

    async getApplications(includeArchived: boolean = false): Promise<ApplyingListResponse> {
        return this.request<ApplyingListResponse>(`/api/applying?includeArchived=${includeArchived}`);
    }

    async getApplicationById(applyingId: string): Promise<ApplyingDto> {
        return this.request<ApplyingDto>(`/api/applying/${applyingId}`);
    }

    async updateApplication(applyingId: string, updateData: any): Promise<ApplyingDto> {
        return this.request<ApplyingDto>(`/api/applying/${applyingId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
    }

    async archiveApplication(applyingId: string): Promise<void> {
        return this.request<void>(`/api/applying/${applyingId}/archive`, {
            method: 'POST'
        });
    }

    async unarchiveApplication(applyingId: string): Promise<void> {
        return this.request<void>(`/api/applying/${applyingId}/unarchive`, {
            method: 'POST'
        });
    }

    // Job Clicks API
    async recordJobClick(jobId: string) {
        return this.request('/api/jobclicks', {
            method: 'POST',
            body: JSON.stringify({
                jobId
            })
        });
    }

    async getJobClicks(limit: number = 50) {
        return this.request(`/api/jobclicks?limit=${limit}`);
    }

    async getRecentlyClickedJobs(limit: number = 10): Promise<RecentJobClickDto[]> {
        return this.request<RecentJobClickDto[]>(`/api/jobclicks/recent?limit=${limit}`);
    }

    async getJobClicksWithDetails(limit: number = 50): Promise<JobClicksResponse> {
        return this.request<JobClicksResponse>(`/api/jobclicks?limit=${limit}`);
    }

    async checkJobClick(jobId: string): Promise<{ hasClicked: boolean }> {
        return this.request<{ hasClicked: boolean }>(`/api/jobclicks/check/${jobId}`);
    }

    // Profiles API
    async getProfile(): Promise<ProfileResponse> {
        return this.request<ProfileResponse>('/api/profiles/me');
    }

    async updateProfile(profileData: any): Promise<ProfileResponse> {
        return this.request<ProfileResponse>('/api/profiles/me', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
    }

    async updateAvailability(availableToRecruiters: boolean): Promise<void> {
        return this.request<void>('/api/profiles/me/availability', {
            method: 'PUT',
            body: JSON.stringify({ availableToRecruiters }),
        });
    }

    async updateTestimonials(testimonials: string): Promise<void> {
        return this.request<void>('/api/profiles/me/testimonials', {
            method: 'PUT',
            body: JSON.stringify({ testimonials }),
        });
    }

    async updateLinkedInFeedEnabled(enabled: boolean): Promise<void> {
        return this.request<void>('/api/profiles/me/linkedin-feed', {
            method: 'PUT',
            body: JSON.stringify({ linkedInFeedEnabled: enabled }),
        });
    }

    async getQuickSearch(): Promise<string[]> {
        return this.request<string[]>('/api/profiles/me/quicksearch');
    }

    async updateQuickSearch(keywords: string[]): Promise<void> {
        return this.request<void>('/api/profiles/me/quicksearch', {
            method: 'PUT',
            body: JSON.stringify({ keywords }),
        });
    }

    async getLinkedInFeedEnabled(): Promise<boolean> {
        return this.request<boolean>('/api/profiles/me/linkedin-feed');
    }

    // Future Features API
    async getFutureFeatures(): Promise<FutureFeaturesResponse> {
        return this.request<FutureFeaturesResponse>('/api/futurefeatures/me');
    }

    async updateFutureFeatures(featuresData: any): Promise<FutureFeaturesResponse> {
        return this.request<FutureFeaturesResponse>('/api/futurefeatures/me', {
            method: 'PUT',
            body: JSON.stringify(featuresData),
        });
    }

    // Automation Details API
    async getAutomationDetails(limit: number = 100): Promise<AutomationDetailsResponse> {
        return this.request<AutomationDetailsResponse>(`/api/automationdetails?limit=${limit}`);
    }

    async getAutomationDetailById(id: number): Promise<AutomationDetailDto> {
        return this.request<AutomationDetailDto>(`/api/automationdetails/${id}`);
    }

    async searchAutomationDetails(companyName: string): Promise<AutomationDetailsResponse> {
        return this.request<AutomationDetailsResponse>(`/api/automationdetails/search?companyName=${encodeURIComponent(companyName)}`);
    }

    // Job Statistics API (for dashboard stats)
    async getJobStatistics() {
        return this.request('/api/jobs/stats');
    }

    // Get job clicks stats for chart (helper method)
    async getJobClicksStats(startDate?: string, endDate?: string) {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const query = params.toString();
        return this.request(`/api/jobclicks/stats${query ? `?${query}` : ''}`);
    }
}

// Create singleton instance
export const apiClient = new ApiClient();
export default apiClient;
