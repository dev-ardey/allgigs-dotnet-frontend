import { useState } from "react";
import { supabase } from "../../SupabaseClient";
import { sanitizeInput } from "../../utils/sanitizeInput";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [signedUp, setSignedUp] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const sanitizedEmail = sanitizeInput(email);

    if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({ email: sanitizedEmail, password });
      if (error) {
        setMessage(error.message);
        return;
      }
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();
      if (!profile && profileError && profileError.code === 'PGRST116') {
        // Insert profile if it doesn't exist
        const { error: insertError } = await supabase.from("profiles").insert([
          {
            id: data.user.id
          }
        ]);
        if (insertError) {
          setMessage(`Profile insert error: ${insertError.message}`);
          return;
        }
      }
      setMessage("Logged in!");
    } else if (mode === "signup") {
      await supabase.auth.signUp({ email: sanitizedEmail, password });
      setSignedUp(true);
      setMessage("");
    } else if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/jobs`,
      });
      setMessage(error ? `Error: ${error.message}` : "Password reset email sent!");
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'black',
      fontFamily: "'Montserrat', Arial, sans-serif",
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>

      {/* Login Container */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '24px',
        padding: '3rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        maxWidth: '480px',
        width: '100%',
        margin: '2rem',
        textAlign: 'center',
        position: 'relative',
        zIndex: 5
      }}>
        <img
          src="/images/allGigs-logo-white.svg"
          alt="AllGigs Logo"
          style={{
            height: "80px",
            marginBottom: "2rem",
            filter: 'brightness(1.1)'
          }}
        />

        <p style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: "1.2rem",
          marginBottom: "2.5rem",
          whiteSpace: "normal",
          overflowWrap: "break-word",
          wordBreak: "break-word",
          lineHeight: 1.6,
          maxWidth: "100%",
          textAlign: "center"
        }}>
          Discover your next opportunity from <span style={{ fontWeight: "bold", color: "#0ccf83" }}>1000</span> curated positions
        </p>

        <form onSubmit={handleLogin} style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          width: "100%",
          alignItems: "center"
        }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            required
            onChange={e => setEmail(e.target.value)}
            style={{ ...inputStyle, alignSelf: "stretch" }}
            className="login-input-placeholder"
            onFocus={e => {
              e.currentTarget.style.border = '1px solid rgba(12, 207, 131, 0.5)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onBlur={e => {
              e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          />
          {mode !== "forgot" && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              required
              onChange={e => setPassword(e.target.value)}
              style={{ ...inputStyle, alignSelf: "stretch" }}
              className="login-input-placeholder"
              onFocus={e => {
                e.currentTarget.style.border = '1px solid rgba(12, 207, 131, 0.5)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onBlur={e => {
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            />
          )}
          <button
            type="submit"
            style={buttonStyle}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#0bbf73';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(12, 207, 131, 0.25)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#0ccf83';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(12, 207, 131, 0.15)';
            }}
            onMouseDown={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(12, 207, 131, 0.25)';
            }}
            onMouseUp={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(12, 207, 131, 0.25)';
            }}
          >
            {mode === "login" && "Login"}
            {mode === "signup" && "Sign Up"}
            {mode === "forgot" && "Reset Password"}
          </button>

          <div style={{ fontSize: "1rem", marginTop: "1rem", color: "rgba(255, 255, 255, 0.8)" }}>
            {mode !== "forgot" && (
              <span onClick={() => setMode("forgot")} style={linkStyle}>Forgot password?</span>
            )}
            {mode === "login" && (
              <div style={{ marginTop: "0.5rem" }}>
                No account? <span onClick={() => setMode("signup")} style={linkStyle}>Sign up</span>
              </div>
            )}
            {mode === "signup" && (
              <div style={{ marginTop: "0.5rem" }}>
                Already have an account? <span onClick={() => setMode("login")} style={linkStyle}>Login</span>
              </div>
            )}
            {mode === "forgot" && (
              <div style={{ marginTop: "0.5rem" }}>
                Remembered? <span onClick={() => setMode("login")} style={linkStyle}>Login</span>
              </div>
            )}
          </div>

          {signedUp && (
            <div style={{
              marginTop: "1rem",
              color: "#0ccf83",
              fontWeight: 600,
              padding: "1rem",
              background: "rgba(12, 207, 131, 0.1)",
              borderRadius: "12px",
              border: "1px solid rgba(12, 207, 131, 0.3)"
            }}>
              Thank you for signing up, please verify your email.
            </div>
          )}

          {message && (
            <div style={{
              marginTop: "1rem",
              color: message.toLowerCase().includes("error") ? "#ef4444" : "#0ccf83",
              fontWeight: 600,
              padding: "1rem",
              background: message.toLowerCase().includes("error")
                ? "rgba(239, 68, 68, 0.1)"
                : "rgba(12, 207, 131, 0.1)",
              borderRadius: "12px",
              border: message.toLowerCase().includes("error")
                ? "1px solid rgba(239, 68, 68, 0.3)"
                : "1px solid rgba(12, 207, 131, 0.3)"
            }}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "1rem 1.25rem",
  borderRadius: "12px",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  fontSize: "1rem",
  width: "100%",
  background: "rgba(255, 255, 255, 0.1)",
  backdropFilter: "blur(8px)",
  color: "#fff",
  transition: "all 0.3s ease",
  outline: "none",
  boxSizing: "border-box",
  textAlign: "left",
};

const buttonStyle: React.CSSProperties = {
  background: "#0ccf83",
  color: "#000",
  fontWeight: 700,
  borderRadius: "12px",
  padding: "1rem 2rem",
  border: "none",
  boxShadow: "0 2px 8px rgba(12, 207, 131, 0.15)",
  cursor: "pointer",
  fontSize: "1.1rem",
  width: "100%",
  transition: "all 0.3s ease",
  outline: "none",
  boxSizing: "border-box",
  alignSelf: "stretch",
};

const linkStyle: React.CSSProperties = {
  color: "#0ccf83",
  cursor: "pointer",
  fontWeight: 600,
  textDecoration: "underline",
  transition: "all 0.2s ease",
};
