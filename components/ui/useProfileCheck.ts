import { useEffect, useState } from "react";
import { supabase } from "../../SupabaseClient";
import { apiClient } from "../../lib/apiClient";

export function useProfileCheck(user: any) {
  const [needsProfile, setNeedsProfile] = useState(false);
  const [loading, setLoading] = useState(false); // Start with false to not block the app

  useEffect(() => {
    if (!user) {
      setNeedsProfile(false);
      setLoading(false);
      return;
    }
    const checkProfile = async () => {
      setLoading(true);
      try {
        // Get user session for API token
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          apiClient.setToken(session.access_token);
        }

        // Fetch profile from backend API
        const profileData = await apiClient.getProfile();
        
        console.log('Profile check data from API:', profileData);
        if (!profileData || !profileData.firstName || !profileData.lastName || !profileData.linkedinUrl || !profileData.industry || !profileData.jobTitle) {
          // Check postponedTime for 24h window
          if (profileData && profileData.postponedTime) {
            const postponed = new Date(profileData.postponedTime).getTime();
            const now = Date.now();
            console.log('postponedTime:', profileData.postponedTime, 'now:', new Date(now).toISOString(), 'diff (ms):', now - postponed);
            if (now - postponed < 24 * 60 * 60 * 1000) {
              setNeedsProfile(false);
              setLoading(false);
              return;
            }
          }
          setNeedsProfile(true);
        } else {
          setNeedsProfile(false);
        }
        setLoading(false);
      } catch (err) {
        console.error('Profile check error from API:', err);
        
        // Fallback to direct Supabase if API fails
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("first_name, last_name, linkedin_URL, industry, job_title, postponed_time")
            .eq("id", user.id)
            .single();
          
          console.log('Profile check data from Supabase fallback:', data, 'Error:', error);
          if (error || !data || !data.first_name || !data.last_name || !data.linkedin_URL || !data.industry || !data.job_title) {
            // Check postponed_time for 24h window
            if (data && data.postponed_time) {
              const postponed = new Date(data.postponed_time).getTime();
              const now = Date.now();
              console.log('postponed_time:', data.postponed_time, 'now:', new Date(now).toISOString(), 'diff (ms):', now - postponed);
              if (now - postponed < 24 * 60 * 60 * 1000) {
                setNeedsProfile(false);
                setLoading(false);
                return;
              }
            }
            setNeedsProfile(true);
          } else {
            setNeedsProfile(false);
          }
        } catch (fallbackErr) {
          console.error('Profile check fallback error:', fallbackErr);
          // If there's an error (like table doesn't exist), just skip profile check
          setNeedsProfile(false);
        }
        setLoading(false);
      }
    };
    
    checkProfile();
  }, [user]);

  return { needsProfile, loading };
}
