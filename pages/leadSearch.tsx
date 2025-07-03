"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { supabase } from "../SupabaseClient"
import LoginForm from "../components/ui/login";
import AddJobForm from "../components/ui/add-job-form";
import Fuse from "fuse.js";
// import { SpeedInsights } from "@vercel/speed-insights/next"
// import { formatDate } from "../utils/formatDate";
import RecentlyClickedJobs from '../components/ui/RecentlyClickedJobs'; // Added import
import CompleteProfileForm from "../components/ui/CompleteProfileForm";
import { useProfileCheck } from "../components/ui/useProfileCheck";
import { useRouter } from "next/router";
import GlobalNav from "../components/ui/GlobalNav";


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
  };

  const logoutButtonStyle = {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "10px 16px",
    fontSize: "0.95rem",
    cursor: "pointer",
    // width: "24%",
    display: "flex",
    justifySelf: "center",
    justifyContent: "center"
  };

  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showMenuAddJobForm, setShowMenuAddJobForm] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const router = useRouter();
  const { search: querySearch } = router.query;

  useEffect(() => {
    if (querySearch && typeof querySearch === 'string') {
      setSearchTerm(querySearch); // update state
    }
  }, [querySearch]);


  useEffect(() => {
    const handleScroll = () => {
      setShowLogo(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // jobs wordt nog door supabase gebruikt dus moet hij hier ook nog gefeteched worden
  useEffect(() => {
    const fetchJobs = async () => {
      const { data } = await supabase.from("jobs").select("*");
      if (data) setJobs(data);
    };
    fetchJobs();
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
      .select("first_name, last_name, linkedin_URL, industry, job_title, location")
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

  // Function to check if user has permission to add jobs
  const hasAddJobPermission = (user: any): boolean => !!user && !!user.id;

  useEffect(() => {
    // Check auth state on mount
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
    // Listen for login/logout
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setUser(user);
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
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
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
        return;
      }

      // Filter clicks to only those within the last 10 days
      const recentClicks = (clicks || []).filter(click => {
        if (!click.clicked_at) return false;
        return new Date(click.clicked_at) >= tenDaysAgo;
      });

      if (recentClicks.length === 0) {
        console.log("[FetchRecentlyClicked] No clicks found in the last 10 days for user:", user.id);
        setRecentlyClickedJobs([]);
        return;
      }
      console.log(`[FetchRecentlyClicked] Found ${recentClicks.length} recent clicks.`);

      const jobIds = recentClicks.map(click => click.job_id).filter(id => id != null); // Ensure no null/undefined ids
      const uniqueJobIds = [...new Set(jobIds)];
      console.log("[FetchRecentlyClicked] Unique Job IDs to fetch:", uniqueJobIds);

      if (uniqueJobIds.length === 0) {
        console.log("[FetchRecentlyClicked] No valid unique job IDs to fetch details for.");
        setRecentlyClickedJobs([]);
        return;
      }

      const clickTimeMap = new Map<string, string>();
      recentClicks.forEach(click => {
        if (click.job_id && click.clicked_at && !clickTimeMap.has(click.job_id)) {
          clickTimeMap.set(click.job_id, click.clicked_at);
        }
      });
      console.log("[FetchRecentlyClicked] ClickTimeMap:", clickTimeMap);

      // Only fetch jobs that are still present in the main jobs table
      const { data: jobsData, error: jobsError } = await supabase
        .from('Allgigs_All_vacancies_NEW')
        .select('UNIQUE_ID, Title, Company, URL, date, Location, Summary, rate')
        .in('UNIQUE_ID', uniqueJobIds);

      console.log("[FetchRecentlyClicked] JobsData from Allgigs_All_vacancies_NEW raw:", jobsData);
      console.log("[FetchRecentlyClicked] JobsError:", jobsError);

      if (jobsError) {
        console.error('[FetchRecentlyClicked] Error fetching job details:', jobsError);
        setRecentlyClickedJobs([]);
      } else if (jobsData && jobsData.length > 0) {
        // Only include jobs that are still present in the main jobs table
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

  // Sort filtered jobs by Fuse.js search results or by newest first
  const sortedJobs = useMemo(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.trim() !== "") {
      const results = fuse.search(debouncedSearchTerm);
      return results.map(result => result.item);
    }
    // Sort by created_at or inserted_at descending (newest first)
    return [...filteredJobs].sort((a, b) => {
      const aDate = new Date(a.created_at || a.inserted_at || 0).getTime();
      const bDate = new Date(b.created_at || b.inserted_at || 0).getTime();
      return bDate - aDate;
    });
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

  useEffect(() => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    if (showMenu) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`; // Compenseer verschuiving
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '0px';
    }

    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '0px';
    };
  }, [showMenu]);

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

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY < 0) return;
          if (currentScrollY < 50) {
            setHeaderVisible(true);
          } else if (currentScrollY > lastScrollY.current) {
            setHeaderVisible(false); // scrolling down
          } else {
            setHeaderVisible(true); // scrolling up
          }
          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!user) {
    return (
      <div>
        <LoginForm />
      </div>
    );
  }

  if (profileLoading || loading)
    return (
      <div style={{
        minHeight: '100vh',
        // background: 'linear-gradient(to bottom right, #e0f2fe, #ffffff, #ede9fe)'
        background: '#121f36'

      }}>
        <div style={{
          textAlign: 'center',
          paddingTop: '20vh'
        }}>
          {/* <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#4b5563' }}>Loading jobs...</div>
          <div style={{ color: '#6b7280', marginTop: '0.5rem' }}>Please wait while we fetch the latest opportunities</div> */}
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

  console.log(showMenuAddJobForm); // voorkom build error tijdelijk
  console.log(menuButtonSharedStyle); // voorkom build error tijdelijk
  console.log(hasAddJobPermission); // voorkom build error tijdelijk
  console.log(setShowMenuAddJobForm); // voorkom build error tijdelijk
  console.log(hasMore); // voorkom build error tijdelijk
  console.log(jobs); // voorkom build error tijdelijk


  return (
    <>
      <GlobalNav currentPage="leadSearch" />
      {/* Sticky header + search bar container */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backgroundColor: "#121f36",
          width: "100%",
          transition: "transform 0.3s cubic-bezier(.4,0,.2,1)",
          transform: headerVisible ? "translateY(0)" : "translateY(-100%)"
        }}
      >
        {/* Navbar */}
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
          {/* Top Right Buttons (Post a Job & Logout) - Visible on Desktop */}
          <div className="hide-on-mobile" /* Hide on mobile */
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              padding: '0 20px 12px 20px',
            }}>
            <button
              style={{
                background: '#0ccf83',
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
                marginTop: '20px'


              }}
              onMouseDown={e => e.currentTarget.style.transform = 'translateY(2px)'}
              onMouseUp={e => e.currentTarget.style.transform = ''}
              onMouseLeave={e => e.currentTarget.style.transform = ''}
              onClick={() => setShowAddJobForm(true)}
            >
              Post a Job
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
        </div>

        {/* Search bar */}
        <div className="job-filters">
          <input
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, padding: "0.75rem", borderRadius: "4px", border: "1px solid #e5e7eb", fontSize: "1rem" }}
          />
        </div>
      </div>
      {/* End sticky header + search bar */}

      {/* Main Job Board Content Container */}
      <div className="job-board-container">

        {/* Header */}
        <div className="job-header">
          {/* <h1>AllGigs<span className="allGigs-lightning">ϟ</span></h1> */}
          <img src="/images/allGigs-logo-white.svg" alt="AllGigs Logo" style={{ height: "70px" }} />

          <p>
            Discover your next opportunity from <span style={{ fontWeight: 600, color: "#0ccf83" }}>{sortedJobs.length}</span> curated positions
          </p>
        </div>

        {/* Manage Jobs Section */}
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
              background: showRecentlyClicked ? "#6b7280" : "#0ccf83", // Adjusted color
              padding: "12px 20px",
              fontSize: "1rem",
            }}
          >
            Manage Jobs
          </button>

          {showRecentlyClicked &&
            (
              <RecentlyClickedJobs
                jobs={recentlyClickedJobs}
                isLoading={loadingRecentlyClicked}
                onJobClick={logJobClick}
                isJobNew={isJobNew}
              />
            )}
        </div>

        {/* Filters */}
        {debouncedSearchTerm && debouncedSearchTerm.trim() !== "" && (
          <div style={{ marginTop: "0.5rem", marginBottom: "1rem", textAlign: "left", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}>
            {/* <span style={{ fontSize: "0.9rem", color: "#555", marginRight: "0.25rem" }}>Active search:</span> */}
            {/* {debouncedSearchTerm.trim().toLowerCase().split(/\s+/).filter(word => word.length > 0).map((word, index) => (
              <span
                key={index}
                style={{
                  color: "#2563eb", // Blue link color
                  textDecoration: "underline",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "inline-block",
                }}
              >
                {word}
              </span>
            ))} */}
          </div>
        )}

        {/* Job List */}
        <div className="job-list">
          {(highlightedJobs.length > 0 ? highlightedJobs.slice((page ?? 0) * PAGE_SIZE, ((page ?? 0) + 1) * PAGE_SIZE) : paginatedJobs).map((job) => (
            <a
              key={job.UNIQUE_ID}
              href={job.URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => logJobClick(job)}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
              }}
            >
              <div className="job-card" style={{ position: 'relative' }}>
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
            </a>
          ))}
        </div>

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

      {/* Mobile Hamburger Menu Content - Visible only on mobile */}
      {showMenu && (
        <div
          onClick={() => setShowMenu(false)} // klik sluit menu optioneel
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0, // ← belangrijk!
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 1999,
          }}
        />
      )}
      {showMenu && (
        <div
          style={{
            background: "rgb(18, 31, 54)",
            color: "white",
            padding: "24px 0 24px 0",
            boxShadow: "rgba(0, 0, 0, 0.3) 0px 4px 24px",
            boxSizing: "border-box",
            overflowX: "hidden",
            // position: 'absolute',
            // top: typeof window !== 'undefined' ? window.scrollY + 60 : 60,
            left: 0,
            right: 0,
            margin: '0 auto',
            width: '95vw',
            maxWidth: '420px',
            borderRadius: '16px',
            zIndex: 2000, // Above everything except modals
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'rgb(18, 31, 54, 1)', // Ensure fully opaque
            position: 'fixed',
            top: '60px',
          }}
        >
          {user && user.email && (
            <div className="user-email-display" style={{
              padding: "10px 20px",
              fontSize: "0.9rem",
              textAlign: "center",
              // borderBottom: "1px solid #374151",
              marginBottom: "10px"
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8, color: '#0ccf83' }}>Your Details</div>

              Logged in as: <strong>{user.email}</strong>
            </div>
          )}
          {/* Profile Details Section in menu */}
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
              // border: '3px solid #0ccf83',
              width: 'calc(100% - 40px)', // Full width minus margins
              display: 'block',
              marginBottom: '1.2rem',
              zIndex: 999,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}><strong style={{ minWidth: 90, display: 'inline-block' }}>First Name:</strong> <span style={{ marginLeft: 12 }}>{profile.first_name || '-'}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}><strong style={{ minWidth: 90, display: 'inline-block' }}>Last Name:</strong> <span style={{ marginLeft: 12 }}>{profile.last_name || '-'}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}><strong style={{ minWidth: 90, display: 'inline-block' }}>LinkedIn:</strong> <span style={{ marginLeft: 12 }}>{profile.linkedin_URL || '-'}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}><strong style={{ minWidth: 90, display: 'inline-block' }}>Industry:</strong> <span style={{ marginLeft: 12 }}>{profile.industry || '-'}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}><strong style={{ minWidth: 90, display: 'inline-block' }}>Job Title:</strong> <span style={{ marginLeft: 12 }}>{profile.job_title || '-'}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}><strong style={{ minWidth: 90, display: 'inline-block' }}>Location:</strong> <span style={{ marginLeft: 12 }}>{profile.location || '-'}</span></div>
              {/* Available to Recruiters Toggle */}
              <AvailableToRecruitersToggle />
              <button
                style={{ ...menuButtonStyle, width: '100%' }}
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
          {/* Add New Job and Logout buttons in hamburger menu, only on mobile */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem',
            margin: '2.5rem 20px 0 20px',
            width: 'calc(100% - 40px)', // Full width minus margins
          }}>
            <button
              className="hide-on-desktop"
              style={{
                background: '#0ccf83',
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
              Post a Job
            </button>
            <button

              // className="hide-on-desktop"
              style={logoutButtonStyle}
              onMouseDown={e => e.currentTarget.style.transform = 'translateY(2px)'}
              onMouseUp={e => e.currentTarget.style.transform = ''}
              onMouseLeave={e => e.currentTarget.style.transform = ''}
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>
        </div>
      )}

      {/* Profile Details Section (Modal) */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          inset: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1000 // Higher z-index for modals
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            maxWidth: '28rem',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              lineHeight: '1.75rem',
              fontWeight: 700,
              marginBottom: '1rem',
              color: '#1f2937'
            }}>Profile Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  lineHeight: '1rem',
                  fontWeight: 500,
                  color: '#374151'
                }}>Name</label>
                <p style={{
                  marginTop: '0.25rem',
                  fontSize: '0.875rem',
                  lineHeight: '1.25rem',
                  color: '#111827'
                }}>{profile.first_name} {profile.last_name}</p>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  lineHeight: '1rem',
                  fontWeight: 500,
                  color: '#374151'
                }}>Job Title</label>
                <p style={{
                  marginTop: '0.25rem',
                  fontSize: '0.875rem',
                  lineHeight: '1.25rem',
                  color: '#111827'
                }}>{profile.job_title || 'Not set'}</p>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  lineHeight: '1rem',
                  fontWeight: 500,
                  color: '#374151'
                }}>Industry</label>
                <p style={{
                  marginTop: '0.25rem',
                  fontSize: '0.875rem',
                  lineHeight: '1.25rem',
                  color: '#111827'
                }}>{profile.industry || 'Not set'}</p>
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  lineHeight: '1rem',
                  fontWeight: 500,
                  color: '#374151'
                }}>LinkedIn URL</label>
                <p style={{
                  marginTop: '0.25rem',
                  fontSize: '0.875rem',
                  lineHeight: '1.25rem',
                  color: '#111827',
                  wordBreak: 'break-all'
                }}>
                  {profile.linkedin_URL ? (
                    <a href={profile.linkedin_URL} target="_blank" rel="noopener noreferrer" style={{
                      color: '#2563eb',
                      textDecoration: 'none'
                    }} onMouseOver={e => e.currentTarget.style.color = '#1e40af'} onMouseOut={e => e.currentTarget.style.color = '#2563eb'}>
                      {profile.linkedin_URL}
                    </a>
                  ) : (
                    'Not set'
                  )}
                </p>
              </div>
            </div>
            <div style={{
              marginTop: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <button
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  borderRadius: '0.25rem',
                  transition: 'background-color 0.2s',
                  border: 'none',
                  cursor: 'pointer'
                }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#1e40af'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#2563eb'}
                onClick={() => setShowSettings(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Job Form Modal */}
      {showAddJobForm && user && (
        <AddJobForm
          onClose={() => setShowAddJobForm(false)}
          onJobAdded={refreshJobs}
          user={user}
        />
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && profile && (
        <div
          style={{
            position: 'absolute',
            top: typeof window !== 'undefined' ? window.scrollY + 40 : 40,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            minHeight: '100vh',
          }}
        >
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: 420,
            width: '100%',
            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            position: 'relative',
          }}>
            <CompleteProfileForm
              initialValues={profile}
              onComplete={async () => {
                // Refetch profile
                if (user) {
                  const { data } = await supabase
                    .from('profiles')
                    .select('first_name, last_name, linkedin_URL, industry, job_title, location')
                    .eq('id', user.id)
                    .single();
                  setProfile(data);
                }
                setShowEditProfile(false);
                setShowMenu(false); // Optionally close menu after editing
              }}
            />
            <button
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                color: '#374151',
                cursor: 'pointer',
                zIndex: 1
              }}
              aria-label="Close"
              onClick={() => setShowEditProfile(false)}
            >

            </button>
          </div>
        </div>
      )}
    </>
  )
}

function AvailableToRecruitersToggle() {
  const [available, setAvailable] = useState(true);
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, marginTop: 8 }}>
      <label style={{ minWidth: 140, fontWeight: 600, color: '#374151', fontSize: '0.98rem', marginRight: 12 }}>
        Available to Recruiters
      </label>
      <span style={{ marginRight: 8, color: available ? '#0ccf83' : '#aaa', fontWeight: available ? 700 : 400 }}>Yes</span>
      <div
        onClick={() => setAvailable(a => !a)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: available ? '#0ccf83' : '#ccc',
          cursor: 'pointer',
          position: 'relative',
          margin: '0 8px',
          transition: 'background 0.2s',
          display: 'inline-block',
        }}
        aria-label="Toggle Available to Recruiters"
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: 2,
            left: available ? 22 : 2,
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            transition: 'left 0.2s',
          }}
        />
      </div>
      <span style={{ marginLeft: 8, color: !available ? '#0ccf83' : '#aaa', fontWeight: !available ? 700 : 400 }}>No</span>
    </div>
  );
}
