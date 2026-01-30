import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- IMPORT DES PAGES ---
import LoginPage from './pages/Login_Page';
import Dashboard from './pages/Dashboard';
import Zone from './pages/Zone';
import Apps from './pages/Apps';
import Alarms from './pages/Alarms';
import Profile from './pages/Profile';

// --- IMPORT DES COMPOSANTS ---
import Sidebar from './components/Sidebar';

// --- IMPORT CSS ---
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  
  // Gestion du thème global (récupère le choix précédent ou met 'light' par défaut)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // EFFET : Applique le thème sur le <body> à chaque changement
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fonction passée au Profil pour changer le thème dynamiquement
  const updateThemeInApp = (newCssValue) => {
    setTheme(newCssValue);
  };

  // Fonction de déconnexion
  const handleLogout = () => {
    setUser(null);
  };

  // --- VUE 1 : SI PAS CONNECTÉ ---
  if (!user) {
    return (
        <LoginPage 
            onLogin={(userData) => {
                setUser(userData);
                // Si l'utilisateur a un thème préféré en BDD, on l'applique tout de suite
                if (userData.theme) {
                    updateThemeInApp(userData.theme);
                }
            }} 
        />
    );
  }

  // --- VUE 2 : APPLICATION CONNECTÉE (ROUTER) ---
  return (
    <Router>
      <div className="app_container">
        
        {/* HEADER (Fixe en haut) */}
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             {/* Titre ou Logo */}
             <h1 style={{ fontSize: '1.2rem' }}>HealthCheck360</h1>
          </div>
          
          <div className="user_info">
            <span style={{ marginRight: '10px', fontSize: '0.9rem' }}>
              Bonjour, <strong>{user.identifier}</strong>
            </span>
          </div>
        </header>
        
        {/* SIDEBAR (Menu Latéral Gauche) */}
        {/* On passe le rôle pour savoir si on affiche "Alarmes" ou pas */}
        <Sidebar role={user.role} />

        {/* MAIN CONTENT (Zone centrale qui change) */}
        <main className="main_content">
          <Routes>
            {/* Route par défaut (Accueil) */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Pages accessibles à tous */}
            <Route path="/zone" element={<Zone role={user.role} />} />
            <Route path="/apps" element={<Apps />} />
            
            {/* Route PROTÉGÉE pour les Alarmes (Admin uniquement) */}
            <Route path="/alarms" element={
              user.role === 'admin' ? <Alarms /> : <Navigate to="/" />
            } />
            
            {/* Page Profil (avec props pour gérer logout et thème) */}
            <Route path="/profile" element={
              <Profile 
                user={user} 
                logout={handleLogout} 
                updateThemeInApp={updateThemeInApp}
              />
            } />
            
            {/* Si l'URL n'existe pas, redirection vers Dashboard */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

      </div>
    </Router>
  );
}

export default App;