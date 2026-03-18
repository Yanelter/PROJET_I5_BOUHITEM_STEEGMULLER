import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, Clock, ArrowLeft, AlertTriangle, Check } from 'lucide-react';
import './OperatorRounds.css';

export default function OperatorRounds({ user }) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    const [myRounds, setMyRounds] = useState([]);
    const [activeRound, setActiveRound] = useState(null);
    const [roundItems, setRoundItems] = useState([]);     
    const [planImage, setPlanImage] = useState(null); 
    
    // Structure : { equipId: { status: null, value: '', comment: '' } }
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
                
                if (items.length > 0 && items[0].plan_image) {
                    setPlanImage(`${apiUrl}${items[0].plan_image}`);
                }
                
                // Initialisation : Par défaut tout est VIDE (null)
                const initAnswers = {};
                items.forEach(i => {
                    initAnswers[i.id] = { 
                        status: null, // null = Ni OK, ni NOK
                        value: '',   
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
        // VÉRIFICATION : Est-ce qu'il reste des équipements non vérifiés (status === null) ?
        const hasUnanswered = Object.values(answers).some(ans => ans.status === null);
        if (hasUnanswered) {
            alert("⚠️ Vous devez indiquer l'état (OK ou NOK) pour tous les équipements avant d'envoyer.");
            return; // On bloque l'envoi
        }

        const formattedReport = Object.keys(answers).map(key => ({
            id: key,
            status: answers[key].status,
            value: answers[key].value,
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
            setPlanImage(null); 
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

    // --- MODE EXECUTION (SPLIT SCREEN) ---
    return (
        <div className="op_container execution_mode">
            <div className="execution_header_fixed">
                <button className="back_btn_simple" onClick={() => { setActiveRound(null); setPlanImage(null); }}>
                    <ArrowLeft size={20}/> Annuler
                </button>
                <h2>Ronde : {activeRound.name}</h2>
                <button className="finalize_btn top_btn" onClick={handleSubmit}>
                    <CheckCircle size={20}/> Envoyer
                </button>
            </div>

            <div className="execution_split">
                
                {/* PARTIE GAUCHE : QUESTIONS */}
                <div className="questions_panel">
                    {roundItems.map(item => {
                        const isAnalog = item.equipement_val === 'analog';
                        const currentStatus = answers[item.id]?.status;

                        // Définition de la classe CSS de la carte selon le statut
                        let cardClass = '';
                        if (currentStatus === '1') cardClass = 'status-ok';
                        if (currentStatus === '0') cardClass = 'status-nok';

                        return (
                            <div key={item.id} className={`question_card ${cardClass}`}>
                                <div className="q_info">
                                    <div>
                                        <strong style={{fontSize: '1.1rem'}}>{item.name}</strong>
                                        <div className="q_subtext">
                                            {item.zone || 'Sans zone'} • {isAnalog ? 'Mesure Analogique' : 'Contrôle Binaire'}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="q_inputs_row">
                                    <div className="input_group_op">
                                        <label>État :</label>
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

                                    {isAnalog && (
                                        <div className="input_group_op fade-in">
                                            <label>Valeur relevée :</label>
                                            <input 
                                                type="number" step="0.1" placeholder="Ex: 24.5"
                                                value={answers[item.id]?.value}
                                                onChange={e => handleInput(item.id, 'value', e.target.value)}
                                                className="main_input_op"
                                            />
                                        </div>
                                    )}

                                    <div className="input_group_op flex-grow">
                                        <label>Note / Observation :</label>
                                        <input 
                                            type="text" className="comment_input_op" placeholder="Optionnel..."
                                            value={answers[item.id]?.comment}
                                            onChange={e => handleInput(item.id, 'comment', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* PARTIE DROITE : PLAN INTERACTIF */}
                <div className="plan_panel">
                    <div className="plan_sticky_container">
                        <h3>Localisation des équipements</h3>
                        {planImage ? (
                            <div className="plan_image_wrapper">
                                <img src={planImage} alt="Plan" className="plan_img" />
                                
                                {roundItems.map(item => {
                                    const status = answers[item.id]?.status;
                                    
                                    // Définition de la classe CSS du marqueur selon le statut
                                    let markerClass = 'marker-neutral'; // Gris par défaut
                                    if (status === '1') markerClass = 'marker-ok';
                                    if (status === '0') markerClass = 'marker-nok';

                                    return (
                                        <div 
                                            key={`marker-${item.id}`}
                                            className={`plan_marker ${markerClass}`}
                                            style={{ left: `${item.x_axis}%`, top: `${item.y_axis}%` }}
                                        >
                                            <span className="marker_tooltip">{item.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="no_plan_text">Aucun plan associé.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}