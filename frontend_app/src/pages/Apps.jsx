import React, { useState } from 'react'; // Plus besoin de useEffect pour le localStorage ici
import { Users, Grid } from 'lucide-react';
import UserManagement from '../components/UserManagement';

// On reçoit 'user' directement depuis App.jsx
export default function Apps({ user }) {
  const [activeApp, setActiveApp] = useState(null);

  // ID du Super Admin
  const SUPER_ADMIN_ID = 5;

  // Petit log pour le débogage (Regardez la console du navigateur F12)
  console.log("Apps Page - User Info:", user);

  return (
    <div style={{ height: '100%', padding: '20px' }}>
      
      {!activeApp && (
        <div>
          <h2 style={{ marginBottom: '20px', display:'flex', gap:'10px', alignItems:'center' }}>
            <Grid /> Applications
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '20px' }}>
            
            {/* CONDITION D'AFFICHAGE */}
            {/* On vérifie que user existe ET que son role_id est 5 */}
            {user && user.role_id === SUPER_ADMIN_ID && (
              <div 
                onClick={() => setActiveApp('users')}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'transform 0.2s',
                  boxShadow: 'var(--shadow)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ 
                    background: 'var(--accent-color)', 
                    padding: '15px', 
                    borderRadius: '50%', 
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                  <Users size={32} />
                </div>
                <span style={{ fontWeight: '600' }}>Utilisateurs</span>
              </div>
            )}

             <div style={{ padding: 20, border: '1px dashed var(--border-color)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', minHeight: '140px' }}>
                Bientôt...
             </div>

          </div>
        </div>
      )}

      {activeApp === 'users' && (
        <UserManagement 
            currentUser={user} 
            onClose={() => setActiveApp(null)} 
        />
      )}

    </div>
  );
 
}