import React, { useState, useEffect } from 'react';
import { Sun, Moon, Lock, Mail, User } from 'lucide-react';
import './Login_Page.css';

export default function LoginPage({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [identifier, setIdentifier] = useState(''); 
  
  // On renomme 'email' en 'loginInput' car cela peut être les deux
  const [loginInput, setLoginInput] = useState(''); 
  
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [cssTheme, setCssTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.body.setAttribute('data-theme', cssTheme);
    localStorage.setItem('theme', cssTheme);
  }, [cssTheme]);

  const toggleTheme = () => {
    setCssTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const endpoint = isRegistering ? '/register' : '/login';
    
    // Construction des données
    let payload;
    if (isRegistering) {
        // Pour l'inscription, on a besoin de l'email spécifique (qui est dans loginInput)
        // Note : Pour faire propre, lors de l'inscription, on demandera explicitement l'email.
        // Ici, on assume que loginInput EST l'email lors de l'inscription pour simplifier,
        // mais l'idéal serait d'avoir des champs séparés lors de l'inscription.
        payload = { identifier, email: loginInput, password };
    } else {
        // Pour la connexion : on envoie 'login'
        payload = { login: loginInput, password };
    }

    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (isRegistering) {
          setSuccessMsg("Compte créé avec succès ! Connectez-vous.");
          setIsRegistering(false);
          setPassword('');
        } else {
          if (data.user.theme) {
             const dbThemeToCss = data.user.theme === 'sombre' ? 'dark' : 'light';
             setCssTheme(dbThemeToCss);
          }
          onLogin(data.user);
        }
      } else {
        setError(data.error || "Une erreur est survenue.");
      }
    } catch (err) {
      setError("Impossible de contacter le serveur.");
    }
  };

  return (
    <div className="login_container">
      <button className="theme_toggle" onClick={toggleTheme} type="button">
        {cssTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <div className="login_card">
        <h2>HealthCheck360</h2>
        <p className="subtitle">
          {isRegistering ? "Créer un nouveau compte" : "Identifiez-vous"}
        </p>

        {error && <div className="message error_message">{error}</div>}
        {successMsg && <div className="message success_message">{successMsg}</div>}

        <form onSubmit={handleSubmit}>
          
          {isRegistering && (
            <div className="input_group">
              <User className="icon" size={18} />
              <input 
                type="text" 
                placeholder="Identifiant (ex: YaMa)" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required 
              />
            </div>
          )}

          <div className="input_group">
            {/* L'icône change selon le mode */}
            {isRegistering ? <Mail className="icon" size={18} /> : <User className="icon" size={18} />}
            
            <input 
              /* IMPORTANT : type="text" pour accepter un identifiant sans @ */
              type={isRegistering ? "email" : "text"} 
              placeholder={isRegistering ? "Email obligatoire" : "Email ou Identifiant"} 
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              required 
            />
          </div>

          <div className="input_group">
            <Lock className="icon" size={18} />
            <input 
              type="password" 
              placeholder="Mot de passe" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="login_btn">
            {isRegistering ? "S'inscrire" : "Connexion"}
          </button>
        </form>

        <div className="toggle_container">
          <p>
            {isRegistering ? "Déjà un compte ?" : "Pas encore de compte ?"}
            <span 
              className="toggle_link" 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setSuccessMsg('');
              }}
            >
              {isRegistering ? " Se connecter" : " Créer un compte"}
            </span>
          </p>
        </div>

      </div>
    </div>
  );
}