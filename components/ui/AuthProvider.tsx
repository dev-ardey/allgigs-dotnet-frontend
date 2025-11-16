import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../SupabaseClient';
import LoginForm from './login';

interface AuthContextType {
    user: any;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            listener?.subscription.unsubscribe();
        };
    }, []);

    // Show login form if not authenticated and not loading
    if (!loading && !user) {
        return <LoginForm />;
    }

    // Show loading state
    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'black',
                fontFamily: "'Montserrat', Arial, sans-serif",
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#4b5563'
                }}>
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
} 