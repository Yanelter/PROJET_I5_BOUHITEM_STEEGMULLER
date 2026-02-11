import React, { useState } from 'react';
import { Users, Grid, Map as MapIcon, Settings, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserManagement from '../components/UserManagement';
import Zooning from '../components/Zooning'; 
import Equipements from '../components/Equipements'; 

export default function Apps({ user }) {
  const navigate = useNavigate();
  const [activeApp, setActiveApp] = useState(null);

  const SUPER_ADMIN_ID = 5;
  const ADMIN_ID = 4;

  const canAccessEquip = user && (parseInt(user.role_id) === ADMIN_ID || parseInt(user.role_id) === SUPER_ADMIN_ID);
  const canAccessZooning = canAccessEquip; 
  const canAccessUsers = user && parseInt(user.role_id) === SUPER_ADMIN_ID;

  const cardStyle = {
    backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', boxShadow: 'var(--shadow)', transition: 'transform 0.2s'
  };
  const iconBgStyle = { background: 'var(--accent-color)', padding: '15px', borderRadius: '50%', color: '#fff' };

  return (
    <div style={{ height: '100%', padding: '20px' }}>
      
      {!activeApp && (
        <div>
          <h2 style={{ marginBottom: '20px', display:'flex', gap:'10px', alignItems:'center' }}>
            <Grid /> Applications
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '20px' }}>
            
            {/* APP : USERS */}
            {canAccessUsers && (
              <div onClick={() => setActiveApp('users')} style={cardStyle} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <div style={iconBgStyle}><Users size={32} /></div>
                <span style={{ fontWeight: '600' }}>Utilisateurs</span>
              </div>
            )}

            {/* APP : ZOONING */}
            {canAccessZooning && (
              <div onClick={() => setActiveApp('zooning')} style={cardStyle} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <div style={iconBgStyle}><MapIcon size={32} /></div>
                <span style={{ fontWeight: '600' }}>Zooning</span>
              </div>
            )}

            {/* APP : ÉQUIPEMENTS */}
            {canAccessEquip && (
              <div onClick={() => setActiveApp('equipements')} style={cardStyle} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <div style={iconBgStyle}><Settings size={32} /></div>
                <span style={{ fontWeight: '600' }}>Équipements</span>
              </div>
            )}

            {/* APP : HISTORIQUE RAPPORTS (NOUVEAU) */}
            <div onClick={() => navigate('/report-history')} style={cardStyle} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <div style={iconBgStyle}><ClipboardList size={32} /></div>
                <span style={{ fontWeight: '600', textAlign:'center' }}>Historique Rapports</span>
            </div>

          </div>
        </div>
      )}

      {activeApp === 'users' && <UserManagement currentUser={user} onClose={() => setActiveApp(null)} />}
      {activeApp === 'zooning' && <Zooning onClose={() => setActiveApp(null)} />}
      {activeApp === 'equipements' && <Equipements onClose={() => setActiveApp(null)} />}

    </div>
  );
}