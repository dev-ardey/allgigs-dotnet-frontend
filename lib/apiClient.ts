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

class ApiClient {
    private baseUrl: string;
    private token: string | null = null;

    constructor(baseUrl: string = 'http://localhost:5004') {
        this.baseUrl = baseUrl;
    }

    setToken(token: string) {
        this.token = token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        // Merge with existing headers if they exist
        if (options.headers) {
            Object.assign(headers, options.headers);
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
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
    async createApplication(jobId: string, jobData: any) {
        return this.request('/api/applying', {
            method: 'POST',
            body: JSON.stringify({
                jobId,
                jobData
            })
        });
    }

    async getApplications(includeArchived: boolean = false) {
        return this.request(`/api/applying?includeArchived=${includeArchived}`);
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

    async getRecentlyClickedJobs(limit: number = 10) {
        return this.request(`/api/jobclicks/recent?limit=${limit}`);
    }

    async checkJobClick(jobId: string) {
        return this.request(`/api/jobclicks/check/${jobId}`);
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
}

// Create singleton instance
export const apiClient = new ApiClient();
export default apiClient;
