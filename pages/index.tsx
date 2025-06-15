"use client"

import { useEffect, useState, useMemo } from "react"
import { supabase } from "../SupabaseClient"
import LoginForm from "../components/ui/login";
import AddJobForm from "../components/ui/add-job-form";
import Fuse from "fuse.js";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { formatDate } from "../utils/formatDate";
import RecentlyClickedJobs from '../components/ui/RecentlyClickedJobs'; // Added import
import CompleteProfileForm from "../components/ui/CompleteProfileForm";
import { useProfileCheck } from "../components/ui/useProfileCheck";


interface Job {
  UNIQUE_ID: string
  Title: string
  Company: string
  Location: string
  rate: string
  date: string
  Summary: string // Fixed: was "stringx"
  URL: string
  created_at?: string // Add optional timestamp field
  inserted_at?: string // Alternative timestamp field name
  added_by?: string // User ID who added the job
  added_by_email?: string // Email of user who added the job
  poster_name?: string // Name of the person who posted the job
  source?: string // Source of the job (e.g., 'allGigs')
  tags?: string // Tags for the job
  clicked_at?: string; // Added to store when the job was clicked by the user
}

export default function JobBoard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  // Removed searchPills and disregardedPills state variables
  const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  // Removed selectedIndustry and excludedTerms state variables
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [showAddJobForm, setShowAddJobForm] = useState(false);
  const [userClearance, setUserClearance] = useState<string | null>(null);
  const PAGE_SIZE = 30;
  const [allJobs, setAllJobs] = useState<Job[]>([]);

  // State for Recently Clicked Jobs
  const [showRecentlyClicked, setShowRecentlyClicked] = useState(false);
  const [recentlyClickedJobs, setRecentlyClickedJobs] = useState<Job[]>([]);
  const [loadingRecentlyClicked, setLoadingRecentlyClicked] = useState(false);

  // const paginatedJobs = filteredJobs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const paginationButtonStyle: React.CSSProperties = {
    padding: "10px 16px",
    fontSize: "16px",
    borderRadius: "4px",
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    color: "#000",
    cursor: "pointer",
    minWidth: "44px",
    minHeight: "44px",
    flexShrink: 0
  };
  const menuButtonStyle = {
    background: "#374151",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "10px 16px",
    fontSize: "0.95rem",
    cursor: "pointer",
    width: "80%",
    display: "flex",
    justifySelf: "center",
    justifyContent: "center"

  }

  const logoutButtonStyle = {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "10px 16px", // Reverted to original padding
    fontSize: "0.95rem", // Reverted to original font size
    cursor: "pointer",
    width: "24%", // Adjusted width (80% * 0.3)
    display: "flex",
    justifySelf: "center",
    justifyContent: "center"
  }

  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showMenuAddJobForm, setShowMenuAddJobForm] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowLogo(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  // Debounce search term to improve performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("first_name, last_name, linkedin_URL, industry, job_title")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        console.log('Fetched profile:', data, 'Error:', error);
        setProfile(data);
      });
  }, [user]);

  // Log search term activity to Supabase
  const logSearchTermActivity = async (searchTermToLog: string) => {
    
    if (!user || !user.id || !searchTermToLog || searchTermToLog.trim() === "") {
      console.log("[logSearchTermActivity] Pre-condition failed. User:", user, "SearchTerm:", searchTermToLog);
      return;
    }
    
    console.log("[logSearchTermActivity] Logging search term:", searchTermToLog, "for user:", user.id);
    console.log("[logSearchTermActivity] About to call supabase.from('search_logs').insert()");
    
    try {
      const insertData = {
        user_id: user.id,
        search_term: searchTermToLog.trim(),
      };
      console.log("[logSearchTermActivity] Insert data:", insertData);
      
      const { data, error } = await supabase.from("search_logs").insert([insertData]);
      
      console.log("[logSearchTermActivity] Supabase response - data:", data, "error:", error);
      
      if (error) {
        console.error("❌ Error logging search term:", error);
        console.error("❌ Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
      } else {
        console.log("✅ Search term logged successfully!");
      }
    } catch (error) {
      console.error("❌ Exception when logging search term:", error);
    }
  };

  // useEffect for logging debounced search term
  useEffect(() => {
    console.log("[useEffect logSearchTerm] Triggered. User:", user, "DebouncedSearchTerm:", debouncedSearchTerm);
    if (user && user.id && debouncedSearchTerm && debouncedSearchTerm.trim() !== "") {
      console.log("[useEffect logSearchTerm] Conditions met. Calling logSearchTermActivity.");
      logSearchTermActivity(debouncedSearchTerm);
    } else {
      console.log("[useEffect logSearchTerm] Conditions NOT met. Skipping logSearchTermActivity.");
      if (!user || !user.id) console.log("[useEffect logSearchTerm] Reason: User or user.id is missing.");
      if (!debouncedSearchTerm || debouncedSearchTerm.trim() === "") console.log("[useEffect logSearchTerm] Reason: debouncedSearchTerm is empty or whitespace.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, user]); 

  // Function to check user clearance level
  const checkUserClearance = async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from("user_clearances")
        .select("clearance_level")
        .eq("user_id", userId)
        .single();
      if (error) {
        console.log("No clearance record found for user, checking email domain");
        return null;
      }
      return data?.clearance_level || null;
    } catch (error) {
      console.error("Error checking user clearance:", error);
      return null;
    }
  };

  // Function to check if user has permission to add jobs
  const hasAddJobPermission = (user: any, clearanceLevel: string | null): boolean => {
    if (!user) return false;
    // Allow users with admin or moderator clearance
    if (clearanceLevel === "admin" || clearanceLevel === "moderator") {
      return true;
    }

    // Allow users with specific email domains (backup method)
    const allowedDomains = ["admin.com", "moderator.com", "company.com"];
    const userDomain = user.email?.split("@")[1];

    return allowedDomains.includes(userDomain);
  };

  useEffect(() => {
    // Check auth state on mount
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        checkUserClearance(data.user.id).then(setUserClearance);
      }
    });
    // Listen for login/logout
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setUser(user);
      if (user) {
        checkUserClearance(user.id).then(setUserClearance);
      } else {
        setUserClearance(null);
      }
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  // Function to refresh jobs list
  const refreshJobs = async () => {
    if (!user) return;
    setLoading(true);
    setPage(0); // Reset to first page
    const { data, error } = await supabase
      .from("Allgigs_All_vacancies_NEW")
      .select("*")
      .range(0, PAGE_SIZE - 1);
    if (error) {
      console.error(error);
    } else {
      setJobs(data || []);
      setHasMore((data?.length || 0) === PAGE_SIZE);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    async function fetchJobs() {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("Allgigs_All_vacancies_NEW")
        .select("*")
        .range(from, to);
      if (error) {
        console.error(error);
      } else {
        setJobs(data || []);
        setHasMore((data?.length || 0) === PAGE_SIZE);
      }
      setLoading(false);
    }
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page]);


  useEffect(() => {
    if (!user) return;
    setLoading(true);
    async function fetchJobs() {
      const { data, error } = await supabase
        .from("Allgigs_All_vacancies_NEW")
        .select("*");

      if (error) {
        console.error(error);
      } else {
        setAllJobs(data || []);
      }
      setLoading(false);
    }
    fetchJobs();
  }, [user]);

  // Function to fetch recently clicked jobs
  const fetchRecentlyClickedJobs = async () => {
    if (!user || !user.id) {
      console.log("[FetchRecentlyClicked] User not available.");
      return;
    }
    console.log("[FetchRecentlyClicked] Starting for user:", user.id);
    setLoadingRecentlyClicked(true);
    try {
      const { data: clicks, error: clicksError } = await supabase
        .from('job_clicks')
        .select('job_id, clicked_at')
        .eq('user_id', user.id)
        .order('clicked_at', { ascending: false });

      console.log("[FetchRecentlyClicked] Clicks data raw:", clicks);
      console.log("[FetchRecentlyClicked] Clicks error:", clicksError);

      if (clicksError) {
        console.error('[FetchRecentlyClicked] Error fetching job clicks:', clicksError);
        setRecentlyClickedJobs([]);
        // setLoadingRecentlyClicked(false); // Handled in finally
        return;
      }

      if (!clicks || clicks.length === 0) {
        console.log("[FetchRecentlyClicked] No clicks found in the last 10 days for user:", user.id);
        setRecentlyClickedJobs([]);
        // setLoadingRecentlyClicked(false); // Handled in finally
        return;
      }
      console.log(`[FetchRecentlyClicked] Found ${clicks.length} clicks.`);

      const jobIds = clicks.map(click => click.job_id).filter(id => id != null); // Ensure no null/undefined ids
      const uniqueJobIds = [...new Set(jobIds)];
      console.log("[FetchRecentlyClicked] Unique Job IDs to fetch:", uniqueJobIds);

      if (uniqueJobIds.length === 0) {
          console.log("[FetchRecentlyClicked] No valid unique job IDs to fetch details for.");
          setRecentlyClickedJobs([]);
          // setLoadingRecentlyClicked(false); // Handled in finally
          return;
      }

      const clickTimeMap = new Map<string, string>();
      clicks.forEach(click => {
        if (click.job_id && click.clicked_at && !clickTimeMap.has(click.job_id)) {
          clickTimeMap.set(click.job_id, click.clicked_at);
        }
      });
      console.log("[FetchRecentlyClicked] ClickTimeMap:", clickTimeMap);

      const { data: jobsData, error: jobsError } = await supabase
        .from('Allgigs_All_vacancies_NEW')
        .select('UNIQUE_ID, Title, Company, URL, date, Location, Summary, rate') // Removed created_at, inserted_at
        .in('UNIQUE_ID', uniqueJobIds);

      console.log("[FetchRecentlyClicked] JobsData from Allgigs_All_vacancies_NEW raw:", jobsData);
      console.log("[FetchRecentlyClicked] JobsError:", jobsError);

      if (jobsError) {
        console.error('[FetchRecentlyClicked] Error fetching job details:', jobsError);
        setRecentlyClickedJobs([]);
      } else if (jobsData && jobsData.length > 0) {
        const jobsWithClickData = jobsData.map(job => ({
          ...job,
          clicked_at: clickTimeMap.get(job.UNIQUE_ID),
        }));
        console.log("[FetchRecentlyClicked] Jobs with click data (before ordering):", jobsWithClickData);

        const orderedJobs = uniqueJobIds
          .map(id => jobsWithClickData.find(job => job.UNIQUE_ID === id))
          .filter(job => job !== undefined) as Job[];
        
        console.log("[FetchRecentlyClicked] Final ordered jobs for state:", orderedJobs);
        setRecentlyClickedJobs(orderedJobs);
      } else {
        console.log("[FetchRecentlyClicked] No job details found for the clicked job IDs or jobsData is empty.");
        setRecentlyClickedJobs([]);
      }
    } catch (error) {
      console.error('[FetchRecentlyClicked] Exception in fetchRecentlyClickedJobs:', error);
      setRecentlyClickedJobs([]);
    } finally {
      setLoadingRecentlyClicked(false);
      console.log("[FetchRecentlyClicked] Finished.");
    }
  };

  // useEffect for fetching recently clicked jobs
  useEffect(() => {
    console.log("[useEffect RecentlyClicked] Triggered. User:", user ? user.id : 'null', "ShowRecentlyClicked:", showRecentlyClicked);
    if (user && user.id && showRecentlyClicked) {
      console.log("[useEffect RecentlyClicked] Conditions met. Calling fetchRecentlyClickedJobs.");
      fetchRecentlyClickedJobs();
    } else {
      console.log("[useEffect RecentlyClicked] Conditions NOT met. Skipping fetchRecentlyClickedJobs.");
      if (!user || !user.id) console.log("[useEffect RecentlyClicked] Reason: User or user.id is missing.");
      if (!showRecentlyClicked) console.log("[useEffect RecentlyClicked] Reason: showRecentlyClicked is false.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, showRecentlyClicked]);

  // Memoize the Fuse.js instance to avoid recreating it on every render
  const fuse = useMemo(() => new Fuse(allJobs, {
    keys: [
      { name: "Title", weight: 0.6 },
      { name: "Summary", weight: 0.3 },
      { name: "Company", weight: 0.05 },
      { name: "Location", weight: 0.05 }
    ],
    threshold: 0.36, // Reduced fuzziness by 10%
  }), [allJobs]);

  // Memoize filtered jobs to avoid expensive filtering on every render
  const filteredJobs = useMemo(() => {
    let filtered = allJobs;

    // 1. Filter by debouncedSearchTerm (AND logic for multiple words)
    if (debouncedSearchTerm && debouncedSearchTerm.trim() !== "") {
      const searchWords = debouncedSearchTerm.trim().toLowerCase().split(/\s+/).filter(word => word.length > 0);
      if (searchWords.length > 0) {
        filtered = allJobs.filter(job => {
          const jobText = `${job.Title} ${job.Company} ${job.Location} ${job.Summary}`.toLowerCase();
          return searchWords.every(word => jobText.includes(word));
        });
      }
      // If searchWords is empty (e.g., searchTerm was just spaces), 
      // no filtering by search term happens here, filtered remains allJobs.
    }
    
    // Removed filtering by selectedIndustry and excludedTerms

    return filtered;
  }, [allJobs, debouncedSearchTerm]); // Removed selectedIndustry, excludedTerms, categorizeJob

  // Sort filtered jobs by Fuse.js search results
  const sortedJobs = useMemo(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.trim() !== "") {
      const results = fuse.search(debouncedSearchTerm);
      return results.map(result => result.item);
    }
    return filteredJobs;
  }, [debouncedSearchTerm, filteredJobs, fuse]);

  useEffect(() => {
    setPage(0);
    setHighlightedJobs([]); // Reset highlighted jobs when search term changes
  }, [debouncedSearchTerm]); // Removed selectedIndustry, excludedTerms

  const paginatedJobs = useMemo(() => {
    return sortedJobs.slice((page ?? 0) * PAGE_SIZE, ((page ?? 0) + 1) * PAGE_SIZE);
  }, [sortedJobs, page]);

  // Helper function to check if a job is new (within 3 hours)
  const isJobNew = (job: Job): boolean => {
    const timestamp = job.created_at || job.inserted_at;
    if (!timestamp) return false;

    const jobTime = new Date(timestamp);
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - (3 * 60 * 60 * 1000)); // 3 hours in milliseconds

    return jobTime > threeHoursAgo;
  };

  const handleLogout = async () => {
    const confirmed = window.confirm("Weet je zeker dat je wilt uitloggen?");
    if (!confirmed) return;

    await supabase.auth.signOut();
    setUser(null);
  };
  const totalPages = Math.ceil(sortedJobs.length / PAGE_SIZE);

  const getPageNumbers = () => {
    const visiblePages = 10;
    const half = Math.floor(visiblePages / 2);
    let start = Math.max(0, page - half);
    let end = start + visiblePages;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(0, end - visiblePages);
    }

    return Array.from({ length: end - start }, (_, i) => start + i);
  };

  const pageNumbers = getPageNumbers();

  // Add a state to track highlighted jobs
  const [highlightedJobs, setHighlightedJobs] = useState<Job[]>([]);

  // Function to highlight search terms in job text
  const highlightSearchTerms = (text: string, searchWords: string[]): string => {
    if (!searchWords || searchWords.length === 0) return text;

    // Escape special regex characters and create case-insensitive regex
    const escapedWords = searchWords.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
  };

  // Real-time highlighting as user types (mobile-friendly)
  useEffect(() => {
    if (debouncedSearchTerm.trim() !== '') {
      const searchWords = debouncedSearchTerm.trim().split(/\s+/).filter(word => word.length > 0);

      const updatedJobs = sortedJobs.map(job => ({
        ...job,
        Title: highlightSearchTerms(job.Title, searchWords),
        Summary: highlightSearchTerms(job.Summary, searchWords),
        Company: highlightSearchTerms(job.Company, searchWords),
        Location: highlightSearchTerms(job.Location, searchWords),
      }));

      setHighlightedJobs(updatedJobs);
    } else {
      // Clear highlights when search term is empty
      setHighlightedJobs([]);
    }
  }, [debouncedSearchTerm, sortedJobs]);

  const { needsProfile, loading: profileLoading } = useProfileCheck(user);

  if (!user) {
    return (
      <div>
        <LoginForm />
      </div>
    );
  }

  if (profileLoading || loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-xl font-semibold text-gray-700">Loading amazing jobs...</div>
          <div className="text-gray-500 mt-2">Please wait while we fetch the latest opportunities</div>
        </div>
      </div>
    )

  if (needsProfile) {
    return <CompleteProfileForm onComplete={() => window.location.reload()} />;
  }

  // Log job click to Supabase
  const logJobClick = async (job: Job) => {
    if (!user || !user.id) {
      console.error("[LogJobClick] User not available for logging job click. Aborting.");
      return;
    }
    console.log("[LogJobClick] Logging for user:", user.id, "Job ID:", job.UNIQUE_ID, "Title:", job.Title);
    try {
      const { error } = await supabase.from("job_clicks").insert([
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
          // clicked_at should be handled by DB default
        },
      ]);
      if (error) {
        console.error("[LogJobClick] Error logging job click:", error);
      } else {
        console.log("[LogJobClick] Job click logged successfully for job:", job.UNIQUE_ID);
        // Refresh recently clicked jobs if the section is visible
        if (showRecentlyClicked) {
          console.log("[LogJobClick] Refreshing recently clicked jobs as section is visible.");
          fetchRecentlyClickedJobs();
        } else {
          console.log("[LogJobClick] Recently clicked jobs section not visible, not refreshing immediately. Will refresh when opened.");
        }
      }
    } catch (error) {
      console.error("[LogJobClick] Exception when logging job click:", error);
    }
  };

  const menuButtonSharedStyle: React.CSSProperties = {
    background: "#0ccf83",
    color: "#000",
    fontWeight: 700,
    borderRadius: 6,
    padding: "12px 16px",
    border: "2px solid #0ccf83",
    boxShadow: "0 2px 8px rgba(12, 207, 131, 0.15)",
    cursor: "pointer",
    fontSize: "1.1rem",
    fontFamily: "'Montserrat', Arial, sans-serif",
    transition: "background 0.2s, color 0.2s, box-shadow 0.2s, border 0.2s, transform 0.1s",
    outline: 'none',
    marginTop: 0,
  };

  return (

    <>
      {/* Navbar */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        backgroundColor: "#121f36",
        width: "100%"
      }}>
        {/* Sticky container met twee vaste onderdelen */}

        {/* Topbar met burger en titel */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          height: "60px",
          boxSizing: "border-box"
        }}>
          {/* Burger left */}
          <div style={{ width: "44px", display: "flex", justifyContent: "flex-start" }}>
            <button
              onClick={() => setShowMenu(prev => !prev)}
              style={{
                background: "none",
                border: "none",
                color: "white",
                fontSize: "24px",
                cursor: "pointer",
                minWidth: "44px",
                minHeight: "44px"
              }}
              aria-label="Menu"
            >
              ☰
            </button>
          </div>

          {/* Centered title */}

          {showLogo && (
            <img
              src="/images/allGigs-logo-white.svg"
              alt="AllGigs Logo"
              style={{ height: "40px", transition: "opacity 0.3s" }}
            />
          )}
          {/* Right spacer */}
          <div style={{ width: "44px" }}></div>
        </div>

        {/* Burger menu bar (conditionally visible) */}
        {showMenu && (
          <div style={{
            background: "#121f36",
            color: "white",
            padding: "16px 0",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            boxSizing: "border-box",
            overflowX: "hidden",
          }}>
            {user && user.email && (
              <div className="user-email-display" style={{
                padding: "10px 20px", 
                fontSize: "0.9rem", 
                textAlign: "center", 
                borderBottom: "1px solid #374151",
                marginBottom: "10px"
              }}>
                Logged in as: <strong>{user.email}</strong>
              </div>
            )}
            {/* Personal Details Section */}
            {profile ? (
              <div style={{
                background: "#fff",
                color: "#121f36",
                borderRadius: "12px",
                margin: "10px 20px",
                padding: "16px",
                fontFamily: "'Montserrat', Arial, sans-serif",
                fontSize: "0.98rem",
                boxSizing: 'border-box',
                border: '3px solid #0ccf83',
                width: '48%',
                display: 'inline-block',
                verticalAlign: 'top',
              }}>
                <div style={{ fontWeight: 700, marginBottom: 8, color: '#0ccf83' }}>Your Details</div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}><strong style={{ minWidth: 90, display: 'inline-block' }}>First Name:</strong> <span style={{ marginLeft: 12 }}>{profile.first_name || '-'}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}><strong style={{ minWidth: 90, display: 'inline-block' }}>Last Name:</strong> <span style={{ marginLeft: 12 }}>{profile.last_name || '-'}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}><strong style={{ minWidth: 90, display: 'inline-block' }}>LinkedIn:</strong> <span style={{ marginLeft: 12 }}>{profile.linkedin_URL || '-'}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}><strong style={{ minWidth: 90, display: 'inline-block' }}>Industry:</strong> <span style={{ marginLeft: 12 }}>{profile.industry || '-'}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}><strong style={{ minWidth: 90, display: 'inline-block' }}>Job Title:</strong> <span style={{ marginLeft: 12 }}>{profile.job_title || '-'}</span></div>
                <button
                  style={menuButtonSharedStyle}
                  onMouseDown={e => e.currentTarget.style.transform = 'translateY(2px)'}
                  onMouseUp={e => e.currentTarget.style.transform = ''}
                  onMouseLeave={e => e.currentTarget.style.transform = ''}
                  onClick={() => setShowEditProfile(true)}
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              <div style={{ color: '#fff', textAlign: 'center', margin: '10px 0' }}>No personal details found.</div>
            )}
            {/* Add New Job and Logout buttons in hamburger menu */}
            {/* <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', margin: '2.5rem 20px 0 20px' }}>
              <button
                style={{
                  background: '#10b981',
                  color: '#000',
                  fontWeight: 700,
                  borderRadius: 6,
                  padding: '12px 16px',
                  border: '2px solid #0ccf83',
                  boxShadow: '0 2px 8px rgba(12, 207, 131, 0.15)',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  fontFamily: "'Montserrat', Arial, sans-serif",
                  transition: 'background 0.2s, color 0.2s, box-shadow 0.2s, border 0.2s, transform 0.1s',
                  outline: 'none',
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'translateY(2px)'}
                onMouseUp={e => e.currentTarget.style.transform = ''}
                onMouseLeave={e => e.currentTarget.style.transform = ''}
                onClick={() => setShowMenuAddJobForm(true)}
              >
                + Add New Job
              </button>
              <button
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  fontWeight: 700,
                  borderRadius: 6,
                  padding: '12px 16px',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.15)',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  fontFamily: "'Montserrat', Arial, sans-serif",
                  marginTop: 0,
                  transition: 'background 0.2s, color 0.2s, box-shadow 0.2s, border 0.2s, transform 0.1s',
                  outline: 'none',
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'translateY(2px)'}
                onMouseUp={e => e.currentTarget.style.transform = ''}
                onMouseLeave={e => e.currentTarget.style.transform = ''}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div> */}
          </div>
        )}

        {/* Edit Profile Modal */}
        {showEditProfile && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 420, background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: '2.5rem 2rem', fontFamily: "'Montserrat', Arial, sans-serif" }}>
              <button
                onClick={() => setShowEditProfile(false)}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  color: '#374151',
                  cursor: 'pointer',
                  zIndex: 10
                }}
                aria-label="Close"
              >×</button>
              <CompleteProfileForm
                onComplete={async () => {
                  setShowEditProfile(false);
                  // Refresh profile info after editing
                  if (user) {
                    const { data, error } = await supabase
                      .from("profiles")
                      .select("first_name, last_name, linkedin_URL, industry, job_title")
                      .eq("id", user.id)
                      .single();
                    setProfile(data);
                  }
                }}
                initialValues={profile}
              />
            </div>
          </div>
        )}
      </div>





      <div className="job-board-container">


        {/* Top Right Buttons */}
        {/* <div style={{
        position: "absolute",
        top: 20,
        right: 20,
        display: "flex",
        gap: "10px",
        zIndex: 1000,
      }}> */}
        {/* Upload new Gig Button */}
        {/* <button
          onClick={() => setShowAddJobForm(true)}
          style={{
            background: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Upload new Gig
        </button> */}

        {/* Logout Button */}
        {/* <button
          onClick={handleLogout}
          style={{
            background: "#e53e3e",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
        </div> */}

        {/* Header */}
        <div className="job-header">
          {/* <h1>AllGigs<span className="allGigs-lightning">ϟ</span></h1> */}
          <img src="/images/allGigs-logo-white.svg" alt="AllGigs Logo" style={{ height: "70px" }} />

          <p>
            Discover your next opportunity from <span style={{ fontWeight: 600, color: "#0ccf83" }}>{sortedJobs.length}</span> curated positions
          </p>
        </div>

        {/* Recently Clicked Jobs Section */}
        <div style={{ marginBottom: "2rem", padding: "1rem 0" }}>
          <button
            onClick={() => {
              const newShowState = !showRecentlyClicked;
              setShowRecentlyClicked(newShowState);
              if (newShowState && recentlyClickedJobs.length === 0) { // Fetch only if opening and no jobs loaded
                 // fetchRecentlyClickedJobs(); // fetch is now handled by use
              }
            }}
            style={{ 
              ...menuButtonStyle, 
              width: "auto", 
              marginBottom: "1rem", 
              background: showRecentlyClicked ? "#6b7280" : "#2563eb", // Adjusted color
              padding: "12px 20px",
              fontSize: "1rem",
            }}
          >
            {showRecentlyClicked ? "Hide" : "Show"} Recently Clicked Jobs
          </button>
          
          {showRecentlyClicked && (
            <RecentlyClickedJobs
              jobs={recentlyClickedJobs}
              isLoading={loadingRecentlyClicked}
              onJobClick={logJobClick} 
              isJobNew={isJobNew}       
            />
          )}
        </div>


        {/* Removed Industry Groups/Selection UI completely */}

        {/* Filters */}
        <div className="job-filters">
          <input
            placeholder="Search jobs..." // Simplified placeholder
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, padding: "0.75rem", borderRadius: "4px", border: "1px solid #e5e7eb", fontSize: "1rem" }}
          />
          {/* Removed Search Instructions for pills as pills are removed */}
        </div>
        {debouncedSearchTerm && debouncedSearchTerm.trim() !== "" && (
          <div style={{ marginTop: "0.5rem", marginBottom: "1rem", textAlign: "left", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.9rem", color: "#555", marginRight: "0.25rem" }}>Active search:</span>
            {debouncedSearchTerm.trim().toLowerCase().split(/\s+/).filter(word => word.length > 0).map((word, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: "#0ccf83", // Green background for the pill
                  color: "white",             // White text for contrast
                  padding: "0.25rem 0.75rem",
                  borderRadius: "1rem",       // Rounded corners for pill shape
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  display: "inline-block"
                }}
              >
                {word}
              </span>
            ))}
          </div>
        )}

        {/* Add Job Button - Only show for users with proper clearance */}
        {user && hasAddJobPermission(user, userClearance) && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "1rem"
          }}>
            <button
              onClick={() => setShowAddJobForm(true)}
              style={{
                padding: "12px 24px",
                borderRadius: "4px",
                background: "#10b981",
                color: "#fff",
                fontWeight: "600",
                border: "none",
                fontSize: "1rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>+</span>
              Add New Job
            </button>
          </div>
        )}

        {/* {hasMore && (
        <button
          onClick={() => setPage(page + 1)}
          style={{
            margin: "2rem auto",
            display: "block",
            padding: "12px 32px",
            borderRadius: "8px",
            background: "#4f46e5",
            color: "#fff",
            fontWeight: "bold",
            border: "none",
            fontSize: "1.1rem",
            cursor: "pointer",
          }}
        >
          Load More
        </button>
      )} */}


        {/* Job List */}
        <div className="job-list">
          {(highlightedJobs.length > 0 ? highlightedJobs.slice((page ?? 0) * PAGE_SIZE, ((page ?? 0) + 1) * PAGE_SIZE) : paginatedJobs).map((job) => (
            <div className="job-card" style={{ position: 'relative' }}>
              {/* View Job button at top right */}
              <a
                href={job.URL}
                target="_blank"
                rel="noopener noreferrer"
                className="view-job-btn"
                style={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  zIndex: 2,
                  borderRadius: '6px', // square like other buttons
                  background: '#0ccf83',
                  color: '#000',
                  fontWeight: 700,
                  border: '2px solid #0ccf83',
                  padding: '8px 18px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'background 0.2s, color 0.2s, border 0.2s',
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(12, 207, 131, 0.08)'
                }}
                onClick={() => logJobClick(job)}
              >
                View Job
              </a>
              <div className="job-main">
                <h3 className="job-title" dangerouslySetInnerHTML={{ __html: job.Title }} />
                <div className="job-company"><strong>Company:</strong> <span dangerouslySetInnerHTML={{ __html: job.Company }} /></div>
                <div className="job-details">
                  <span><strong>Rate:</strong> {job.rate}</span>
                  <span><strong>Location:</strong> <span dangerouslySetInnerHTML={{ __html: job.Location }} /></span>
                  <span><strong>Date:</strong> {job.date}</span>
                </div>
                <div className="job-summary">
                  <strong>Summary:</strong> <span dangerouslySetInnerHTML={{ __html: job.Summary }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Job Form Modal */}
        {showAddJobForm && user && (
          <AddJobForm
            onClose={() => setShowAddJobForm(false)}
            onJobAdded={refreshJobs}
            user={user}
          />
        )}

        {/* Pagination */}
        {sortedJobs.length > 0 && (
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "8px",
            padding: "1rem",
            marginTop: "2rem",
          }}>
            {/* Only show First and Prev if not on first page */}
            {page > 0 && (
              <>
                <button onClick={() => setPage(0)} style={paginationButtonStyle}>« First</button>
                <button onClick={() => setPage(prev => Math.max(prev - 1, 0))} style={paginationButtonStyle}>← Prev</button>
              </>
            )}

            {/* Page numbers */}
            {pageNumbers.map(num => (
              <button
                key={num}
                onClick={() => setPage(num)}
                style={{
                  ...paginationButtonStyle,
                  backgroundColor: num === page ? "#0ccf83" : "#fff",
                  color: num === page ? "#fff" : "#000",
                  fontWeight: num === page ? "bold" : "normal",
                }}
              >
                {num + 1}
              </button>
            ))}

            {/* Only show Next and Last if not on last page */}
            {page < totalPages - 1 && (
              <>
                <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages - 1))} style={paginationButtonStyle}>→ Next</button>
                <button onClick={() => setPage(totalPages - 1)} style={paginationButtonStyle}>» Last</button>
              </>
            )}
          </div>


        )}


      </div>

      {/* Add these buttons to the top right, outside the hamburger menu */}
      <div style={{
        position: 'fixed',
        top: 18,
        right: 24,
        zIndex: 1200,
        display: 'flex',
        gap: '0.75rem',
      }}>
        <button
          style={{
            background: '#10b981',
            color: '#000',
            fontWeight: 700,
            borderRadius: 6,
            padding: '6px 12px',
            border: '2px solid #0ccf83',
            boxShadow: '0 2px 8px rgba(12, 207, 131, 0.15)',
            cursor: 'pointer',
            fontSize: '1.05rem',
            fontFamily: "'Montserrat', Arial, sans-serif",
            transition: 'background 0.2s, color 0.2s, box-shadow 0.2s, border 0.2s, transform 0.1s',
            outline: 'none',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'translateY(2px)'}
          onMouseUp={e => e.currentTarget.style.transform = ''}
          onMouseLeave={e => e.currentTarget.style.transform = ''}
          onClick={() => setShowAddJobForm(true)}
        >
          + Add New Job
        </button>
        <button
          style={{
            background: '#dc2626',
            color: '#fff',
            fontWeight: 700,
            borderRadius: 6,
            padding: '6px 12px',
            border: 'none',
            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.15)',
            cursor: 'pointer',
            fontSize: '1.05rem',
            fontFamily: "'Montserrat', Arial, sans-serif",
            marginTop: 0,
            transition: 'background 0.2s, color 0.2s, box-shadow 0.2s, border 0.2s, transform 0.1s',
            outline: 'none',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'translateY(2px)'}
          onMouseUp={e => e.currentTarget.style.transform = ''}
          onMouseLeave={e => e.currentTarget.style.transform = ''}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

    </>
  )
}

