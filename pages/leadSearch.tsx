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
import { Search, SearchCheck, Edit2, Plus, X, Building2, MapPin, Layers2, ChevronDown, Globe, Lock } from "lucide-react";


interface Job {
  UNIQUE_ID: string
  Title: string
  Company: string
  Location: string
  rate: string
  date: string
  Summary: string // Fixed: was "stringx"
  URL: string
  group_id?: string // Added for job stacking functionality
  created_at?: string // Add optional timestamp field
  inserted_at?: string // Alternative timestamp field name
  added_by?: string // User ID who added the job
  added_by_email?: string // Email of user who added the job
  poster_name?: string // Name of the person who posted the job
  source?: string // Source of the job (e.g., 'allGigs')
  tags?: string // Tags for the job
  clicked_at?: string; // Added to store when the job was clicked by the user
  Dutch?: boolean; // Regional filter: Dutch jobs
  EU?: boolean; // Regional filter: EU jobs
  Rest_of_World?: boolean; // Regional filter: Rest of World jobs
  // Display fields for highlighting (not stored in database)
  displayTitle?: string
  displayCompany?: string
  displayLocation?: string
  displaySummary?: string
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
  const [keywords, setKeywords] = useState<string[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  console.log(recommendedJobs, "recommendedJobs - build fix");
  // State to track if sticky header should be visible
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const leadSearchSectionRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [locationSearchTerm, setLocationSearchTerm] = useState('');
  const [linkedinFeedEnabled, setLinkedinFeedEnabled] = useState(false);
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

  // Load keywords from profile when user is available
  useEffect(() => {
    if (user) {
      loadKeywords();
    }
  }, [user]);

  // Debounce search term to improve performance
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2 || searchTerm.length === 0) {
        setDebouncedSearchTerm(searchTerm);
      }
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
        console.log('First job sample for debugging:', data?.[0]);
        console.log('Total jobs fetched:', data?.length);
        setAllJobs(data || []);
      }
      setLoading(false);
    }
    fetchJobs();
  }, [user]);

  // Initialize filters when allJobs change
  useEffect(() => {
    if (allJobs.length > 0) {
      // Extract unique companies and locations
      const companies = new Set(allJobs.map(job => job.Company).filter(company => company && company.trim() !== ''));
      const locations = new Set(allJobs.map(job => job.Location).filter(location => location && location.trim() !== ''));

      // Initialize with all companies and locations selected
      setSelectedCompanies(companies);
      setSelectedLocations(locations);

      // Initialize regions with Dutch and EU selected, Rest_of_World deselected
      setSelectedRegions(new Set(['Dutch', 'EU']));
    }
  }, [allJobs]);

  // Filter functions
  const getUniqueCompanies = useMemo(() => {
    return Array.from(new Set(allJobs.map(job => job.Company).filter(company => company && company.trim() !== ''))).sort();
  }, [allJobs]);

  const getUniqueLocations = useMemo(() => {
    return Array.from(new Set(allJobs.map(job => job.Location).filter(location => location && location.trim() !== ''))).sort();
  }, [allJobs]);

  const toggleCompany = (company: string) => {
    const newSelected = new Set(selectedCompanies);
    if (newSelected.has(company)) {
      newSelected.delete(company);
    } else {
      newSelected.add(company);
    }
    setSelectedCompanies(newSelected);
  };

  const toggleLocation = (location: string) => {
    const newSelected = new Set(selectedLocations);
    if (newSelected.has(location)) {
      newSelected.delete(location);
    } else {
      newSelected.add(location);
    }
    setSelectedLocations(newSelected);
  };

  const toggleRegion = (region: string) => {
    const newSelected = new Set(selectedRegions);
    if (newSelected.has(region)) {
      newSelected.delete(region);
      console.log(`Removed ${region} from selection. New selection:`, Array.from(newSelected));
    } else {
      newSelected.add(region);
      console.log(`Added ${region} to selection. New selection:`, Array.from(newSelected));
    }
    setSelectedRegions(newSelected);
  };

  const selectAllCompanies = () => {
    setSelectedCompanies(new Set(getUniqueCompanies));
  };

  const deselectAllCompanies = () => {
    setSelectedCompanies(new Set());
  };

  const selectAllLocations = () => {
    setSelectedLocations(new Set(getUniqueLocations));
  };

  const deselectAllLocations = () => {
    setSelectedLocations(new Set());
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-filter-dropdown]')) {
        setShowCompanyDropdown(false);
        setShowLocationDropdown(false);
        setShowRegionDropdown(false);
      }
    };

    if (showCompanyDropdown || showLocationDropdown || showRegionDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }

    // Always return a cleanup function, even if empty
    return () => { };
  }, [showCompanyDropdown, showLocationDropdown, showRegionDropdown]);

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

    // 2. Filter by selected companies
    if (selectedCompanies.size > 0) {
      filtered = filtered.filter(job => selectedCompanies.has(job.Company));
    }

    // 3. Filter by selected locations
    if (selectedLocations.size > 0) {
      filtered = filtered.filter(job => selectedLocations.has(job.Location));
    }

    // 4. Filter by selected regions (using boolean fields from Supabase)
    if (selectedRegions.size > 0 && selectedRegions.size < 3) {
      console.log('Region filtering active. Selected regions:', Array.from(selectedRegions));
      console.log('Sample job for region debugging:', filtered[0]);
      const beforeCount = filtered.length;
      filtered = filtered.filter(job => {
        let matchesRegion = false;
        if (selectedRegions.has('Dutch') && job.Dutch) matchesRegion = true;
        if (selectedRegions.has('EU') && job.EU) matchesRegion = true;
        if (selectedRegions.has('Rest_of_World') && job.Rest_of_World) matchesRegion = true;
        return matchesRegion;
      });
      console.log(`Region filter: ${beforeCount} -> ${filtered.length} jobs`);
    } else {
      console.log('No region filtering applied (all regions selected or none)');
    }
    // If all 3 regions are selected or selectedRegions is empty, show all jobs

    return filtered;
  }, [allJobs, debouncedSearchTerm, selectedCompanies, selectedLocations, selectedRegions]);

  // Sort filtered jobs by Fuse.js search results or by newest first
  const sortedJobs = useMemo(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.trim() !== "") {
      const results = fuse.search(debouncedSearchTerm);
      return results.map(result => result.item);
    }
    // Return filtered jobs when no search term (so filters still work)
    return filteredJobs;
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

  // Function to group jobs by group_id for stacking
  const groupJobsByGroupId = (jobs: Job[]) => {
    const grouped: { [key: string]: Job[] } = {};
    const ungrouped: Job[] = [];

    jobs.forEach(job => {
      if (job.group_id) {
        if (!grouped[job.group_id]) {
          grouped[job.group_id] = [];
        }
        grouped[job.group_id]!.push(job);
      } else {
        ungrouped.push(job);
      }
    });

    // Convert grouped jobs to a flat array with primary job + stacked jobs
    const result: { primaryJob: Job; stackedJobs: Job[] }[] = [];

    // Add grouped jobs (with stacks)
    Object.values(grouped).forEach(jobGroup => {
      if (jobGroup && jobGroup.length > 1) {
        // Sort by date (newest first) or by insertion order
        const sortedGroup = [...jobGroup].sort((a, b) => {
          const aDate = new Date(a.created_at || a.inserted_at || 0).getTime();
          const bDate = new Date(b.created_at || b.inserted_at || 0).getTime();
          return bDate - aDate;
        });
        const primaryJob = sortedGroup[0];
        if (primaryJob) {
          result.push({
            primaryJob,
            stackedJobs: sortedGroup.slice(1)
          });
        }
      } else if (jobGroup && jobGroup.length === 1) {
        // Single job in group, treat as normal
        const primaryJob = jobGroup[0];
        if (primaryJob) {
          result.push({
            primaryJob,
            stackedJobs: []
          });
        }
      }
    });

    // Add ungrouped jobs
    ungrouped.forEach(job => {
      result.push({
        primaryJob: job,
        stackedJobs: []
      });
    });

    return result;
  };

  const paginatedJobs = useMemo(() => {
    return sortedJobs.slice((page ?? 0) * PAGE_SIZE, ((page ?? 0) + 1) * PAGE_SIZE);
  }, [sortedJobs, page]);

  // Group jobs for stacking display
  const groupedJobs = useMemo(() => {
    const jobsToGroup = highlightedJobs.length > 0
      ? highlightedJobs.slice((page ?? 0) * PAGE_SIZE, ((page ?? 0) + 1) * PAGE_SIZE)
      : paginatedJobs;
    return groupJobsByGroupId(jobsToGroup);
  }, [highlightedJobs, paginatedJobs, page]);

  // Helper function to check if a job is new (within 3 hours)
  const isJobNew = (job: Job): boolean => {
    const timestamp = job.created_at || job.inserted_at;
    if (!timestamp) return false;

    const jobTime = new Date(timestamp);
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - (3 * 60 * 60 * 1000)); // 3 hours in milliseconds

    return jobTime > threeHoursAgo;
  };

  // Log job click to Supabase
  const logJobClick = async (job: Job) => {
    if (!user || !user.id) {
      console.error("[LogJobClick] User not available for logging job click. Aborting.");
      return;
    }
    console.log("[LogJobClick] Logging for user:", user.id, "Job ID:", job.UNIQUE_ID);
    console.log("[LogJobClick] Job object:", {
      UNIQUE_ID: job.UNIQUE_ID,
      Title: job.Title,
      displayTitle: job.displayTitle,
      Company: job.Company,
      displayCompany: job.displayCompany
    });
    try {
      const { error } = await supabase.from("applying").insert([
        {
          applying_id: crypto.randomUUID(),
          user_id: user.id,
          unique_id_job: job.UNIQUE_ID, // Only store the ID
          applied: false, // This puts it in the Found column
          created_at: new Date().toISOString(),
        },
      ]);
      if (error) {
        console.error("[LogJobClick] Error logging job click:", error);
      } else {
        console.log("[LogJobClick] Job click logged successfully for job:", job.UNIQUE_ID);
      }
    } catch (error) {
      console.error("[LogJobClick] Exception when logging job click:", error);
    }
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

  // Helper function to check if a value is different from primary job
  const isDifferentFromPrimary = (primaryValue: string, stackedValue: string): boolean => {
    return primaryValue.toLowerCase().trim() !== stackedValue.toLowerCase().trim();
  };

  // Load keywords from profile
  const loadKeywords = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('quicksearch')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading keywords:', error);
        return;
      }

      setKeywords(data?.quicksearch || []);
    } catch (error) {
      console.error('Exception loading keywords:', error);
    }
  };

  // Save keywords to profile
  const saveKeywords = async (newKeywords: string[]) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ quicksearch: newKeywords })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving keywords:', error);
        return;
      }

      setKeywords(newKeywords);
    } catch (error) {
      console.error('Exception saving keywords:', error);
    }
  };

  // Lead Search helper functions (from dashboard)
  const handleKeywordAdd = async () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      const newKeywords = [...keywords, newKeyword.trim()];
      await saveKeywords(newKeywords);
      setNewKeyword('');
    }
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleKeywordAdd();
    }
  };

  const removeKeyword = async (index: number) => {
    const newKeywords = keywords.filter((_, i) => i !== index);
    await saveKeywords(newKeywords);
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

    // Filter out empty strings and whitespace-only strings
    const validSearchWords = searchWords.filter(word => word && word.trim().length > 0);
    if (validSearchWords.length === 0) return normalizeText(text);

    const normalizedText = normalizeText(text);
    // Escape special regex characters and create case-insensitive regex
    const escapedWords = validSearchWords.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
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
        // Create display versions with highlighting, but keep original data intact
        displayTitle: highlightSearchTerms(job.Title, searchWords),
        displaySummary: highlightSearchTerms(job.Summary, searchWords),
        displayCompany: highlightSearchTerms(job.Company, searchWords),
        displayLocation: highlightSearchTerms(job.Location, searchWords),
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
        // background: `
        //   radial-gradient(ellipse at top left, rgba(139, 69, 189, 0.15) 0%, transparent 50%), 
        //   radial-gradient(ellipse at bottom right, rgba(59, 130, 246, 0.15) 0%, transparent 50%), 
        //   linear-gradient(135deg, #1a0b2e 0%, #16213e 25%, #0f3460 50%, #16213e 75%, #1a0b2e 100%)
        // `,
        background: 'black',
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
                  {debouncedSearchTerm && debouncedSearchTerm.trim() !== "" ? (
                    <>From <span style={{ fontWeight: '600', color: '#10b981' }}>{sortedJobs.length}</span> curated positions</>
                  ) : (
                    <></>
                  )}
                </p>
              </div>
            </div>

            {/* Filters Section */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '1.5rem',
              flexWrap: 'wrap'
            }}>
              {/* Company Filter */}
              <div style={{ position: 'relative', minWidth: '300px' }} data-filter-dropdown>
                <button
                  onClick={() => {
                    setShowCompanyDropdown(!showCompanyDropdown);
                    setShowLocationDropdown(false);
                    setShowRegionDropdown(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 style={{ width: '16px', height: '16px' }} />
                    Companies ( {selectedCompanies.size} / {getUniqueCompanies.length} )
                  </span>
                  <ChevronDown style={{
                    width: '16px',
                    height: '16px',
                    transform: showCompanyDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }} />
                </button>

                {showCompanyDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '0.5rem',
                    background: 'rgba(114, 111, 135, 1)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '1rem',
                    zIndex: 1000,
                    maxHeight: '300px',
                    overflowY: 'auto',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                  }}>
                    {/* Search within companies */}
                    <input
                      type="text"
                      placeholder="Search companies..."
                      value={companySearchTerm}
                      onChange={(e) => setCompanySearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        marginBottom: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box'
                      }}
                      className="search-input-placeholder"
                    />

                    {/* Select All / Deselect All */}
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                      paddingBottom: '0.75rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <button
                        onClick={selectAllCompanies}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          background: 'rgba(16, 185, 129, 0.2)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Select All
                      </button>
                      <button
                        onClick={deselectAllCompanies}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Deselect All
                      </button>
                    </div>

                    {/* Company List */}
                    {getUniqueCompanies
                      .filter(company =>
                        company.toLowerCase().includes(companySearchTerm.toLowerCase())
                      )
                      .map(company => (
                        <label
                          key={company}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            transition: 'background 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedCompanies.has(company)}
                            onChange={() => toggleCompany(company)}
                            style={{
                              width: '16px',
                              height: '16px',
                              accentColor: '#10b981'
                            }}
                          />
                          <span style={{
                            color: '#fff',
                            fontSize: '0.875rem',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {company}
                          </span>
                        </label>
                      ))
                    }
                  </div>
                )}
              </div>

              {/* Location Filter */}
              <div style={{ position: 'relative', minWidth: '300px' }} data-filter-dropdown>
                <button
                  onClick={() => {
                    setShowLocationDropdown(!showLocationDropdown);
                    setShowCompanyDropdown(false);
                    setShowRegionDropdown(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin style={{ width: '16px', height: '16px' }} />
                    Locations ( {selectedLocations.size} / {getUniqueLocations.length} )
                  </span>
                  <ChevronDown style={{
                    width: '16px',
                    height: '16px',
                    transform: showLocationDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }} />
                </button>

                {showLocationDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '0.5rem',
                    background: 'rgba(114, 111, 135, 1)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '1rem',
                    zIndex: 1000,
                    maxHeight: '300px',
                    overflowY: 'auto',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                  }}>
                    {/* Search within locations */}
                    <input
                      type="text"
                      placeholder="Search locations..."
                      value={locationSearchTerm}
                      onChange={(e) => setLocationSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        marginBottom: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box'
                      }}
                      className="search-input-placeholder"
                    />

                    {/* Select All / Deselect All */}
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                      paddingBottom: '0.75rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <button
                        onClick={selectAllLocations}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          background: 'rgba(16, 185, 129, 0.2)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Select All
                      </button>
                      <button
                        onClick={deselectAllLocations}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Deselect All
                      </button>
                    </div>

                    {/* Location List */}
                    {getUniqueLocations
                      .filter(location =>
                        location.toLowerCase().includes(locationSearchTerm.toLowerCase())
                      )
                      .map(location => (
                        <label
                          key={location}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            transition: 'background 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedLocations.has(location)}
                            onChange={() => toggleLocation(location)}
                            style={{
                              width: '16px',
                              height: '16px',
                              accentColor: '#10b981'
                            }}
                          />
                          <span style={{
                            color: '#fff',
                            fontSize: '0.875rem',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {location}
                          </span>
                        </label>
                      ))
                    }
                  </div>
                )}
              </div>

              {/* Region Filter */}
              <div style={{ position: 'relative', minWidth: '300px' }} data-filter-dropdown>
                <button
                  onClick={() => {
                    setShowRegionDropdown(!showRegionDropdown);
                    setShowCompanyDropdown(false);
                    setShowLocationDropdown(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Globe style={{ width: '16px', height: '16px' }} />
                    Regions ( {selectedRegions.size} / 3 )
                  </span>
                  <ChevronDown style={{
                    width: '16px',
                    height: '16px',
                    transform: showRegionDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }} />
                </button>

                {showRegionDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '0.5rem',
                    background: 'rgba(114, 111, 135, 1)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '1rem',
                    zIndex: 1000,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                  }}>
                    {/* Region List */}
                    {['Dutch', 'EU', 'Rest_of_World'].map(region => (
                      <label
                        key={region}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRegions.has(region)}
                          onChange={() => toggleRegion(region)}
                          style={{
                            width: '16px',
                            height: '16px',
                            accentColor: '#10b981'
                          }}
                        />
                        <span style={{
                          color: '#fff',
                          fontSize: '0.875rem',
                          flex: 1
                        }}>
                          {region === 'Rest_of_World' ? 'Rest of World' : region}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* LinkedIn Feed Filter */}
              <div style={{ position: 'relative', minWidth: '200px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: 0.7
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    // Premium feature - show tooltip or modal in future
                    console.log('LinkedIn Feed is a premium feature');
                    // Keep state ready for future implementation
                    setLinkedinFeedEnabled(prev => !prev);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={linkedinFeedEnabled}
                    onChange={() => { }} // Disabled for now
                    disabled
                    style={{
                      width: '16px',
                      height: '16px',
                      accentColor: '#0077b5',
                      opacity: 0.5
                    }}
                  />
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    LinkedIn Feed
                    <Lock
                      style={{
                        width: '14px',
                        height: '14px',
                        color: 'rgba(255, 255, 255, 0.6)'
                      }}
                    />
                  </span>
                </label>
              </div>
            </div>

            {/* Quick Search Section */}
            <div style={{
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              marginBottom: '1rem'
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
                {keywords.length === 0 ? 'Press edit to add a quicksearch button' : 'Click to quicksearch jobs'}
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

            {/* Search Field */}
            <div style={{ marginBottom: '1rem' }}>
              <input
                placeholder="Enter at least 2 characters to search for leads and opportunities..."
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
              {groupedJobs.map(({ primaryJob: job, stackedJobs }) => (
                <div
                  key={job.UNIQUE_ID}
                  style={{ position: 'relative', marginBottom: stackedJobs.length > 0 ? `${(stackedJobs.length - 1) * 60 + 80}px` : '0' }}
                >
                  {/* Main Job Card */}
                  <div
                    onClick={() => {
                      logJobClick(job);
                      window.open(job.URL, '_blank', 'noopener,noreferrer');
                    }}
                    style={{
                      position: 'relative',
                      zIndex: 1,
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
                            dangerouslySetInnerHTML={{ __html: job.displayTitle || highlightSearchTerms(job.Title, debouncedSearchTerm.split(' ')) }}
                          />
                          {stackedJobs.length > 0 && (
                            <div style={{
                              position: 'absolute',
                              top: '1rem',
                              right: '1rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: 'rgba(255, 255, 255, 0.7)',
                              fontSize: '0.875rem',
                              fontWeight: '500'
                            }}>
                              <Layers2 style={{ width: '16px', height: '16px' }} />
                              +{stackedJobs.length}
                            </div>
                          )}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <p
                            style={{
                              fontSize: '1.1rem',
                              color: 'rgba(255, 255, 255, 0.9)',
                              margin: '0',
                              fontWeight: '600'
                            }}
                            dangerouslySetInnerHTML={{ __html: job.displayCompany || highlightSearchTerms(job.Company, debouncedSearchTerm.split(' ')) }}
                          />
                          {job.source && (
                            <span style={{
                              background: 'rgba(147, 51, 234, 0.2)',
                              color: '#fff',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              border: '1px solid rgba(147, 51, 234, 0.3)'
                            }}>
                              {job.source}
                            </span>
                          )}
                        </div>
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

                  {/* Stacked Jobs - After Main Card */}
                  {stackedJobs.length > 0 && stackedJobs.map((stackedJob, index) => (
                    <div
                      key={stackedJob.UNIQUE_ID}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(stackedJob.URL, '_blank', 'noopener,noreferrer');
                      }}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        marginTop: `${index * 60}px`,
                        left: '4px',
                        right: '4px',
                        zIndex: 1,
                        background: `linear-gradient(to bottom, 
                          transparent 0%, 
                          transparent 5%, 
                          rgba(255, 255, 255, 0.1) 70%, 
                          rgba(255, 255, 255, 0.15) 100%)`,
                        borderLeft: '1px solid transparent',
                        borderRight: '1px solid transparent',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '0 0 16px 16px',
                        padding: '1rem 1.25rem 0rem 1.25rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minHeight: 'auto',
                        overflow: 'visible'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `linear-gradient(to bottom, 
                          rgba(255, 255, 255, 0.05) 0%, 
                          rgba(255, 255, 255, 0.08) 10%, 
                          rgba(255, 255, 255, 0.15) 30%, 
                          rgba(255, 255, 255, 0.2) 100%)`;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
                        e.currentTarget.style.zIndex = '10';
                        e.currentTarget.style.borderBottom = '1px solid rgba(255, 255, 255, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = `linear-gradient(to bottom, 
                          transparent 0%, 
                          transparent 5%, 
                          rgba(255, 255, 255, 0.1) 50%, 
                          rgba(255, 255, 255, 0.15) 100%)`;
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.zIndex = '1';
                        e.currentTarget.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
                      }}
                    >
                      {/* Duplicate indicator */}
                      <div style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        <Layers2 style={{ width: '14px', height: '14px' }} />
                        Possibly a duplicate
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h4 style={{
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          color: '#fff',
                          margin: 0,
                          flex: 1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                          dangerouslySetInnerHTML={{ __html: highlightSearchTerms(stackedJob.Title, debouncedSearchTerm.split(' ')) }}
                        />
                        {isJobNew(stackedJob) && (
                          <span style={{
                            backgroundColor: "#10b981",
                            color: "white",
                            fontSize: "0.6rem",
                            fontWeight: "bold",
                            padding: "1px 4px",
                            borderRadius: "6px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginLeft: '0.5rem'
                          }}>
                            New
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <p style={{
                            fontSize: '0.8rem',
                            color: 'rgba(255, 255, 255, 0.8)',
                            margin: '0',
                            fontWeight: '500',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            minWidth: 'fit-content'
                          }}
                            dangerouslySetInnerHTML={{ __html: highlightSearchTerms(stackedJob.Company, debouncedSearchTerm.split(' ')) }}
                          />
                          {stackedJob.source && (
                            <span style={{
                              background: 'rgba(147, 51, 234, 0.2)',
                              color: '#fff',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '6px',
                              fontSize: '0.6rem',
                              fontWeight: '600',
                              border: '1px solid rgba(147, 51, 234, 0.3)'
                            }}>
                              {stackedJob.source}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {stackedJob.rate && stackedJob.rate.trim() !== '' && isDifferentFromPrimary(job.rate, stackedJob.rate) && (
                            <span style={{
                              background: 'rgba(16, 185, 129, 0.2)',
                              color: '#fff',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '6px',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}>
                              {stackedJob.rate}
                            </span>
                          )}

                          {stackedJob.Location && stackedJob.Location.trim() !== '' && isDifferentFromPrimary(job.Location, stackedJob.Location) && (
                            <span style={{
                              background: 'rgba(236, 72, 153, 0.2)',
                              color: '#fff',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '6px',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              border: '1px solid rgba(236, 72, 153, 0.3)'
                            }}
                              dangerouslySetInnerHTML={{ __html: highlightSearchTerms(stackedJob.Location, debouncedSearchTerm.split(' ')) }}
                            />
                          )}

                          {stackedJob.date && stackedJob.date.trim() !== '' && (
                            <span style={{
                              background: 'rgba(59, 130, 246, 0.2)',
                              color: '#fff',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '6px',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              border: '1px solid rgba(59, 130, 246, 0.3)'
                            }}>
                              {stackedJob.date}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {
              getPageNumbers().length > 1 && (
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
              )
            }
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
