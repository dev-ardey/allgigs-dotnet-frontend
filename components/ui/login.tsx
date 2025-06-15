import { useState } from "react";
import { supabase } from "../../SupabaseClient";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [signedUp, setSignedUp] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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
      const { error } = await supabase.auth.signUp({ email, password });
      setSignedUp(true);
      setMessage("");
    } else if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/jobs`,
      });
      setMessage(error ? `Error: ${error.message}` : "Password reset email sent!");
    }
  };

  return (
    <div className="job-board-container" style={{ maxWidth: 520, margin: "4rem auto", textAlign: "center" }}>
      <img src="/images/allGigs-logo-white.svg" alt="AllGigs Logo" style={{ height: "70px", marginBottom: "1.5rem" }} />
      <p style={{
        color: "#c8c8c8",
        fontSize: "1.1rem",
        marginBottom: "2rem",
        whiteSpace: "normal",
        overflowWrap: "break-word",
        wordBreak: "break-word",
        lineHeight: 1.6,
        maxWidth: "100%",
        textAlign: "center"
      }}>
        Discover your next opportunity from <span style={{ fontWeight: "bold", color: "#0ccf83" }}>1000</span> curated positions
      </p>
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={e => setEmail(e.target.value)}
          style={inputStyle}
        />
        {mode !== "forgot" && (
          <input
            type="password"
            placeholder="Password"
            value={password}
            required
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
          />
        )}
        <button
          type="submit"
          style={buttonStyle}
          onMouseDown={e => (e.currentTarget.style.boxShadow = buttonActiveStyle.boxShadow, e.currentTarget.style.background = String(buttonActiveStyle.background), e.currentTarget.style.transform = buttonActiveStyle.transform)}
          onMouseUp={e => (e.currentTarget.style.boxShadow = buttonStyle.boxShadow, e.currentTarget.style.background = String(buttonStyle.background), e.currentTarget.style.transform = "none")}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = buttonStyle.boxShadow, e.currentTarget.style.background = String(buttonStyle.background), e.currentTarget.style.transform = "none")}
        >
          {mode === "login" && "Login"}
          {mode === "signup" && "Sign Up"}
          {mode === "forgot" && "Reset Password"}
        </button>
        <div style={{ fontSize: "0.9rem", marginTop: "0.5rem", color: "#c8c8c8" }}>
          {mode !== "forgot" && (
            <span onClick={() => setMode("forgot")} style={linkStyle}>Forgot?</span>
          )}
          {mode === "login" && (
            <div>
              No account? <span onClick={() => setMode("signup")} style={linkStyle}>Sign up</span>
            </div>
          )}
          {mode === "signup" && (
            <div>
              Already have an account? <span onClick={() => setMode("login")} style={linkStyle}>Login</span>
            </div>
          )}
          {mode === "forgot" && (
            <div>
              Remembered? <span onClick={() => setMode("login")} style={linkStyle}>Login</span>
            </div>
          )}
        </div>
        {signedUp && (
          <div style={{ marginTop: "1rem", color: "#0ccf83", fontWeight: 600 }}>
            Thank you for signing up, please verify your email.
          </div>
        )}
        {message && (
          <div style={{ marginTop: "1rem", color: message.toLowerCase().includes("error") ? "#dc2626" : "#0ccf83" }}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  borderRadius: "4px",
  border: "1px solid #ccc",
  fontSize: "1rem",
  width: "100%",
};

const buttonStyle: React.CSSProperties = {
  background: "#0ccf83",
  color: "#000",
  fontWeight: 700,
  borderRadius: "4px",
  padding: "0.75rem 1.5rem",
  border: "2px solid #0ccf83",
  boxShadow: "0 2px 8px rgba(12, 207, 131, 0.15)",
  cursor: "pointer",
  fontSize: "1.1rem",
  alignSelf: "center",
  transition: "background 0.2s, color 0.2s, box-shadow 0.2s, border 0.2s, transform 0.1s",
};

const buttonActiveStyle: React.CSSProperties = {
  boxShadow: "0 1px 2px rgba(12, 207, 131, 0.25) inset",
  background: "#0bbf73",
  transform: "translateY(2px)",
};

const linkStyle: React.CSSProperties = {
  color: "#0ccf83",
  cursor: "pointer",
  fontWeight: 500,
};
