import React from 'react';
import { Archive } from 'lucide-react';

interface ArchiveModalProps {
    onClose: () => void;
    user: any;
}

const ArchiveModal: React.FC<ArchiveModalProps> = ({ onClose, user }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%',
                color: '#fff',
                textAlign: 'center'
            }}>
                <Archive style={{ width: '48px', height: '48px', margin: '0 auto 1rem auto' }} />
                <h2 style={{ margin: '0 0 1rem 0' }}>Archive Modal (Demo)</h2>
                <p style={{ margin: '0 0 1.5rem 0' }}>
                    In the full version, this would show all your archived leads with options to restore or permanently delete them.
                </p>
                <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.875rem', opacity: 0.8 }}>
                    Features would include bulk operations, search, and filtering by stage.
                </p>
                <button
                    onClick={onClose}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                    }}
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default ArchiveModal; 