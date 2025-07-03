import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Menu, X, Home, User, Search } from 'lucide-react';

interface GlobalNavProps {
    currentPage?: string;
}

export default function GlobalNav({ currentPage = 'dashboard' }: GlobalNavProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const router = useRouter();

    const navigateTo = (page: string) => {
        setMenuOpen(false);
        if (page === 'dashboard') {
            router.push('/dashboard');
        } else if (page === 'profile') {
            router.push('/Profile');
        } else if (page === 'leadSearch') {
            router.push('/leadSearch');
        }
    };

    return (
        <>
            {/* Hamburger Menu Button */}
            <div style={{ position: 'fixed', top: 24, left: 24, zIndex: 1200 }}>
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '50%',
                        padding: '0.75rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(8px)',
                        transition: 'all 0.2s ease'
                    }}
                    aria-label="Open menu"
                >
                    <Menu color="#fff" size={28} />
                </button>
            </div>

            {/* Side Menu */}
            {menuOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '250px',
                        height: '100vh',
                        background: 'rgba(255, 255, 255, 0.1)',
                        boxShadow: '2px 0 16px rgba(0,0,0,0.2)',
                        zIndex: 1100,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '2rem 1rem 1rem 1.5rem',
                        gap: '2rem',
                        backdropFilter: 'blur(12px)',
                        animation: 'slideIn 0.3s ease-out',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                >
                    {/* Close Button */}
                    <button
                        onClick={() => setMenuOpen(false)}
                        style={{
                            alignSelf: 'flex-end',
                            background: 'none',
                            border: 'none',
                            color: '#fff',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            marginBottom: '1rem',
                            padding: '0.5rem',
                            borderRadius: '50%',
                            transition: 'background 0.2s'
                        }}
                        aria-label="Close menu"
                    >
                        <X size={24} />
                    </button>

                    {/* Navigation Links */}
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button
                            onClick={() => navigateTo('dashboard')}
                            style={{
                                background: currentPage === 'dashboard' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '12px',
                                color: '#fff',
                                fontWeight: '600',
                                fontSize: '1.1rem',
                                padding: '1rem 1.25rem',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}
                        >
                            <Home size={20} />
                            Dashboard
                        </button>

                        <button
                            onClick={() => navigateTo('leadSearch')}
                            style={{
                                background: currentPage === 'leadSearch' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '12px',
                                color: '#fff',
                                fontWeight: '600',
                                fontSize: '1.1rem',
                                padding: '1rem 1.25rem',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}
                        >
                            <Search size={20} />
                            Lead Search
                        </button>

                        <button
                            onClick={() => navigateTo('profile')}
                            style={{
                                background: currentPage === 'profile' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '12px',
                                color: '#fff',
                                fontWeight: '600',
                                fontSize: '1.1rem',
                                padding: '1rem 1.25rem',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}
                        >
                            <User size={20} />
                            Profile
                        </button>
                    </nav>
                </div>
            )}

            {/* Overlay */}
            {menuOpen && (
                <div
                    onClick={() => setMenuOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(0,0,0,0.3)',
                        zIndex: 1050,
                        backdropFilter: 'blur(2px)'
                    }}
                />
            )}

            <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
        </>
    );
} 