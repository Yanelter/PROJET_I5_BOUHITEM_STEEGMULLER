import React, { useState, useEffect } from 'react';
import { Bell, ArrowLeft, AlertTriangle, MapPin, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Alarms.css';

export default function Alarms() {
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const [alarms, setAlarms] = useState([]);

    useEffect(() => {
        fetchAlarms();
        
        // Optionnel : Rafraîchissement automatique toutes les 30 secondes
        const interval = setInterval(fetchAlarms, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchAlarms = async () => {
        try {
            const res = await fetch(`${apiUrl}/alarms/active`);
            if (res.ok) setAlarms(await res.json());
        } catch (e) { console.error(e); }
    };

    return (
        <div className="alarms_container">
            {/* HEADER */}
            <div className="alarms_header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bell size={24} color="#ef4444" /> Alarmes Actives
                </h2>
            </div>

            {/* CONTENU */}
            <div className="table_wrapper">
                {alarms.length === 0 ? (
                    <div className="no_alarms_state">
                        <CheckCircleIcon />
                        <h3>Aucune alarme active</h3>
                        <p>Tous les équipements binaires sont fonctionnels.</p>
                    </div>
                ) : (
                    <table className="alarms_table">
                        <thead>
                            <tr>
                                <th>Priorité</th>
                                <th>Équipement</th>
                                <th>Type</th>
                                <th>Plan / Localisation</th>
                                <th>Zone</th>
                                <th>Dernier Commentaire</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alarms.map(alarm => (
                                <tr key={alarm.id} className="row_alarm">
                                    <td style={{ textAlign: 'center' }}>
                                        <span className="badge_priority">
                                            <AlertTriangle size={14} /> DÉFAUT
                                        </span>
                                    </td>
                                    <td><strong>{alarm.name}</strong></td>
                                    <td>
                                        <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                                            <Settings size={14} className="text_secondary"/> {alarm.type_name}
                                        </div>
                                    </td>
                                    <td>{alarm.plan_name}</td>
                                    <td>
                                        <span className="badge_zone"><MapPin size={12}/> {alarm.zone || 'N/A'}</span>
                                    </td>
                                    <td className="cell_comment">
                                        {alarm.comment || <span className="text_secondary italic">- Aucun -</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

// Petit composant SVG interne pour l'état vide
function CheckCircleIcon() {
    return (
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '15px', opacity: 0.8 }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
    );
}