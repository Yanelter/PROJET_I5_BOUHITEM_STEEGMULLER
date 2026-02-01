import React, { useState, useEffect } from 'react';
import { User, Shield, Save, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import './Profile.css'; 

export default function Profile({ user, logout, updateThemeInApp }) {
  const [themesList, setThemesList] = useState([]);
  const [selectedThemeId, setSelectedThemeId] = useState(user.themeId || 1);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetch(`${apiUrl}/themes`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setThemesList(data))
      .catch(err => console.error(err));
  }, []);

  const handleThemeChange = async (e) => {
    const newId = parseInt(e.target.value);
    setSelectedThemeId(newId);
    try {
      const res = await fetch(`${apiUrl}/user/theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, themeId: newId })
      });
      const data = await res.json();
      if (res.ok) updateThemeInApp(data.cssValue); 
    } catch (error) { console.error(error); }
  };

  const handlePwdChange = (e) => setPwdForm({ ...pwdForm, [e.target.name]: e.target.value });

  const submitPassword = async () => {
    setMessage({ text: '', type: '' });
    if (!pwdForm.current || !pwdForm.new || !pwdForm.confirm) return setMessage({ text: "Champs vides", type: "error" });
    if (pwdForm.new !== pwdForm.confirm) return setMessage({ text: "Mots de passe différents", type: "error" });
    
    try {
      const res = await fetch(`${apiUrl}/user/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, currentPassword: pwdForm.current, newPassword: pwdForm.new })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: "Succès !", type: "success" });
        setPwdForm({ current: '', new: '', confirm: '' });
        setIsPasswordOpen(false);
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (error) { setMessage({ text: "Erreur serveur", type: "error" }); }
  };

  return (
    <div className="profile_container_centered">
      <div className="profile_card">
        <div className="profile_header">
            <div className="avatar_circle"><User size={32} /></div>
            <div>
                <h3>{user.identifier}</h3>
                <p className="user_email">{user.email}</p>
                {/* AFFICHE LE NOM DU RÔLE DEPUIS LA BDD */}
                <span className="badge role_admin" style={{ background: 'var(--accent-color)' }}>
                    {user.role_name}
                </span>
            </div>
        </div>

        <hr className="divider" />
        
        {/* ... (Reste du code identique pour le thème et mot de passe) ... */}
        
        <div className="section_block">
            <label className="section_label">Thème</label>
            <select value={selectedThemeId} onChange={handleThemeChange} className="theme_select">
                {themesList.map(theme => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
            </select>
        </div>

        <div className="section_block">
             <button className="accordion_btn" onClick={() => setIsPasswordOpen(!isPasswordOpen)}>
                <span><Shield size={18}/> Sécurité</span>
                {isPasswordOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {isPasswordOpen && (
                <div className="accordion_content">
                    {message.text && <div className={`msg_box ${message.type}`}>{message.text}</div>}
                    <input type="password" name="current" placeholder="Actuel" value={pwdForm.current} onChange={handlePwdChange} style={{width:'100%', marginBottom:10, padding:8}}/>
                    <input type="password" name="new" placeholder="Nouveau" value={pwdForm.new} onChange={handlePwdChange} style={{width:'100%', marginBottom:10, padding:8}}/>
                    <input type="password" name="confirm" placeholder="Confirmer" value={pwdForm.confirm} onChange={handlePwdChange} style={{width:'100%', marginBottom:10, padding:8}}/>
                    <button className="validate_btn" onClick={submitPassword}><Save size={18}/> Valider</button>
                </div>
            )}
        </div>

        <hr className="divider" />
        <button onClick={logout} className="logout_full_btn">Se déconnecter</button>
      </div>
    </div>
  );
}