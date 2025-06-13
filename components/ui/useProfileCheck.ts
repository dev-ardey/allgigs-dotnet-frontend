import { useEffect, useState } from "react";
import { supabase } from "../../SupabaseClient";

export function useProfileCheck(user: any) {
  const [needsProfile, setNeedsProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNeedsProfile(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("profiles")
      .select("first_name, last_name, linkedin_URL, industry, job_title, postponed_time")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        console.log('Profile check data:', data, 'Error:', error);
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
        setLoading(false);
      });
  }, [user]);

  return { needsProfile, loading };
}
