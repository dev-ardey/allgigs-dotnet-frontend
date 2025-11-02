import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../SupabaseClient';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUserAndRedirect();

    // Listen for auth state changes to redirect after login
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // User logged in - redirect to dashboard immediately
        router.push('/dashboard');
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const checkUserAndRedirect = async () => {
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Not logged in - AuthProvider will show login form automatically
        setIsLoading(false);
        return;
      }

      // User has session - redirect to dashboard immediately
      // AuthGuard on dashboard will handle role checking if needed
      router.push('/dashboard');
    } catch (error) {
      console.error('Auth check failed:', error);
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