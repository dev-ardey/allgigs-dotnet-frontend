import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../SupabaseClient';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUserAndRedirect();
  }, [router]);

  const checkUserAndRedirect = async () => {
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Not logged in - redirect to login
        router.push('/auth/login');
        return;
      }

      // Get user role from backend
      const response = await fetch('http://localhost:5004/api/UserRole/me', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        // Redirect based on role - all users go to dashboard now
        router.push('/dashboard');
      } else {
        // Error getting role - redirect to login
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
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
          <h2 style={{ color: '#121f36', marginBottom: '1rem' }}>Loading...</h2>
          <p style={{ color: '#666' }}>Checking your access level...</p>
        </div>
      </div>
    );
  }

  return null; // This should not render as we redirect
}