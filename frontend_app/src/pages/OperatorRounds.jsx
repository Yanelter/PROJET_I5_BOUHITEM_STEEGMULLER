import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, Clock, ArrowLeft, AlertTriangle, Check } from 'lucide-react';
import './OperatorRounds.css';

export default function OperatorRounds({ user }) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    const [myRounds, setMyRounds] = useState([]);
    const [activeRound, setActiveRound] = useState(null);
    const [roundItems, setRoundItems] = useState([]);     
    
    // Structure modifiée : { equipId: { status: 'OK', value: '', comment: '' } }
    const [answers, setAnswers] = useState({});

    useEffect(() => {
        if(user && user.id) fetchRounds();
    }, [user]);

    const fetchRounds = async () => {
        try {
            const res = await fetch(`${apiUrl}/rondes/assigned/${user.id}`);
            if(res.ok) setMyRounds(await res.json());
        } catch(e) { console.error(e); }
    };

    const startRound = async (round) => {
        try {
            const res = await fetch(`${apiUrl}/rondes/${round.id}/details`);
            if (res.ok) {
                const items = await res.json();
                setRoundItems(items);
                setActiveRound(round);
                
                // Initialisation : Par défaut tout est "OK" (1)
                const initAnswers = {};
                items.forEach(i => {
                    initAnswers[i.id] = { 
                        status: '1', // 1 = OK, 0 = NOK
                        value: '',   // Pour l'analogique
                        comment: '' 
                    };
                });
                setAnswers(initAnswers);
            }
        } catch(e) { console.error(e); }
    };

    const handleInput = (id, field, val) => {
        setAnswers(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: val }
        }));
    };

    const handleSubmit = async () => {
        // Validation simple : si analogique, valeur requise ? (Optionnel)
        
        const formattedReport = Object.keys(answers).map(key => ({
            id: key,
            status: answers[key].status, // OK/NOK
            value: answers[key].value,   // Valeur chiffrée (si existe)
            comment: answers[key].comment
        }));

        const payload = {
            operator_id: user.id,
            report_data: formattedReport,
            etat: 'valide'
        };

        const res = await fetch(`${apiUrl}/rondes/${activeRound.id}/submit`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("✅ Rapport envoyé avec succès !");
            setActiveRound(null);
            fetchRounds();
        } else {
            alert("❌ Erreur lors de l'envoi.");
        }
    };

    // --- LISTE DES RONDES ---
    if (!activeRound) {
        return (
            <div className="op_container">
                <h2><Clock size={24}/> Mes Rondes à effectuer</h2>
                <div className="rounds_grid">
                    {myRounds.length === 0 ? <p style={{opacity: 0.6}}>Aucune ronde prévue.</p> : myRounds.map(r => (
                        <div key={r.id} className="round_card">
                            <div className="rc_header">
                                <h3>{r.name}</h3>
                                <span className="date_badge">{new Date(r.scheduled_date).toLocaleDateString()}</span>
                            </div>
                            <p className="rc_creator">Demandé par : <strong>{r.creator_name}</strong></p>
                            <button className="start_btn" onClick={() => startRound(r)}>
                                <Play size={16}/> Commencer
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // --- MODE EXECUTION ---
    return (
        <div className="op_container">
            <div className="execution_header">
                <button className="back_btn_simple" onClick={() => setActiveRound(null)}>
                    <ArrowLeft size={20}/> Annuler
                </button>
                <h2>Exécution : {activeRound.name}</h2>
            </div>

            <div className="questions_list">
                {roundItems.map(item => {
                    const isAnalog = item.equipement_val === 'analog';
                    const currentStatus = answers[item.id]?.status;

                    return (
                        <div key={item.id} className={`question_card ${currentStatus === '0' ? 'status-nok' : ''}`}>
                            <div className="q_info">
                                <div>
                                    <strong style={{fontSize: '1.1rem'}}>{item.name}</strong>
                                    <div className="q_subtext">
                                        {item.zone || 'Sans zone'} • {isAnalog ? 'Mesure Analogique' : 'Contrôle Binaire'}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="q_inputs_row">
                                
                                {/* 1. QUESTION COMMUNE : ÉTAT (OK/NOK) */}
                                <div className="input_group_op">
                                    <label>État de fonctionnement :</label>
                                    <div className="toggle_status">
                                        <button 
                                            className={`status_btn ok ${currentStatus === '1' ? 'active' : ''}`}
                                            onClick={() => handleInput(item.id, 'status', '1')}
                                        >
                                            <Check size={18}/> OK
                                        </button>
                                        <button 
                                            className={`status_btn nok ${currentStatus === '0' ? 'active' : ''}`}
                                            onClick={() => handleInput(item.id, 'status', '0')}
                                        >
                                            <AlertTriangle size={18}/> NOK
                                        </button>
                                    </div>
                                </div>

                                {/* 2. QUESTION ANALOGIQUE SEULEMENT : VALEUR */}
                                {isAnalog && (
                                    <div className="input_group_op fade-in">
                                        <label>Valeur relevée :</label>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            placeholder="Ex: 24.5"
                                            value={answers[item.id]?.value}
                                            onChange={e => handleInput(item.id, 'value', e.target.value)}
                                            className="main_input_op"
                                        />
                                    </div>
                                )}

                                {/* 3. COMMENTAIRE (Toujours dispo) */}
                                <div className="input_group_op flex-grow">
                                    <label>Note / Observation :</label>
                                    <input 
                                        type="text" 
                                        className="comment_input_op"
                                        placeholder="Optionnel..."
                                        value={answers[item.id]?.comment}
                                        onChange={e => handleInput(item.id, 'comment', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="submit_area">
                <button className="finalize_btn" onClick={handleSubmit}>
                    <CheckCircle size={20}/> Terminer et Envoyer
                </button>
            </div>
        </div>
    );
}