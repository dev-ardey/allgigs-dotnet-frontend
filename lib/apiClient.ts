// API Client for backend communication
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

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
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
    async getProfile() {
        return this.request('/api/profiles/me');
    }

    async updateProfile(profileData: any) {
        return this.request('/api/profiles/me', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
    }

    async updateAvailability(availableToRecruiters: boolean) {
        return this.request('/api/profiles/me/availability', {
            method: 'PUT',
            body: JSON.stringify({ availableToRecruiters }),
        });
    }

    async updateTestimonials(testimonials: string) {
        return this.request('/api/profiles/me/testimonials', {
            method: 'PUT',
            body: JSON.stringify({ testimonials }),
        });
    }

    async getQuickSearch() {
        return this.request('/api/profiles/me/quicksearch');
    }

    async updateQuickSearch(keywords: string[]) {
        return this.request('/api/profiles/me/quicksearch', {
            method: 'PUT',
            body: JSON.stringify({ keywords }),
        });
    }

    async getLinkedInFeedEnabled() {
        return this.request('/api/profiles/me/linkedin-feed');
    }

    async updateLinkedInFeedEnabled(enabled: boolean) {
        return this.request('/api/profiles/me/linkedin-feed', {
            method: 'PUT',
            body: JSON.stringify({ enabled }),
        });
    }
}

// Create singleton instance
export const apiClient = new ApiClient();
export default apiClient;
