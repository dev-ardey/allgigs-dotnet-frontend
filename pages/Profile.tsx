import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, Users, DollarSign, Bell } from 'lucide-react';
import { supabase } from '../SupabaseClient';
import GlobalNav from '../components/ui/GlobalNav';

// Profile Interface (from dashboard)
interface Profile {
  firstName: string;
  lastName: string;
  job_title: string;
  location: string;
  linkedIn?: string;
  industry: string;
  linkedin_URL: string;
  isAvailableForWork?: boolean;
  hourlyRate?: number;
  age?: number;
  lastYearEarnings?: number;
  gender?: string;
  interests?: string;
  mainProblem?: string;
}

export default function Profile() {
  // State variables (from dashboard)
  const [user, setUser] = useState<any>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const emptyProfile: Profile = {
    firstName: '',
    lastName: '',
    job_title: '',
    location: '',
    linkedIn: '',
    industry: '',
    linkedin_URL: '',
    isAvailableForWork: true,
    hourlyRate: 75,
    age: 30,
    lastYearEarnings: 75000,
    gender: 'Prefer not to say',
    interests: 'Technology, Innovation, Problem Solving',
    mainProblem: 'Finding the right opportunities',
  };
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [editedProfile, setEditedProfile] = useState<Profile>(emptyProfile);
  const [editMode, setEditMode] = useState(false);

  // Mail notification settings (from dashboard)
  const [mailNotifications, setMailNotifications] = useState({
    leadNotifications: true,
    followUpReminders: true,
    weeklyDigest: true,
    applicationStatusUpdates: true,
    interviewReminders: true,
    marketInsights: false,
    systemUpdates: true
  });
  const [followUpDays, setFollowUpDays] = useState(3);

  // Toggle available to recruiters function (from dashboard)
  const toggleAvailable = () => setIsAvailable(prev => !prev);

  // Auth check (from dashboard)
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

  // Fetch profile function (from dashboard)
  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, linkedin_URL, industry, job_title, location')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Fout bij ophalen profiel:', error);
      } else {
        const fetchedProfile: Profile = {
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          industry: data.industry || '',
          location: data.location || '',
          job_title: data.job_title || '',
          linkedin_URL: data.linkedin_URL || '',
          linkedIn: data.linkedin_URL || '',
          // Set default values for fields not in DB yet
          isAvailableForWork: true,
          hourlyRate: 75,
          age: 30,
          lastYearEarnings: 75000,
          gender: 'Prefer not to say',
          interests: 'Technology, Innovation, Problem Solving',
          mainProblem: 'Finding the right opportunities'
        };
        setProfile(fetchedProfile);
        setEditedProfile(fetchedProfile);
      }
    };

    fetchProfile();
  }, []);

  // Save profile function (fixed to use upsert like CompleteProfileForm)
  const saveProfile = async () => {
    console.log('Save profile clicked');
    if (!editedProfile) {
      console.error('No edited profile data');
      return;
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('Authentication error:', authError);
      alert(`Authentication error: ${authError.message}`);
      return;
    }

    if (!user) {
      console.error('No authenticated user found');
      alert('No authenticated user found. Please log in again.');
      return;
    }

    console.log('User found:', user.id);
    console.log('Edited profile data:', editedProfile);

    try {
      // Use upsert like CompleteProfileForm does - only save fields that exist in DB
      const profileData = {
        id: user.id,
        first_name: editedProfile.firstName,
        last_name: editedProfile.lastName,
        linkedin_URL: editedProfile.linkedin_URL,
        industry: editedProfile.industry,
        location: editedProfile.location,
        job_title: editedProfile.job_title,
        // Only include fields that exist in the current profiles table schema
        // Remove: isAvailableForWork, hourlyRate, age, lastYearEarnings, gender, interests, mainProblem
        // until these columns are added to the Supabase profiles table
      };

      console.log('Profile data to be upserted:', profileData);

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (upsertError) {
        console.error('Error saving profile:', upsertError);
        alert(`Profile update failed: ${upsertError.message}`);
      } else {
        console.log('Profile saved successfully');
        setProfile(editedProfile);
        setEditMode(false);
        alert('Profile saved successfully!');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Cancel edit function (from dashboard)
  const cancelEdit = () => {
    setEditedProfile(profile);
    setEditMode(false);
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
      <GlobalNav currentPage="profile" />

      {/* Floating Orbs Background */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(139, 69, 189, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        animation: 'float 6s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        animation: 'float 8s ease-in-out infinite reverse',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Main Content */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '6rem 2rem 2rem 2rem', position: 'relative', zIndex: 5 }}>

        {/* Profile Dashboard */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '24px',
          padding: '2rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: '700',
                margin: '0 0 0.5rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <Users style={{ width: '32px', height: '32px' }} />
                Profile Dashboard
              </h2>
              <p style={{
                fontSize: '1.1rem',
                opacity: 0.9,
                margin: 0
              }}>
                Manage your professional profile and preferences
              </p>
            </div>
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
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
                Edit Profile
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={saveProfile}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.75rem 1.25rem',
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
                    padding: '0.75rem 1.25rem',
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

          {/* Personal Information Section */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users style={{ width: '18px', height: '18px', color: '#10b981' }} />
              Personal Information
            </h3>

            {editMode ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.25rem' }}>First Name</label>
                    <input
                      type="text"
                      value={editedProfile.firstName}
                      onChange={(e) => setEditedProfile({ ...editedProfile, firstName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#fff',
                        backdropFilter: 'blur(8px)'
                      }}
                      placeholder="For example John"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.25rem' }}>Last Name</label>
                    <input
                      type="text"
                      value={editedProfile.lastName}
                      onChange={(e) => setEditedProfile({ ...editedProfile, lastName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#fff',
                        backdropFilter: 'blur(8px)'
                      }}
                      placeholder="For example Doe"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.25rem' }}>Job Title</label>
                    <input
                      type="text"
                      value={editedProfile.job_title}
                      onChange={(e) => setEditedProfile({ ...editedProfile, job_title: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#fff',
                        backdropFilter: 'blur(8px)'
                      }}
                      placeholder="For example Senior Developer"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.25rem' }}>Location</label>
                    <input
                      type="text"
                      value={editedProfile.location}
                      onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#fff',
                        backdropFilter: 'blur(8px)'
                      }}
                      placeholder="For example Amsterdam, Netherlands"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.25rem' }}>LinkedIn URL</label>
                    <input
                      type="url"
                      value={editedProfile.linkedin_URL}
                      onChange={(e) => setEditedProfile({ ...editedProfile, linkedin_URL: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#fff',
                        backdropFilter: 'blur(8px)'
                      }}
                      placeholder="For example https://linkedin.com/in/johndoe"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.25rem' }}>Industry</label>
                    <input
                      type="text"
                      value={editedProfile.industry}
                      onChange={(e) => setEditedProfile({ ...editedProfile, industry: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#fff',
                        backdropFilter: 'blur(8px)'
                      }}
                      placeholder="For example Technology"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.25rem' }}>Age</label>
                    <input
                      type="number"
                      value={editedProfile.age || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, age: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#fff',
                        backdropFilter: 'blur(8px)'
                      }}
                      placeholder="For example 30"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.25rem' }}>Last Year Earnings (€)</label>
                    <input
                      type="number"
                      value={editedProfile.lastYearEarnings || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, lastYearEarnings: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#fff',
                        backdropFilter: 'blur(8px)'
                      }}
                      placeholder="For example 75000"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.25rem' }}>Gender</label>
                    <select
                      value={editedProfile.gender || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, gender: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#fff',
                        backdropFilter: 'blur(8px)'
                      }}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.25rem' }}>Hourly Rate (€)</label>
                    <input
                      type="number"
                      value={editedProfile.hourlyRate || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, hourlyRate: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#fff',
                        backdropFilter: 'blur(8px)'
                      }}
                      placeholder="For example 75"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.25rem' }}>Interests</label>
                    <textarea
                      value={editedProfile.interests || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, interests: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#fff',
                        backdropFilter: 'blur(8px)',
                        minHeight: '80px',
                        resize: 'vertical'
                      }}
                      placeholder="For example Technology, Innovation, Problem Solving"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.25rem' }}>What is your main problem?</label>
                    <textarea
                      value={editedProfile.mainProblem || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, mainProblem: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#fff',
                        backdropFilter: 'blur(8px)',
                        minHeight: '80px',
                        resize: 'vertical'
                      }}
                      placeholder="For example Finding the right opportunities"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', backdropFilter: 'blur(8px)', marginTop: '1.5rem' }}>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="checkbox"
                          checked={editedProfile.isAvailableForWork || false}
                          onChange={(e) => setEditedProfile({ ...editedProfile, isAvailableForWork: e.target.checked })}
                          style={{ display: 'none' }}
                        />
                        <div style={{
                          width: '44px',
                          height: '24px',
                          borderRadius: '12px',
                          background: editedProfile.isAvailableForWork
                            ? 'rgba(16, 185, 129, 0.3)'
                            : 'rgba(255, 255, 255, 0.15)',
                          border: editedProfile.isAvailableForWork
                            ? '1px solid rgba(16, 185, 129, 0.4)'
                            : '1px solid rgba(255, 255, 255, 0.3)',
                          backdropFilter: 'blur(8px)',
                          transition: 'all 0.3s ease'
                        }}>
                          <div style={{
                            width: '18px',
                            height: '18px',
                            background: editedProfile.isAvailableForWork
                              ? 'rgba(255, 255, 255, 0.95)'
                              : 'rgba(255, 255, 255, 0.8)',
                            borderRadius: '50%',
                            transform: editedProfile.isAvailableForWork ? 'translateX(22px)' : 'translateX(2px)',
                            transition: 'all 0.3s ease',
                            marginTop: '2px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(4px)'
                          }} />
                        </div>
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)' }}>
                        Available for work
                      </span>
                    </label>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>Name</span>
                  <p style={{ fontWeight: '600', margin: '0.25rem 0 0 0', color: '#fff' }}>{profile.firstName} {profile.lastName}</p>
                </div>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>Location</span>
                  <p style={{ fontWeight: '600', margin: '0.25rem 0 0 0', color: '#fff' }}>{profile.location}</p>
                </div>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>Job title</span>
                  <p style={{ fontWeight: '600', margin: '0.25rem 0 0 0', color: '#fff' }}>{profile.job_title}</p>
                </div>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>LinkedIn</span>
                  <a href={profile.linkedIn} style={{ fontWeight: '600', color: '#fff', textDecoration: 'none', display: 'block', marginTop: '0.25rem' }} target="_blank" rel="noopener noreferrer">
                    LinkedIn profile
                  </a>
                </div>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>Hourly Rate</span>
                  <p style={{ fontWeight: '600', margin: '0.25rem 0 0 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <DollarSign style={{ width: '16px', height: '16px' }} />
                    €{profile.hourlyRate || 75}/hour
                  </p>
                </div>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>Availability</span>
                  <p style={{ fontWeight: '600', margin: '0.25rem 0 0 0', color: profile.isAvailableForWork ? '#10b981' : 'rgba(255, 255, 255, 0.6)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {profile.isAvailableForWork ? '✓ Available for work' : '✗ Not available'}
                  </p>
                </div>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>Age</span>
                  <p style={{ fontWeight: '600', margin: '0.25rem 0 0 0', color: '#fff' }}>{profile.age || 'Not specified'} years old</p>
                </div>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>Last Year Earnings</span>
                  <p style={{ fontWeight: '600', margin: '0.25rem 0 0 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <DollarSign style={{ width: '16px', height: '16px' }} />
                    €{(profile.lastYearEarnings || 0).toLocaleString()}
                  </p>
                </div>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>Gender</span>
                  <p style={{ fontWeight: '600', margin: '0.25rem 0 0 0', color: '#fff' }}>{profile.gender || 'Not specified'}</p>
                </div>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>Interests</span>
                  <p style={{ fontWeight: '600', margin: '0.25rem 0 0 0', color: '#fff' }}>{profile.interests || 'Not specified'}</p>
                </div>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>Main Problem</span>
                  <p style={{ fontWeight: '600', margin: '0.25rem 0 0 0', color: '#fff' }}>{profile.mainProblem || 'Not specified'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Mail Notifications Section */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell style={{ width: '18px', height: '18px', color: '#3b82f6' }} />
              Mail Notifications
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Follow-up Reminder Settings */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff' }}>Follow-up Reminders</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={mailNotifications.followUpReminders}
                      onChange={(e) => setMailNotifications(prev => ({ ...prev, followUpReminders: e.target.checked }))}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      width: '40px',
                      height: '20px',
                      borderRadius: '10px',
                      background: mailNotifications.followUpReminders ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.15)',
                      border: mailNotifications.followUpReminders ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.3)',
                      transition: 'all 0.3s ease'
                    }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '50%',
                        transform: mailNotifications.followUpReminders ? 'translateX(20px)' : 'translateX(2px)',
                        transition: 'all 0.3s ease',
                        marginTop: '1px'
                      }} />
                    </div>
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>Remind me after:</span>
                  <select
                    value={followUpDays}
                    onChange={(e) => setFollowUpDays(parseInt(e.target.value))}
                    style={{
                      padding: '0.5rem',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value={1}>1 day</option>
                    <option value={2}>2 days</option>
                    <option value={3}>3 days</option>
                    <option value={5}>5 days</option>
                    <option value={7}>1 week</option>
                  </select>
                </div>
              </div>

              {/* Notification Toggles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                {[
                  { key: 'leadNotifications', label: 'New Lead Notifications', desc: 'Get notified when new leads are added' },
                  { key: 'applicationStatusUpdates', label: 'Application Updates', desc: 'Status changes on your applications' },
                  { key: 'interviewReminders', label: 'Interview Reminders', desc: 'Reminders for upcoming interviews' },
                  { key: 'weeklyDigest', label: 'Weekly Summary', desc: 'Weekly overview of your activity' },
                  { key: 'marketInsights', label: 'Market Insights', desc: 'Industry trends and salary updates' },
                  { key: 'systemUpdates', label: 'System Updates', desc: 'Platform updates and announcements' }
                ].map((notification) => (
                  <div key={notification.key} style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '12px',
                    padding: '1rem',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#fff', marginBottom: '0.25rem' }}>
                        {notification.label}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                        {notification.desc}
                      </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={mailNotifications[notification.key as keyof typeof mailNotifications]}
                        onChange={(e) => setMailNotifications(prev => ({
                          ...prev,
                          [notification.key]: e.target.checked
                        }))}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        width: '36px',
                        height: '18px',
                        borderRadius: '9px',
                        background: mailNotifications[notification.key as keyof typeof mailNotifications]
                          ? 'rgba(59, 130, 246, 0.3)'
                          : 'rgba(255, 255, 255, 0.15)',
                        border: mailNotifications[notification.key as keyof typeof mailNotifications]
                          ? '1px solid rgba(59, 130, 246, 0.4)'
                          : '1px solid rgba(255, 255, 255, 0.3)',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{
                          width: '14px',
                          height: '14px',
                          background: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: '50%',
                          transform: mailNotifications[notification.key as keyof typeof mailNotifications] ? 'translateX(18px)' : 'translateX(2px)',
                          transition: 'all 0.3s ease',
                          marginTop: '1px'
                        }} />
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Available to Recruiters Toggle - Always Visible */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginTop: '1.5rem'
          }}>
            <label onClick={toggleAvailable} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                <div>
                  <span style={{ fontSize: '1rem', fontWeight: '600', color: '#fff', display: 'block' }}>
                    Available to recruiters
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Make your profile visible to recruiters
                  </span>
                </div>
              </div>
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
                {isAvailable ? 'Active' : 'Hidden'}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
} 