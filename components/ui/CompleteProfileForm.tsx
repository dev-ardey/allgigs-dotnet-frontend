import { useState, useEffect } from "react";
import { supabase } from "../../SupabaseClient";
import { sanitizeInput } from "../../utils/sanitizeInput";
import { apiClient } from "../../lib/apiClient";

interface CompleteProfileFormProps {
  onComplete: () => void;
  initialValues?: any;
}

export default function CompleteProfileForm({ onComplete, initialValues }: CompleteProfileFormProps) {
  const [firstName, setFirstName] = useState(initialValues?.first_name || "");
  const [lastName, setLastName] = useState(initialValues?.last_name || "");
  const [linkedin, setLinkedin] = useState(initialValues?.linkedin_URL || "");
  const [industry, setIndustry] = useState(initialValues?.industry || "");
  const [jobTitle, setJobTitle] = useState(initialValues?.job_title || "");
  const [location, setLocation] = useState(initialValues?.location || "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialValues) {
      setFirstName(initialValues.first_name || "");
      setLastName(initialValues.last_name || "");
      setLinkedin(initialValues.linkedin_URL || "");
      setIndustry(initialValues.industry || "");
      setJobTitle(initialValues.job_title || "");
      setLocation(initialValues.location || "");
    }
  }, [initialValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        setError(`Authentication error: ${authError.message}`);
        return;
      }
      
      if (!user) {
        setError("No authenticated user found. Please log in again.");
        return;
      }

      // Get user session for API token
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        apiClient.setToken(session.access_token);
      }

      // Sanitize all fields before update
      const profileData = {
        firstName: sanitizeInput(firstName),
        lastName: sanitizeInput(lastName),
        linkedinUrl: sanitizeInput(linkedin),
        industry: sanitizeInput(industry),
        jobTitle: sanitizeInput(jobTitle),
        location: sanitizeInput(location),
      };

      // Update profile via backend API
      await apiClient.updateProfile(profileData);
      onComplete();
      
    } catch (err) {
      console.error('Error updating profile via API:', err);
      
      // Fallback to direct Supabase if API fails
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("No authenticated user found. Please log in again.");
          return;
        }

        // Sanitize all fields before upsert
        const sanitizedProfile = {
          id: user.id,
          first_name: sanitizeInput(firstName),
          last_name: sanitizeInput(lastName),
          linkedin_URL: sanitizeInput(linkedin),
          industry: sanitizeInput(industry),
          job_title: sanitizeInput(jobTitle),
          location: sanitizeInput(location),
        };

        const { error: updateError } = await supabase.from("profiles").upsert(sanitizedProfile);
        
        if (updateError) {
          setError(`Profile update failed: ${updateError.message}`);
        } else {
          onComplete();
        }
      } catch (fallbackError) {
        setError(`Unexpected error: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{
      background: '#fff',
      color: '#121f36',
      borderRadius: '12px',
      margin: '10px 20px',
      padding: '16px',
      fontFamily: "'Montserrat', Arial, sans-serif",
      fontSize: '0.98rem',
      boxSizing: 'border-box',
      border: '3px solid #0ccf83',
      width: 'calc(100% - 40px)',
      maxWidth: 540,
      display: 'block',
      marginBottom: '1.2rem',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
    }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: '#0ccf83', fontSize: '1.1rem' }}>Edit Your Details</div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ minWidth: 90, display: 'inline-block' }}>First Name:</strong>
        <input value={firstName} onChange={e => setFirstName(e.target.value)} required style={{ ...inputStyle, marginLeft: 12, background: '#f9fafb', color: '#121f36', border: '1.5px solid #0ccf83', fontSize: '0.98rem', padding: '0.4rem 0.7rem', borderRadius: 6, width: '75%' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ minWidth: 90, display: 'inline-block' }}>Last Name:</strong>
        <input value={lastName} onChange={e => setLastName(e.target.value)} required style={{ ...inputStyle, marginLeft: 12, background: '#f9fafb', color: '#121f36', border: '1.5px solid #0ccf83', fontSize: '0.98rem', padding: '0.4rem 0.7rem', borderRadius: 6, width: '75%' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ minWidth: 90, display: 'inline-block' }}>LinkedIn:</strong>
        <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="e.g. linkedin.com/in/yourprofile" style={{ ...inputStyle, marginLeft: 12, background: '#f9fafb', color: '#121f36', border: '1.5px solid #0ccf83', fontSize: '0.98rem', padding: '0.4rem 0.7rem', borderRadius: 6, width: '75%' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ minWidth: 90, display: 'inline-block' }}>Industry:</strong>
        <input value={industry} onChange={e => setIndustry(e.target.value)} required style={{ ...inputStyle, marginLeft: 12, background: '#f9fafb', color: '#121f36', border: '1.5px solid #0ccf83', fontSize: '0.98rem', padding: '0.4rem 0.7rem', borderRadius: 6, width: '75%' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ minWidth: 90, display: 'inline-block' }}>Job Title:</strong>
        <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} required style={{ ...inputStyle, marginLeft: 12, background: '#f9fafb', color: '#121f36', border: '1.5px solid #0ccf83', fontSize: '0.98rem', padding: '0.4rem 0.7rem', borderRadius: 6, width: '75%' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ minWidth: 90, display: 'inline-block' }}>Location:</strong>
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Amsterdam, Remote" style={{ ...inputStyle, marginLeft: 12, background: '#f9fafb', color: '#121f36', border: '1.5px solid #0ccf83', fontSize: '0.98rem', padding: '0.4rem 0.7rem', borderRadius: 6, width: '75%' }} />
      </div>
      <AvailableToRecruitersToggle />
      <button type="submit" style={{
        background: '#0ccf83',
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
        width: '100%',
        marginTop: 16
      }}>Save Profile</button>
      {error && <div style={{color: "#dc2626", fontFamily: "'Montserrat', Arial, sans-serif", fontSize: '0.95rem', marginTop: 8}}>{error}</div>}
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  borderRadius: "4px",
  border: "1px solid #ccc",
  fontSize: "1rem",
  width: "100%",
};

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
