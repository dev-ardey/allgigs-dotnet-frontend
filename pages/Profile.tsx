import React from 'react';
import GlobalNav from '../components/ui/GlobalNav';

export default function Profile() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
      color: 'white',
      fontFamily: 'Inter, sans-serif',
      position: 'relative'
    }}>
      <GlobalNav currentPage="profile" />
      <h1 style={{ fontSize: '2.5rem', fontWeight: 700 }}>Profile Page</h1>
    </div>
  );
} 