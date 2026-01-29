import React, { useState } from 'react';
import LoginPage from './pages/Login_Page';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  // Si pas connecté, afficher Login
  if (!user) {
    return <LoginPage onLogin={(userData) => setUser(userData)} />;
  }

  // Application (Dashboard)
  return (
    <div className="app_container">
      <header className="header">
        <h1>HealthCheck360</h1>
        <div className="user_info">
          {/* Affichage de l'identifiant au lieu de l'email */}
          <span>{user.identifier}</span> 
          <button onClick={() => setUser(null)} className="logout_btn">Déconnexion</button>
        </div>
      </header>
      
      <aside className="left_side">
        <nav>
          <ul>
            <li>Tableau de bord</li>
            <li>Patients</li>
            <li>Paramètres</li>
          </ul>
        </nav>
      </aside>

      <main className="main_content">
        {/* 'user.role' contient la valeur de 'role_type' envoyée par le back */}
        <h2>Espace {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</h2>
        <p>Bienvenue, <strong>{user.identifier}</strong>.</p>
        <p>Votre thème préféré en base de données est : {user.theme}</p>
      </main>
    </div>
  );
}

export default App;