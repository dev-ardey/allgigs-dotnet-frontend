import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to home where AuthProvider will show login form
        router.replace('/');
    }, [router]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontFamily: "'Montserrat', Arial, sans-serif"
        }}>
            <div style={{
                textAlign: 'center',
                padding: '2rem'
            }}>
                <p style={{ color: '#fff' }}>Redirecting to login...</p>
            </div>
        </div>
    );
}
