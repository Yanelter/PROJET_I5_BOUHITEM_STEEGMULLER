import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login_Page';
import Dashboard from './pages/Dashboard';
import Zone from './pages/Zone';
import Apps from './pages/Apps';
import Alarms from './pages/Alarms';
import Profile from './pages/Profile';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  // --- AMÉLIORATION ICI ---
  // Au lieu de mettre null, on regarde si on était déjà connecté avant le rafraîchissement
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user_data');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const updateThemeInApp = (newCssValue) => { setTheme(newCssValue); };
  
  const handleLogout = () => { 
    setUser(null);
    localStorage.removeItem('user_data'); // On nettoie le stockage
  };

  if (!user) {
    return (
        <LoginPage 
            onLogin={(userData) => {
                setUser(userData);
                // On sauvegarde aussi ici (doublon de sécurité avec Login_Page)
                localStorage.setItem('user_data', JSON.stringify(userData));
                if (userData.theme) updateThemeInApp(userData.theme);
            }} 
        />
    );
  }

  return (
    <Router>
      <div className="app_container">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <h1 style={{ fontSize: '1.2rem' }}>HealthCheck360</h1>
          </div>
          <div className="user_info">
            <span style={{ marginRight: '10px', fontSize: '0.9rem' }}>
              Bonjour, <strong>{user.identifier}</strong>
            </span>
          </div>
        </header>
        
        <Sidebar user={user} />

        <main className="main_content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/zone" element={<Zone user={user} />} />
            
            {/* C'est ICI que ça fonctionne grâce à ton code : on passe user */}
            <Route path="/apps" element={<Apps user={user}/>} />
            
            <Route path="/alarms" element={
              user.permissions.admin ? <Alarms /> : <Navigate to="/" />
            } />
            
            <Route path="/profile" element={
              <Profile user={user} logout={handleLogout} updateThemeInApp={updateThemeInApp} />
            } />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;