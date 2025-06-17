import { useState, useEffect } from "react";
import { supabase } from "../../SupabaseClient";

export default function CompleteProfileForm({ onComplete, initialValues }: { onComplete: () => void, initialValues?: any }) {
  const [firstName, setFirstName] = useState(initialValues?.first_name || "");
  const [lastName, setLastName] = useState(initialValues?.last_name || "");
  const [linkedin, setLinkedin] = useState(initialValues?.linkedin_URL || "");
  const [industry, setIndustry] = useState(initialValues?.industry || "");
  const [jobTitle, setJobTitle] = useState(initialValues?.job_title || "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialValues) {
      setFirstName(initialValues.first_name || "");
      setLastName(initialValues.last_name || "");
      setLinkedin(initialValues.linkedin_URL || "");
      setIndustry(initialValues.industry || "");
      setJobTitle(initialValues.job_title || "");
    }
  }, [initialValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      linkedin_URL: linkedin,
      industry,
      job_title: jobTitle,
    });
    if (error) setError(error.message);
    else onComplete();
  };

  return (
    <form onSubmit={handleSubmit} style={{
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      maxWidth: 400,
      margin: "2rem auto",
      background: '#fff',
      padding: '2rem',
      borderRadius: '12px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      boxSizing: 'border-box',
      width: '100%',
      fontFamily: "'Montserrat', Arial, sans-serif"
    }}>
      <h2 style={{ color: '#121f36', fontSize: '1.5rem', marginBottom: '0.5rem', fontFamily: "'Montserrat', Arial, sans-serif" }}>Complete Your Profile</h2>
      <p style={{ color: '#374151', fontSize: '1rem', marginBottom: 0, fontFamily: "'Montserrat', Arial, sans-serif" }}>Before you continue please fill out the following information:</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ ...labelStyle, fontFamily: "'Montserrat', Arial, sans-serif", marginBottom: '0.3rem' }}>First Name</label>
        <input value={firstName} onChange={e => setFirstName(e.target.value)} required style={{ ...inputStyle, marginBottom: '1rem', marginLeft: '0', background: '#fff', color: '#121f36', border: '1.5px solid #0ccf83', boxSizing: 'border-box', fontFamily: "'Montserrat', Arial, sans-serif" }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ ...labelStyle, fontFamily: "'Montserrat', Arial, sans-serif", marginBottom: '0.3rem' }}>Last Name</label>
        <input value={lastName} onChange={e => setLastName(e.target.value)} required style={{ ...inputStyle, marginBottom: '1rem', marginLeft: '0', background: '#fff', color: '#121f36', border: '1.5px solid #0ccf83', boxSizing: 'border-box', fontFamily: "'Montserrat', Arial, sans-serif" }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ ...labelStyle, fontFamily: "'Montserrat', Arial, sans-serif", marginBottom: '0.3rem' }}>LinkedIn</label>
        <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="e.g. linkedin.com/in/yourprofile" style={{ ...inputStyle, marginBottom: '1rem', marginLeft: '0', background: '#fff', color: '#121f36', border: '1.5px solid #0ccf83', boxSizing: 'border-box', fontFamily: "'Montserrat', Arial, sans-serif" }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ ...labelStyle, fontFamily: "'Montserrat', Arial, sans-serif", marginBottom: '0.3rem' }}>Industry</label>
        <input value={industry} onChange={e => setIndustry(e.target.value)} required style={{ ...inputStyle, marginBottom: '1rem', marginLeft: '0', background: '#fff', color: '#121f36', border: '1.5px solid #0ccf83', boxSizing: 'border-box', fontFamily: "'Montserrat', Arial, sans-serif" }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ ...labelStyle, fontFamily: "'Montserrat', Arial, sans-serif", marginBottom: '0.3rem' }}>Job Title</label>
        <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} required style={{ ...inputStyle, marginBottom: '1rem', marginLeft: '0', background: '#fff', color: '#121f36', border: '1.5px solid #0ccf83', boxSizing: 'border-box', fontFamily: "'Montserrat', Arial, sans-serif" }} />
      </div>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="submit" style={{ ...buttonStyle, fontFamily: "'Montserrat', Arial, sans-serif" }}>Save Profile</button>
      </div>
      {error && <div style={{color: "#dc2626", fontFamily: "'Montserrat', Arial, sans-serif"}}>{error}</div>}
      <style>{`
        @media (max-width: 500px) {
          form {
            padding: 1rem !important;
            max-width: 98vw !important;
            border-radius: 8px !important;
          }
          input {
            font-size: 1rem !important;
            padding: 0.6rem 0.8rem !important;
          }
          h2 {
            font-size: 1.1rem !important;
          }
        }
      `}</style>
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  fontWeight: 600,
  marginBottom: "0.1rem",
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  borderRadius: "4px",
  border: "1px solid #ccc",
  fontSize: "1rem",
  width: "100%",
};

const buttonStyle: React.CSSProperties = {
  background: "#374151",
  color: "#fff",
  fontWeight: 700,
  borderRadius: "4px",
  padding: "10px 16px",
  border: "none",
  boxShadow: "0 2px 8px rgba(12, 207, 131, 0.15)",
  cursor: "pointer",
  fontSize: "0.95rem",
  alignSelf: "center",
  transition: "background 0.2s, color 0.2s, box-shadow 0.2s, border 0.2s, transform 0.1s",
};
