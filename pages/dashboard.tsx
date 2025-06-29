import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, Plus, Trash2, Upload, Sparkles, SearchCheck, MousePointerClick, Users, TrendingUp, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// import RecentlyClickedJobs from '../components/ui/RecentlyClickedJobs';
import { supabase } from '../SupabaseClient';
import { useRouter } from 'next/router';
import AddJobForm from '../components/ui/add-job-form';


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




  return (
    <div style={{
      minHeight: '100vh',
      background: '#121f36',
      fontFamily: "'Montserrat', Arial, sans-serif",
      color: '#222'
    }}>
      {/* Header */}
      <header style={{
        background: '#1a2b47',
        borderBottom: '1px solid #2a3b57',
        padding: '1.5rem 2rem'
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
              backgroundColor: '#ef4444',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s ease-in-out',
              display: 'flex',
              marginLeft: 'auto'
            }}
          >
            Log out
          </button>

        </div>

      </header>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>


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



        {/* Availability Toggle */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #e5e7eb',
            padding: '1rem'
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
                  width: '48px',
                  height: '24px',
                  borderRadius: '12px',
                  background: isAvailable ? '#0ccf83' : '#ccc',
                  transition: 'all 0.2s'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    background: 'white',
                    borderRadius: '50%',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    transform: isAvailable ? 'translateX(26px)' : 'translateX(2px)',
                    transition: 'transform 0.2s',
                    marginTop: '2px'
                  }} />
                </div>
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: '600', color: '#000' }}>
                Available to recruiters
              </span>
              <span style={{
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                fontSize: '0.875rem',
                fontWeight: '600',
                background: isAvailable ? '#dcfce7' : '#f3f4f6',
                color: isAvailable ? '#166534' : '#666'
              }}>
                {isAvailable ? 'Active' : 'No data is visible for recruiters'}
              </span>
            </label>
          </div>
        </div>
        {/* Recently Clicked Jobs Card */}
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid #e5e7eb',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#000',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <MousePointerClick style={{ width: '20px', height: '20px' }} />
            Manage Jobs
          </h2>

          {loadingRecentlyClicked ? (
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Loading...</p>
          ) : recentlyClickedJobs.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>No recently clicked jobs</p>
          ) : (
            <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
              <table style={{ minWidth: '600px', width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', color: '#374151' }}>Title</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', color: '#374151' }}>Company</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', color: '#374151' }}>Location</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', color: '#374151' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentlyClickedJobs.map((job) => (
                    <tr
                      key={job.UNIQUE_ID}
                      style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                      onClick={() => logJobClick(job)}
                    >
                      <td style={{ padding: '0.75rem', fontWeight: 500, color: '#111827' }}>{job.Title}</td>
                      <td style={{ padding: '0.75rem', color: '#374151' }}>{job.Company}</td>
                      <td style={{ padding: '0.75rem', color: '#374151' }}>{job.Location}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>{job.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recommended Jobs */}
        <div style={{
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
            <Sparkles style={{ width: '20px', height: '20px' }} />
            Recommended gigs
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recommendedJobs.map((job) => (
              <div
                key={job.UNIQUE_ID}
                style={{
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
                  e.currentTarget.style.borderColor = '#0ccf83';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <h3 style={{ fontWeight: '600', color: '#000', margin: '0 0 0.25rem 0', fontSize: '1rem' }}>{job.Title}</h3>
                <p style={{ color: '#666', margin: '0 0 0.25rem 0', fontSize: '0.875rem' }}>{job.Company} • {job.Location}</p>
                {job.rate && (
                  <p style={{ color: '#0ccf83', fontWeight: '600', margin: 0, fontSize: '0.875rem' }}>{job.rate}</p>
                )}
              </div>
            ))}
          </div>

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
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #e5e7eb',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#000', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                  background: '#0ccf83',
                  color: '#000',
                  borderRadius: '999px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <Edit2 style={{ width: '16px', height: '16px' }} />
                {editKeywords ? 'Done' : 'Edit'}
              </button>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#666', margin: '0.5rem 0 0.5rem 0' }}>
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
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #e5e7eb',
            padding: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <TrendingUp style={{ width: '20px', height: '20px' }} />
              Statistics
            </h2>

            <div style={{ height: '192px' }}>
              {/* @ts-ignore */}
              <ResponsiveContainer width="100%" height="100%">
                {/* @ts-ignore */}
                <LineChart data={statsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  {/* @ts-ignore */}
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  {/* @ts-ignore */}
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  {/* @ts-ignore */}
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              marginTop: '0.5rem'
            }}>
              Total this week: {statsData.reduce((acc, day) => acc + day.views, 0)} clicked jobs
            </p>
          </div>





          {/* Documents Card */}
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #e5e7eb',
            padding: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#000', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px'
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '600', color: '#000', margin: '0 0 0.25rem 0', fontSize: '0.875rem' }}>{doc.name}</p>
                    <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>{doc.type} • {doc.size}</p>
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
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #e5e7eb',
            padding: '2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#dcfce7',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <Plus style={{ width: '24px', height: '24px', color: '#166534' }} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#000', marginBottom: '0.5rem' }}>Post a Job</h2>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Add an interesting job that you found
            </p>
            <button
              onClick={() => setShowAddJobForm(true)}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#0ccf83',
                color: '#000',
                borderRadius: '999px',
                border: 'none',
                fontWeight: '600',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Submit new job
            </button>
          </div>


          {/* Drag & Drop Upload */}
          <div
            style={{
              border: '2px dashed #ccc',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              transition: 'border-color 0.3s',
              marginTop: '1rem'
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = '#0ccf83';
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = '#ccc';
            }}
            onDrop={(e) => {
              e.preventDefault();
              alert('Bestanden geüpload (mock)');
            }}
          >
            <Upload style={{ width: '32px', height: '32px', color: '#999', marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.875rem', color: '#666', margin: '0.25rem 0' }}>
              Drag your files or <span style={{ color: '#0ccf83', fontWeight: '600', cursor: 'pointer' }}>browse files</span>
            </p>
            <p style={{ fontSize: '0.75rem', color: '#999' }}>Max 10MB per file</p>
          </div>

        </div>


        {/* Profile Card */}
        {isAvailable && (
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #e5e7eb',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#000', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                    background: '#0ccf83',
                    color: '#000',
                    borderRadius: '999px',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer'
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
                      background: '#0ccf83',
                      color: '#000',
                      borderRadius: '999px',
                      border: 'none',
                      fontWeight: '600',
                      cursor: 'pointer'
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
                      background: '#f3f4f6',
                      color: '#666',
                      borderRadius: '999px',
                      border: 'none',
                      fontWeight: '600',
                      cursor: 'pointer'
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
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#666', marginBottom: '0.25rem' }}>First name</label>
                    <input
                      type="text"
                      value={editedProfile.firstName}
                      onChange={(e) => setEditedProfile({ ...editedProfile, firstName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#666', marginBottom: '0.25rem' }}>Last name</label>
                    <input
                      type="text"
                      value={editedProfile.lastName}
                      onChange={(e) => setEditedProfile({ ...editedProfile, lastName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#666', marginBottom: '0.25rem' }}>Location</label>
                    <input
                      type="location"
                      value={editedProfile.location}
                      onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#666', marginBottom: '0.25rem' }}>Job title</label>
                    <input
                      type="jobtitle"
                      value={editedProfile.job_title}
                      onChange={(e) => setEditedProfile({ ...editedProfile, job_title: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#666', marginBottom: '0.25rem' }}>LinkedIn</label>
                    <input
                      type="url"
                      value={editedProfile.linkedIn}
                      onChange={(e) => setEditedProfile({ ...editedProfile, linkedIn: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span style={{ fontSize: '0.875rem', color: '#666' }}>Name</span>
                    <p style={{ fontWeight: '600', margin: '0.25rem 0 0 0', color: '#000' }}>{profile.firstName} {profile.lastName}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.875rem', color: '#666' }}>Location</span>
                    <p style={{ fontWeight: '600', margin: '0.25rem 0 0 0', color: '#000' }}>{profile.location}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.875rem', color: '#666' }}>Job title</span>
                    <p style={{ fontWeight: '600', margin: '0.25rem 0 0 0', color: '#000' }}>{profile.job_title}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.875rem', color: '#666' }}>LinkedIn</span>
                    <a href={profile.linkedIn} style={{ fontWeight: '600', color: '#0ccf83', textDecoration: 'none', display: 'block', marginTop: '0.25rem' }} target="_blank" rel="noopener noreferrer">
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