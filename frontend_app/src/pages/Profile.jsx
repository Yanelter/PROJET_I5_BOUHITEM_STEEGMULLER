import React, { useState, useEffect } from 'react';
import { User, Shield, Save, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import './Profile.css'; 

export default function Profile({ user, logout, updateThemeInApp }) {
  // --- ÉTATS ---
  const [themesList, setThemesList] = useState([]);
  
  // On initialise avec l'ID du thème de l'utilisateur (ou 1 par défaut)
  const [selectedThemeId, setSelectedThemeId] = useState(user.themeId || 1);
  
  // États Mot de Passe
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  const [message, setMessage] = useState({ text: '', type: '' });

  // Définition sécurisée de l'URL API
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // --- CHARGEMENT DES THÈMES ---
  useEffect(() => {
    fetch(`${apiUrl}/themes`)
      .then(res => {
        if (!res.ok) throw new Error("Erreur réseau");
        return res.json();
      })
      .then(data => setThemesList(data))
      .catch(err => console.error("Erreur chargement thèmes", err));
  }, []);

  // --- FONCTIONS ---

  // 1. Changement de Thème
  const handleThemeChange = async (e) => {
    const newId = parseInt(e.target.value); // Convertir en entier
    setSelectedThemeId(newId);

    try {
      const res = await fetch(`${apiUrl}/user/theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, themeId: newId })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // On applique le nouveau CSS reçu du backend
        updateThemeInApp(data.cssValue); 
      }
    } catch (error) {
      console.error("Erreur update thème", error);
    }
  };

  // 2. Gestion Formulaire Mot de Passe
  const handlePwdChange = (e) => {
    setPwdForm({ ...pwdForm, [e.target.name]: e.target.value });
  };

  // 3. Soumission Mot de Passe
  const submitPassword = async () => {
    setMessage({ text: '', type: '' });

    if (!pwdForm.current || !pwdForm.new || !pwdForm.confirm) {
      setMessage({ text: "Veuillez remplir tous les champs.", type: "error" });
      return;
    }
    if (pwdForm.new !== pwdForm.confirm) {
      setMessage({ text: "Les nouveaux mots de passe ne correspondent pas.", type: "error" });
      return;
    }

    if (!window.confirm("Êtes-vous sûr de vouloir modifier votre mot de passe ?")) {
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/user/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          currentPassword: pwdForm.current, 
          newPassword: pwdForm.new 
        })
      });
      
      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Mot de passe modifié avec succès !", type: "success" });
        setPwdForm({ current: '', new: '', confirm: '' });
        setIsPasswordOpen(false);
      } else {
        setMessage({ text: data.error || "Erreur lors du changement.", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Impossible de contacter le serveur.", type: "error" });
    }
  };

  return (
    <div className="profile_container_centered">
      <div className="profile_card">
        
        {/* EN-TÊTE PROFIL */}
        <div className="profile_header">
            <div className="avatar_circle">
                <User size={32} />
            </div>
            <div>
                <h3>{user.identifier}</h3>
                <p className="user_email">{user.email}</p>
                <span className={`badge role_${user.role}`}>
                    {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                </span>
            </div>
        </div>

        <hr className="divider" />

        {/* SÉLECTION DU THÈME */}
        <div className="section_block">
            <label className="section_label">Thème de l'interface</label>
            <select 
                value={selectedThemeId} 
                onChange={handleThemeChange}
                className="theme_select"
            >
                {/* On s'assure que la liste n'est pas vide avant de mapper */}
                {themesList.length > 0 ? (
                    themesList.map(theme => (
                        <option key={theme.id} value={theme.id}>{theme.name}</option>
                    ))
                ) : (
                    <option disabled>Chargement...</option>
                )}
            </select>
        </div>

        {/* MODIFICATION MOT DE PASSE */}
        <div className="section_block">
            <button 
                className="accordion_btn" 
                onClick={() => setIsPasswordOpen(!isPasswordOpen)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Shield size={18}/> Sécurité & Mot de passe
                </div>
                {isPasswordOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {isPasswordOpen && (
                <div className="accordion_content">
                    {message.text && (
                        <div className={`msg_box ${message.type}`}>
                            {message.type === 'error' && <AlertTriangle size={16}/>}
                            {message.text}
                        </div>
                    )}

                    <div className="form_group">
                        <label>Mot de passe actuel</label>
                        <input 
                            type="password" name="current" 
                            value={pwdForm.current} onChange={handlePwdChange} 
                        />
                    </div>
                    <div className="form_group">
                        <label>Nouveau mot de passe</label>
                        <input 
                            type="password" name="new" 
                            value={pwdForm.new} onChange={handlePwdChange} 
                        />
                    </div>
                    <div className="form_group">
                        <label>Confirmer le nouveau mot de passe</label>
                        <input 
                            type="password" name="confirm" 
                            value={pwdForm.confirm} onChange={handlePwdChange} 
                        />
                    </div>

                    <button className="validate_btn" onClick={submitPassword}>
                        <Save size={18} /> Valider le changement
                    </button>
                </div>
            )}
        </div>

        <hr className="divider" />

        <button onClick={logout} className="logout_full_btn">
            Se déconnecter
        </button>
      </div>
    </div>
  );
}