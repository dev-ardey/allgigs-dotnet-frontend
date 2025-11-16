import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../SupabaseClient';

interface AuthGuardProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
    children,
    allowedRoles
}) => {
    const [, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showAccessDenied, setShowAccessDenied] = useState(false);
    const [hasSession, setHasSession] = useState<boolean | null>(null);
    const router = useRouter();

    useEffect(() => {
        checkUserRole();
    }, []);

    const checkUserRole = async () => {
        try {
            // Check if user is logged in
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                // Not logged in - AuthProvider will show login form automatically
                // Don't render children, let AuthProvider handle authentication
                setHasSession(false);
                setIsLoading(false);
                return;
            }

            setHasSession(true);

            // Get API base URL from environment variable
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://allgigs-v3-backend-production.up.railway.app';

            // Get user role from backend
            const response = await fetch(`${apiBaseUrl}/api/UserRole/me`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (response.ok) {
                const { role } = await response.json();
                setUserRole(role);

                // Map 'user' to 'freeUser' for compatibility
                const normalizedRole = role === 'user' ? 'freeUser' : role;

                // Check if user has access
                if (!allowedRoles.includes(normalizedRole)) {
                    setShowAccessDenied(true);
                }
            } else {
                // Error getting role - let AuthProvider handle it
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setIsLoading(false);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    // If no session, don't render children - AuthProvider will show login
    if (hasSession === false) {
        return null;
    }

    if (showAccessDenied) {
        return <AccessDeniedModal onClose={() => router.back()} />;
    }

    return <>{children}</>;
};

// Access Denied Modal Component
interface AccessDeniedModalProps {
    onClose: () => void;
}

const AccessDeniedModal: React.FC<AccessDeniedModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                <p className="text-gray-700 mb-6">
                    This page is not available for your account type. Please contact support for access.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={() => window.location.href = '/contact'}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Contact Support
                    </button>
                </div>
            </div>
        </div>
    );
};
