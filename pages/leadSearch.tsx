"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { supabase } from "../SupabaseClient"
import LoginForm from "../components/ui/login";
import AddJobForm from "../components/ui/add-job-form";
import Fuse from "fuse.js";
// import { SpeedInsights } from "@vercel/speed-insights/next"
// import { formatDate } from "../utils/formatDate";
// import RecentlyClickedJobs from '../components/ui/RecentlyClickedJobs'; // Added import
import CompleteProfileForm from "../components/ui/CompleteProfileForm";
import { useProfileCheck } from "../components/ui/useProfileCheck";
import { useRouter } from "next/router";
import GlobalNav from "../components/ui/GlobalNav";
import { Search, Sparkles, SearchCheck, Edit2, Plus, X, Building2, MapPin, Coins } from "lucide-react";


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
  // const [showRecentlyClicked, setShowRecentlyClicked] = useState(false);
  // const [recentlyClickedJobs, setRecentlyClickedJobs] = useState<Job[]>([]);
  // const [loadingRecentlyClicked, setLoadingRecentlyClicked] = useState(false);

  // Add a state to track highlighted jobs
  const [highlightedJobs, setHighlightedJobs] = useState<Job[]>([]);

  // State to track expanded summaries
  const [expandedSummaries, setExpandedSummaries] = useState<Set<string>>(new Set());

  // Lead Search state variables (from dashboard)
  const [editKeywords, setEditKeywords] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [keywords, setKeywords] = useState(["Frontend", "Backend", "React", "Node.js", "TypeScript"]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);

  // State to track if sticky header should be visible
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const leadSearchSectionRef = useRef<HTMLDivElement>(null);

  // const paginatedJobs = filteredJobs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  // const paginationButtonStyle: React.CSSProperties = {
  //   padding: "10px 16px",
  //   fontSize: "16px",
  //   borderRadius: "4px",
  //   border: "1px solid #d1d5db",
  //   backgroundColor: "#fff",
  //   color: "#000",
  //   cursor: "pointer",
  //   minWidth: "44px",
  //   minHeight: "44px",
  //   flexShrink: 0
  // };
  // const menuButtonStyle = {
  //   background: "#374151",
  //   color: "#fff",
  //   border: "none",
  //   borderRadius: "4px",
  //   padding: "10px 16px",
  //   fontSize: "0.95rem",
  //   cursor: "pointer",
  //   width: "80%",
  //   display: "flex",
  //   justifySelf: "center",
  //   justifyContent: "center"
  // };

  // const logoutButtonStyle = {
  //   background: "#dc2626",
  //   color: "#fff",
  //   border: "none",
  //   borderRadius: "4px",
  //   padding: "10px 16px",
  //   fontSize: "0.95rem",
  //   cursor: "pointer",
  //   // width: "24%",
  //   display: "flex",
  //   justifySelf: "center",
  //   justifyContent: "center"
  // };

  // const [showMenu, setShowMenu] = useState(false);
  // const [showSettings, setShowSettings] = useState(false);
  // const [showLogo, setShowLogo] = useState(false);
  // const [profile, setProfile] = useState<any>(null);
  // const [showEditProfile, setShowEditProfile] = useState(false);
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
      // setShowLogo(window.scrollY > 500);
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
        // setProfile(data);
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
  // const refreshJobs = async () => {
  //   if (!user) return;
  //   setLoading(true);
  //   setPage(0); // Reset to first page
  //   const { data, error } = await supabase
  //     .from("Allgigs_All_vacancies_NEW")
  //     .select("*")
  //     .range(0, PAGE_SIZE - 1);
  //   if (error) {
  //     console.error(error);
  //   } else {
  //     setJobs(data || []);
  //     setHasMore((data?.length || 0) === PAGE_SIZE);
  //   }
  //   setLoading(false);
  // };

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
  // const fetchRecentlyClickedJobs = async () => {
  //   if (!user || !user.id) {
  //     console.log("[FetchRecentlyClicked] User not available.");
  //     return;
  //   }
  //   console.log("[FetchRecentlyClicked] Starting for user:", user.id);
  //   // setLoadingRecentlyClicked(true);
  //   try {
  //     const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  //     const { data: clicks, error: clicksError } = await supabase
  //       .from('job_clicks')
  //       .select('job_id, clicked_at')
  //       .eq('user_id', user.id)
  //       .order('clicked_at', { ascending: false });

  //     console.log("[FetchRecentlyClicked] Clicks data raw:", clicks);
  //     console.log("[FetchRecentlyClicked] Clicks error:", clicksError);

  //     if (clicksError) {
  //       console.error('[FetchRecentlyClicked] Error fetching job clicks:', clicksError);
  //       // setRecentlyClickedJobs([]);
  //       return;
  //     }

  //     // Filter clicks to only those within the last 10 days
  //     const recentClicks = (clicks || []).filter(click => {
  //       if (!click.clicked_at) return false;
  //       return new Date(click.clicked_at) >= tenDaysAgo;
  //     });

  //     if (recentClicks.length === 0) {
  //       console.log("[FetchRecentlyClicked] No clicks found in the last 10 days for user:", user.id);
  //       // setRecentlyClickedJobs([]);
  //       return;
  //     }
  //     console.log(`[FetchRecentlyClicked] Found ${recentClicks.length} recent clicks.`);

  //     const jobIds = recentClicks.map(click => click.job_id).filter(id => id != null); // Ensure no null/undefined ids
  //     const uniqueJobIds = [...new Set(jobIds)];
  //     console.log("[FetchRecentlyClicked] Unique Job IDs to fetch:", uniqueJobIds);

  //     if (uniqueJobIds.length === 0) {
  //       console.log("[FetchRecentlyClicked] No valid unique job IDs to fetch details for.");
  //       // setRecentlyClickedJobs([]);
  //       return;
  //     }

  //     const clickTimeMap = new Map<string, string>();
  //     recentClicks.forEach(click => {
  //       if (click.job_id && click.clicked_at && !clickTimeMap.has(click.job_id)) {
  //         clickTimeMap.set(click.job_id, click.clicked_at);
  //       }
  //     });
  //     console.log("[FetchRecentlyClicked] ClickTimeMap:", clickTimeMap);

  //     // Only fetch jobs that are still present in the main jobs table
  //     const { data: jobsData, error: jobsError } = await supabase
  //       .from('Allgigs_All_vacancies_NEW')
  //       .select('UNIQUE_ID, Title, Company, URL, date, Location, Summary, rate')
  //       .in('UNIQUE_ID', uniqueJobIds);

  //     console.log("[FetchRecentlyClicked] JobsData from Allgigs_All_vacancies_NEW raw:", jobsData);
  //     console.log("[FetchRecentlyClicked] JobsError:", jobsError);

  //     if (jobsError) {
  //       console.error('[FetchRecentlyClicked] Error fetching job details:', jobsError);
  //       // setRecentlyClickedJobs([]);
  //     } else if (jobsData && jobsData.length > 0) {
  //       // Only include jobs that are still present in the main jobs table
  //       const jobsWithClickData = jobsData.map(job => ({
  //         ...job,
  //         clicked_at: clickTimeMap.get(job.UNIQUE_ID),
  //       }));
  //       console.log("[FetchRecentlyClicked] Jobs with click data (before ordering):", jobsWithClickData);

  //       const orderedJobs = uniqueJobIds
  //         .map(id => jobsWithClickData.find(job => job.UNIQUE_ID === id))
  //         .filter(job => job !== undefined) as Job[];
  //       console.log("[FetchRecentlyClicked] Final ordered jobs for state:", orderedJobs);
  //       // setRecentlyClickedJobs(orderedJobs);
  //     } else {
  //       console.log("[FetchRecentlyClicked] No job details found for the clicked job IDs or jobsData is empty.");
  //       // setRecentlyClickedJobs([]);
  //     }
  //   } catch (error) {
  //     console.error('[FetchRecentlyClicked] Exception in fetchRecentlyClickedJobs:', error);
  //     // setRecentlyClickedJobs([]);
  //   } finally {
  //     // setLoadingRecentlyClicked(false);
  //     console.log("[FetchRecentlyClicked] Finished.");
  //   }
  // };

  // useEffect for fetching recently clicked jobs
  // useEffect(() => {
  //   console.log("[useEffect RecentlyClicked] Triggered. User:", user ? user.id : 'null', "ShowRecentlyClicked:", showRecentlyClicked);
  //   if (user && user.id && showRecentlyClicked) {
  //     console.log("[useEffect RecentlyClicked] Conditions met. Calling fetchRecentlyClickedJobs.");
  //     fetchRecentlyClickedJobs();
  //   } else {
  //     console.log("[useEffect RecentlyClicked] Conditions NOT met. Skipping fetchRecentlyClickedJobs.");
  //     if (!user || !user.id) console.log("[useEffect RecentlyClicked] Reason: User or user.id is missing.");
  //     if (!showRecentlyClicked) console.log("[useEffect RecentlyClicked] Reason: showRecentlyClicked is false.");
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [user, showRecentlyClicked]);

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

  // Fetch recommended jobs based on keywords
  useEffect(() => {
    if (user && keywords.length > 0) {
      fetchRecommendedJobs(keywords);
    }
  }, [user, keywords]);

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

  // const handleLogout = async () => {
  //   const confirmed = window.confirm("Weet je zeker dat je wilt uitloggen?");
  //   if (!confirmed) return;

  //   await supabase.auth.signOut();
  //   setUser(null);
  // };
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

  // const pageNumbers = getPageNumbers();

  // Function to normalize text and remove weird spacing/characters
  const normalizeText = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/&nbsp;/g, ' ')           // Replace non-breaking spaces
      .replace(/\s+/g, ' ')             // Replace multiple spaces with single space
      .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ') // Replace various unicode spaces
      .trim();
  };

  // Function to check if summary is long and needs truncation
  const isSummaryLong = (summary: string): boolean => {
    return normalizeText(summary).length > 200; // Adjust character limit as needed
  };

  // Function to get truncated summary
  const getTruncatedSummary = (summary: string): string => {
    const normalized = normalizeText(summary);
    return normalized.length > 200 ? normalized.substring(0, 200) + '...' : normalized;
  };

  // Function to toggle summary expansion
  const toggleSummaryExpansion = (jobId: string) => {
    setExpandedSummaries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  // Lead Search helper functions (from dashboard)
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

  const searchJobs = (keyword: string) => {
    setSearchTerm(keyword);
  };

  const fetchRecommendedJobs = async (keywords: string[]) => {
    if (!user || keywords.length === 0) return;

    try {
      const keywordQuery = keywords.map(keyword => `Title.ilike.%${keyword}%,Summary.ilike.%${keyword}%`).join(',');
      const { data, error } = await supabase
        .from('Allgigs_All_vacancies_NEW')
        .select('*')
        .or(keywordQuery)
        .limit(5);

      if (error) {
        console.error('Error fetching recommended jobs:', error);
        return;
      }

      setRecommendedJobs(data || []);
    } catch (error) {
      console.error('Exception in fetchRecommendedJobs:', error);
    }
  };

  // Function to highlight search terms in job text
  const highlightSearchTerms = (text: string, searchWords: string[]): string => {
    if (!searchWords || searchWords.length === 0) return normalizeText(text);

    const normalizedText = normalizeText(text);
    // Escape special regex characters and create case-insensitive regex
    const escapedWords = searchWords.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
    return normalizedText.replace(regex, '<span class="highlight">$1</span>');
  };

  // useEffect(() => {
  //   const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

  //   if (showMenu) {
  //     document.body.style.overflow = 'hidden';
  //     document.body.style.paddingRight = `${scrollbarWidth}px`; // Compenseer verschuiving
  //   } else {
  //     document.body.style.overflow = 'auto';
  //     document.body.style.paddingRight = '0px';
  //   }

  //   return () => {
  //     document.body.style.overflow = 'auto';
  //     document.body.style.paddingRight = '0px';
  //   };
  // }, [showMenu]);

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

          // Check if Lead Search section is out of view
          if (leadSearchSectionRef.current) {
            const rect = leadSearchSectionRef.current.getBoundingClientRect();
            // Add a small buffer to prevent rapid toggling
            const isLeadSearchVisible = rect.bottom > -50; // Section is visible if bottom is 50px above viewport top

            // Show sticky header when Lead Search section is completely out of view
            const shouldShowHeader = !isLeadSearchVisible;
            setShowStickyHeader(shouldShowHeader);

            // Only apply header visibility logic when sticky header is shown
            if (shouldShowHeader) {
              if (currentScrollY < 50) {
                setHeaderVisible(true);
              } else if (currentScrollY > lastScrollY.current) {
                setHeaderVisible(false); // scrolling down
              } else {
                setHeaderVisible(true); // scrolling up
              }
            } else {
              // Always show header when it should be visible (prevents flashing)
              setHeaderVisible(true);
            }
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
          {/* <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#4b5563' }}>Loading jobs...</div>
          <div style={{ color: '#6b7280', marginTop: '0.5rem' }}>Please wait while we fetch the latest opportunities</div> */}
        </div>
      </div>
    )

  if (needsProfile) {
    return <CompleteProfileForm onComplete={() => window.location.reload()} />;
  }

  // Log job click to Supabase
  // const logJobClick = async (job: Job) => {
  //   if (!user || !user.id) {
  //     console.error("[LogJobClick] User not available for logging job click. Aborting.");
  //     return;
  //   }
  //   console.log("[LogJobClick] Logging for user:", user.id, "Job ID:", job.UNIQUE_ID, "Title:", job.Title);
  //   try {
  //     const { error } = await supabase.from("job_clicks").insert([
  //       {
  //         user_id: user.id,
  //         job_id: job.UNIQUE_ID,
  //         job_title: job.Title,
  //         company: job.Company,
  //         location: job.Location,
  //         rate: job.rate,
  //         date_posted: job.date,
  //         summary: job.Summary,
  //         url: job.URL,
  //         // clicked_at should be handled by DB default
  //       },
  //     ]);
  //     if (error) {
  //       console.error("[LogJobClick] Error logging job click:", error);
  //     } else {
  //       console.log("[LogJobClick] Job click logged successfully for job:", job.UNIQUE_ID);
  //       // Refresh recently clicked jobs if the section is visible
  //       if (showRecentlyClicked) {
  //         console.log("[LogJobClick] Refreshing recently clicked jobs as section is visible.");
  //         fetchRecentlyClickedJobs();
  //       } else {
  //         console.log("[LogJobClick] Recently clicked jobs section not visible, not refreshing immediately. Will refresh when opened.");
  //       }
  //     }
  //   } catch (error) {
  //     console.error("[LogJobClick] Exception when logging job click:", error);
  //   }
  // };

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

      {/* Main Container with Glassmorphism Background */}
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
        {showStickyHeader && (
          <header style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '1.5rem 2rem',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            transform: headerVisible ? 'translateY(0)' : 'translateY(-100%)',
            transition: 'transform 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '1100px', margin: '0 auto' }}>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <img
                  src="/images/allGigs-logo-white.svg"
                  alt="AllGigs Logo"
                  style={{ height: "40px", transition: "opacity 0.3s" }}
                />
                Search Leads
              </h1>

              {/* Search Bar */}
              <div style={{ flex: 1, maxWidth: '500px', marginLeft: '2rem' }}>
                <input
                  placeholder="Search jobs and opportunities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    fontSize: '1rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(8px)',
                    color: '#fff',
                    boxSizing: 'border-box'
                  }}
                  className="search-input-placeholder"
                />
              </div>


            </div>
          </header>
        )}

        {/* Spacer for sticky header */}
        {showStickyHeader && (
          <div style={{ height: '100px' }}></div>
        )}

        {/* Main Content */}
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '6rem 2rem 2rem 2rem',
          position: 'relative',
          zIndex: 5
        }}>





          {/* Lead Search Section */}
          <div
            ref={leadSearchSectionRef}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '24px',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}>
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
                  <Sparkles style={{ width: '32px', height: '32px' }} />
                  Lead Search
                </h2>
                <p style={{
                  fontSize: '1.1rem',
                  opacity: 0.9,
                  margin: 0
                }}>
                  Find leads and opportunities across the platform
                </p>
              </div>
            </div>

            {/* Horizontal Rule */}
            <hr style={{
              border: 'none',
              height: '1px',
              background: 'rgba(255, 255, 255, 0.2)',
              margin: '1rem 0'
            }} />

            {/* Quick Search Section */}
            <div style={{
              padding: '0.5rem 1rem',
              marginBottom: '0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#fff',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <SearchCheck style={{ width: '18px', height: '18px' }} />
                  Quick Search
                </h3>
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
                    placeholder="New search term..."
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      backdropFilter: 'blur(8px)'
                    }}
                    className="search-input-placeholder"
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

            {/* Horizontal Rule */}
            <hr style={{
              border: 'none',
              height: '1px',
              background: 'rgba(255, 255, 255, 0.2)',
              margin: '1rem 0'
            }} />

            {/* Recommended Leads Section */}
            <div style={{
              padding: '0 1rem 1rem 1rem'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Sparkles style={{ width: '18px', height: '18px' }} />
                Recommended Leads
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recommendedJobs.map((job) => (
                  <div
                    key={job.UNIQUE_ID}
                    onClick={() => {
                      // logJobClick(job);
                      window.open(job.URL, '_blank', 'noopener,noreferrer');
                    }}
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
                    <h3 style={{ fontWeight: '600', color: '#fff', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>{job.Title}</h3>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {/* Company - Blue Balloon */}
                      {job.Company && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          background: 'rgba(59, 130, 246, 0.3)',
                          color: '#fff',
                          border: '1px solid rgba(59, 130, 246, 0.4)',
                          backdropFilter: 'blur(8px)'
                        }}>
                          <Building2 style={{ width: '14px', height: '14px', color: '#fff' }} />
                          {job.Company}
                        </div>
                      )}

                      {/* Location - Green Balloon */}
                      {job.Location && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          background: 'rgba(16, 185, 129, 0.3)',
                          color: '#fff',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          backdropFilter: 'blur(8px)'
                        }}>
                          <MapPin style={{ width: '14px', height: '14px', color: '#fff' }} />
                          {job.Location}
                        </div>
                      )}
                    </div>

                    {/* Rate - Purple Balloon */}
                    {job.rate && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        background: 'rgba(147, 51, 234, 0.3)',
                        color: '#fff',
                        border: '1px solid rgba(147, 51, 234, 0.4)',
                        backdropFilter: 'blur(8px)'
                      }}>
                        <Coins style={{ width: '14px', height: '14px', color: '#fff' }} />
                        {job.rate}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Job List Container */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '24px',
            padding: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <Search color="white" size={32} />
              <div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fff', margin: 0 }}>
                  Discover Your Next Opportunity
                </h3>
                <p style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
                  From <span style={{ fontWeight: '600', color: '#10b981' }}>{sortedJobs.length}</span> curated positions
                </p>
              </div>
            </div>

            {/* Search Field */}
            <div style={{ marginBottom: '1rem' }}>
              <input
                placeholder="Search leads and opportunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  fontSize: '1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(8px)',
                  color: '#fff',
                  boxSizing: 'border-box'
                }}
                className="search-input-placeholder"
              />
            </div>

            {/* Horizontal Rule */}
            <hr style={{
              border: 'none',
              height: '1px',
              background: 'rgba(255, 255, 255, 0.2)',
              margin: '1rem 0'
            }} />

            {/* Active Search Pills */}
            {debouncedSearchTerm && debouncedSearchTerm.trim() !== "" && (
              <div style={{
                marginBottom: '1rem',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)', marginRight: '0.5rem' }}>
                    Active search:
                  </span>
                  {debouncedSearchTerm.trim().toLowerCase().split(/\s+/).filter(word => word.length > 0).map((word, index) => (
                    <span
                      key={index}
                      style={{
                        background: 'rgba(16, 185, 129, 0.3)',
                        color: '#10b981',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Job Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(highlightedJobs.length > 0 ? highlightedJobs.slice((page ?? 0) * PAGE_SIZE, ((page ?? 0) + 1) * PAGE_SIZE) : paginatedJobs).map((job) => (
                <div
                  key={job.UNIQUE_ID}
                  onClick={() => {
                    // logJobClick(job);
                    window.open(job.URL, '_blank', 'noopener,noreferrer');
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <h3
                          style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: '#fff',
                            margin: 0
                          }}
                          dangerouslySetInnerHTML={{ __html: highlightSearchTerms(job.Title, debouncedSearchTerm.split(' ')) }}
                        />
                        {isJobNew(job) && (
                          <span style={{
                            backgroundColor: "#10b981",
                            color: "white",
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}>
                            New
                          </span>
                        )}
                        {(job.source === 'allGigs' || job.tags?.includes('allGigs')) && (
                          <span style={{
                            backgroundColor: "#4f46e5",
                            color: "white",
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}>
                            allGigs
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: '1.1rem',
                          color: 'rgba(255, 255, 255, 0.9)',
                          margin: '0 0 0.75rem 0',
                          fontWeight: '600'
                        }}
                        dangerouslySetInnerHTML={{ __html: highlightSearchTerms(job.Company, debouncedSearchTerm.split(' ')) }}
                      />
                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        {job.rate && job.rate.trim() !== '' && (
                          <span style={{
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#fff',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            border: '1px solid rgba(16, 185, 129, 0.3)'
                          }}>
                            {job.rate}
                          </span>
                        )}
                        {job.date && job.date.trim() !== '' && (
                          <span style={{
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: '#fff',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            border: '1px solid rgba(59, 130, 246, 0.3)'
                          }}>
                            {job.date}
                          </span>
                        )}
                        {job.Location && job.Location.trim() !== '' && (
                          <span
                            style={{
                              background: 'rgba(236, 72, 153, 0.2)',
                              color: '#fff',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              border: '1px solid rgba(236, 72, 153, 0.3)'
                            }}
                            dangerouslySetInnerHTML={{ __html: highlightSearchTerms(job.Location, debouncedSearchTerm.split(' ')) }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ margin: '0 0 1rem 0' }}>
                    <p
                      style={{
                        fontSize: '1rem',
                        color: 'rgba(255, 255, 255, 0.85)',
                        lineHeight: '1.6',
                        margin: '0',
                        fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                        letterSpacing: 'normal',
                        wordSpacing: 'normal'
                      }}
                      dangerouslySetInnerHTML={{
                        __html: highlightSearchTerms(
                          expandedSummaries.has(job.UNIQUE_ID) ? job.Summary : getTruncatedSummary(job.Summary),
                          debouncedSearchTerm.split(' ')
                        )
                      }}
                    />
                    {isSummaryLong(job.Summary) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent job card click
                          toggleSummaryExpansion(job.UNIQUE_ID);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#10b981',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          padding: '0.25rem 0',
                          marginTop: '0.5rem',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#34d399';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#10b981';
                        }}
                      >
                        {expandedSummaries.has(job.UNIQUE_ID) ? 'Read less' : 'Read more'}
                      </button>
                    )}
                  </div>

                  {/* Show poster information for allGigs jobs */}
                  {(job.source === 'allGigs' || job.tags?.includes('allGigs')) && job.added_by_email && (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '0.75rem',
                      marginBottom: '1rem'
                    }}>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)' }}>
                        Contact Information:
                      </p>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                        <strong>Name:</strong> {job.poster_name || 'Not provided'}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                        <strong>Email:</strong> {job.added_by_email}
                      </p>
                    </div>
                  )}


                </div>
              ))}
            </div>

            {/* Pagination */}
            {getPageNumbers().length > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '2rem',
                flexWrap: 'wrap'
              }}>
                {getPageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: page === pageNum ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                      border: page === pageNum ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(8px)',
                      fontWeight: page === pageNum ? '600' : '400'
                    }}
                  >
                    {pageNum + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Job Form Modal */}
        {showAddJobForm && user && (
          <AddJobForm
            onClose={() => setShowAddJobForm(false)}
            onJobAdded={() => {
              console.log("Job toegevoegd");
            }}
            user={user}
          />
        )}
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-180deg); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(90deg); }
        }
        
        /* Search highlighting */
        .highlight {
          background: rgba(255, 255, 0, 0.3);
          color: #fff;
          border-radius: 4px;
          font-weight: 600;
        }
        
        /* Search input placeholder styling */
        .search-input-placeholder::placeholder {
          color: rgba(255, 255, 255, 0.6);
          opacity: 1;
        }
        
        /* Hide scrollbar for better aesthetics */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </>
  );
}

// function AvailableToRecruitersToggle() {
//   const [available, setAvailable] = useState(true);
//   return (
//     <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, marginTop: 8 }}>
//       <label style={{ minWidth: 140, fontWeight: 600, color: '#374151', fontSize: '0.98rem', marginRight: 12 }}>
//         Available to Recruiters
//       </label>
//       <span style={{ marginRight: 8, color: available ? '#0ccf83' : '#aaa', fontWeight: available ? 700 : 400 }}>Yes</span>
//       <div
//         onClick={() => setAvailable(a => !a)}
//         style={{
//           width: 44,
//           height: 24,
//           borderRadius: 12,
//           background: available ? '#0ccf83' : '#ccc',
//           cursor: 'pointer',
//           position: 'relative',
//           margin: '0 8px',
//           transition: 'background 0.2s',
//           display: 'inline-block',
//         }}
//         aria-label="Toggle Available to Recruiters"
//       >
//         <div
//           style={{
//             width: 20,
//             height: 20,
//             borderRadius: '50%',
//             background: '#fff',
//             position: 'absolute',
//             top: 2,
//             left: available ? 22 : 2,
//             boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
//             transition: 'left 0.2s',
//           }}
//         />
//       </div>
//     </div>
//   );
// }
