import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../SupabaseClient';

interface AuthGuardProps {
    children: React.ReactNode;
    allowedRoles: string[];
    fallbackPath?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
    children,
    allowedRoles,
    fallbackPath = '/auth/login'
}) => {
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showAccessDenied, setShowAccessDenied] = useState(false);
    const router = useRouter();

    useEffect(() => {
        checkUserRole();
    }, []);

    const checkUserRole = async () => {
        try {
            // Check if user is logged in
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                // Not logged in - redirect to login
                router.push(fallbackPath);
                return;
            }

            // Get user role from backend
            const response = await fetch('http://localhost:5004/api/UserRole/me', {
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
                // Error getting role - redirect to login
                router.push(fallbackPath);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            router.push(fallbackPath);
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
                    This page is not available for free users. Please upgrade your account to access this feature.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={() => window.location.href = '/pricing'}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Upgrade Account
                    </button>
                </div>
            </div>
        </div>
    );
};
