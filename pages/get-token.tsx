import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function GetToken() {
    const [token, setToken] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        async function getSession() {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                const bearerToken = `Bearer ${session.access_token}`;
                setToken(bearerToken);
                setUser(session.user);
            }
        }
        getSession();
    }, []);

    const copyToken = () => {
        navigator.clipboard.writeText(token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!token) {
        return (
            <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui' }}>
                <h1>❌ No Token Found</h1>
                <p>You need to be logged in to get your JWT token.</p>
                <a href="/" style={{ color: '#0070f3', textDecoration: 'underline' }}>Go to login</a>
            </div>
        );
    }

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui' }}>
            <h1>🔑 Your JWT Token for API Testing</h1>

            <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <p><strong>User ID:</strong> {user?.id}</p>
                <p><strong>Email:</strong> {user?.email}</p>
            </div>

            <div style={{ background: '#000', color: '#0f0', padding: '20px', borderRadius: '8px', marginBottom: '20px', fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '14px' }}>
                {token}
            </div>

            <button
                onClick={copyToken}
                style={{
                    background: copied ? '#10b981' : '#0070f3',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    marginRight: '10px'
                }}
            >
                {copied ? '✅ Copied!' : '📋 Copy Token'}
            </button>

            <h2 style={{ marginTop: '40px' }}>How to Use:</h2>

            <h3>Option 1: Swagger UI (Recommended)</h3>
            <ol>
                <li>Open: <a href="http://localhost:5003/swagger" target="_blank" style={{ color: '#0070f3' }}>http://localhost:5003/swagger</a></li>
                <li>Click the <strong>"Authorize"</strong> button (top right)</li>
                <li>Paste the token above (including "Bearer ")</li>
                <li>Click <strong>"Authorize"</strong></li>
                <li>Now test any endpoint!</li>
            </ol>

            <h3>Option 2: Automated Test Script</h3>
            <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', overflow: 'auto' }}>
                {`cd /Users/niiardeyankrah/Desktop/Nii\\ Ardey/projects\\ 2025/allgigs-backend
./test-with-token.sh "${token}"`}
            </pre>

            <h3>Option 3: Manual cURL</h3>
            <pre style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', overflow: 'auto' }}>
                {`curl -H "Authorization: ${token}" \\
  http://localhost:5003/api/UserRole/me`}
            </pre>

            <h3>⚠️ Important Notes:</h3>
            <ul>
                <li>Token expires after <strong>1 hour</strong></li>
                <li>Come back to this page to get a fresh token when needed</li>
                <li>Always include the "Bearer " prefix</li>
                <li>Backend API must be running on port 5003</li>
            </ul>

            <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
                <strong>🧪 Quick Test:</strong><br />
                After copying the token, open Swagger UI and try the <code>GET /api/UserRole/me</code> endpoint!
            </div>
        </div>
    );
}
