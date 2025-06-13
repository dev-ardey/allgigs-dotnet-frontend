import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../SupabaseClient";

export default function AuthCallback() {
  const router = useRouter();
  const [message, setMessage] = useState("Processing...");
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";

    if (hash.includes("type=recovery")) {
      setMessage("Please set your new password.");
      setShowPasswordForm(true);
    } else if (hash.includes("type=signup")) {
      setMessage("Your email has been confirmed! You can now log in.");
      setShowPasswordForm(false);
      setTimeout(() => router.push("/jobs"), 3000);
    } else {
      setMessage("Redirecting...");
      setShowPasswordForm(false);
      setTimeout(() => router.push("/jobs"), 2000);
    }
  }, [router]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Updating password...");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password updated! Redirecting to login...");
      setShowPasswordForm(false);
      setTimeout(() => router.push("/jobs"), 2000);
    }
  };

  return (
    <div style={{
      maxWidth: 420,
      margin: "4rem auto",
      fontFamily: "'Montserrat', Arial, sans-serif",
      background: '#fff',
      borderRadius: '16px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      padding: '2.5rem 2rem',
      textAlign: 'center',
      boxSizing: 'border-box',
    }}>
      <img src="/images/allGigs-logo-white.svg" alt="AllGigs Logo" style={{ height: 60, marginBottom: 24 }} />
      {showPasswordForm ? (
        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', alignItems: 'center' }}>
          <h2 style={{ color: '#121f36', fontSize: '1.3rem', marginBottom: 0 }}>Set New Password</h2>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="New password"
            required
            style={{
              width: '100%',
              padding: '0.85rem 1rem',
              borderRadius: '6px',
              border: '1.5px solid #0ccf83',
              fontSize: '1rem',
              fontFamily: "'Montserrat', Arial, sans-serif",
              background: '#fff',
              color: '#121f36',
              marginBottom: 0
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.85rem 1rem',
              borderRadius: '6px',
              background: '#0ccf83',
              color: '#000',
              fontWeight: 700,
              border: '2px solid #0ccf83',
              fontSize: '1.1rem',
              fontFamily: "'Montserrat', Arial, sans-serif",
              boxShadow: '0 2px 8px rgba(12, 207, 131, 0.10)',
              cursor: 'pointer',
              marginTop: 0
            }}
          >
            Set Password
          </button>
        </form>
      ) : (
        <h2 style={{ color: '#121f36', fontSize: '1.1rem', fontFamily: "'Montserrat', Arial, sans-serif" }}>{message}</h2>
      )}
      <style>{`
        @media (max-width: 500px) {
          div {
            padding: 1.2rem 0.5rem !important;
            max-width: 98vw !important;
            border-radius: 10px !important;
          }
          input, button {
            font-size: 1rem !important;
            padding: 0.7rem 0.8rem !important;
          }
          h2 {
            font-size: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}