import React, { useState, useEffect } from 'react';
import { Save, Calendar, User, ArrowLeft, FileText, MapPin, CheckSquare, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CreateRound.css';

export default function CreateRound({ user }) {
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const [operators, setOperators] = useState([]);
    // Structure: { "Plan RDC": { "Cuisine": [items...], "Hall": [items...] } }
    const [groupedData, setGroupedData] = useState({});
    
    const [title, setTitle] = useState('');
    const [selectedOperator, setSelectedOperator] = useState('');
    const [date, setDate] = useState('');
    const [selectedIds, setSelectedIds] = useState([]); 

    useEffect(() => {
        // 1. Charger Opérateurs
        fetch(`${apiUrl}/users/operators`).then(r => r.json()).then(setOperators).catch(console.error);
        
        // 2. Charger et Grouper les équipements (Plan > Zone > Items)
        fetch(`${apiUrl}/terrain/all-details`).then(r => r.json()).then(data => {
            const structure = {};

            data.forEach(item => {
                const pName = item.plan_name;
                const zName = item.zone && item.zone.trim() !== "" ? item.zone : "Zone non définie";

                if (!structure[pName]) structure[pName] = {};
                if (!structure[pName][zName]) structure[pName][zName] = [];
                
                structure[pName][zName].push(item);
            });
            setGroupedData(structure);
        }).catch(console.error);
    }, []);

    // Gestion Checkbox unique
    const handleCheck = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    // Gestion "Tout cocher" pour une ZONE spécifique
    const toggleZone = (items) => {
        const idsInZone = items.map(i => i.id);
        const allChecked = idsInZone.every(id => selectedIds.includes(id));
        
        if (allChecked) {
            // Tout décocher dans cette zone
            setSelectedIds(prev => prev.filter(id => !idsInZone.includes(id)));
        } else {
            // Tout cocher dans cette zone
            setSelectedIds(prev => [...new Set([...prev, ...idsInZone])]);
        }
    };

    const handleSubmit = async (e) => {
        if(e) e.preventDefault();
        if (!title || !selectedOperator || !date) return alert("Veuillez remplir les informations à gauche.");
        if (selectedIds.length === 0) return alert("Sélectionnez au moins un équipement.");

        const payload = {
            name: title,
            operator_id: selectedOperator,
            creator_id: user.id,
            scheduled_date: date,
            equipments_ids: selectedIds
        };

        const res = await fetch(`${apiUrl}/rondes`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("✅ Ronde créée avec succès !");
            navigate('/zone'); 
        } else { alert("❌ Erreur serveur."); }
    };

    return (
        <div className="create_round_container">
            {/* HEADER */}
            <div className="cr_header">
                <button onClick={() => navigate('/zone')} className="back_btn"><ArrowLeft size={20}/> Retour</button>
                <h2><FileText size={24}/> Nouvelle Ronde</h2>
                
                {/* BOUTON SAUVEGARDER PRINCIPAL (EN HAUT) */}
                <button className="header_save_btn" onClick={handleSubmit}>
                    <Save size={18}/> Enregistrer la Ronde
                </button>
            </div>

            <div className="cr_content">
                {/* SIDEBAR GAUCHE (INFOS) */}
                <div className="cr_sidebar">
                    <h3>Informations</h3>
                    <div className="form_group">
                        <label>Titre</label>
                        <input type="text" required placeholder="Ex: Vérification Matin" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                    <div className="form_group">
                        <label><User size={16}/> Opérateur</label>
                        <select required value={selectedOperator} onChange={e => setSelectedOperator(e.target.value)}>
                            <option value="">-- Choisir --</option>
                            {operators.map(op => <option key={op.id} value={op.id}>{op.identifier} ({op.email})</option>)}
                        </select>
                    </div>
                    <div className="form_group">
                        <label><Calendar size={16}/> Date</label>
                        <input type="date" required value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    
                    <div className="summary_box">
                        <strong>Total sélectionné :</strong>
                        <div className="big_number">{selectedIds.length}</div>
                        <span>équipements</span>
                    </div>
                </div>

                {/* ZONE DE DROITE (LISTE HIERARCHIQUE) */}
                <div className="cr_selection_area">
                    {Object.keys(groupedData).length === 0 ? <p className="loading_text">Chargement des données...</p> : 
                        Object.keys(groupedData).map(planName => (
                            <div key={planName} className="plan_section">
                                <h2 className="plan_title"><MapPin size={20}/> {planName}</h2>
                                
                                <div className="zones_grid_layout">
                                    {Object.keys(groupedData[planName]).map(zoneName => {
                                        const itemsInZone = groupedData[planName][zoneName];
                                        const allZoneChecked = itemsInZone.every(i => selectedIds.includes(i.id));

                                        return (
                                            <div key={zoneName} className="zone_wrapper">
                                                {/* En-tête de la ZONE */}
                                                <div className="zone_header" onClick={() => toggleZone(itemsInZone)}>
                                                    <div className="zone_name_group">
                                                        {allZoneChecked ? <CheckSquare size={18} color="#10b981"/> : <Square size={18} color="#666"/>}
                                                        <strong>{zoneName}</strong>
                                                    </div>
                                                    <span className="count_badge">{itemsInZone.length}</span>
                                                </div>

                                                {/* Liste des équipements */}
                                                <div className="zone_items_list">
                                                    {itemsInZone.map(item => (
                                                        <label key={item.id} className={`item_row ${selectedIds.includes(item.id) ? 'checked' : ''}`}>
                                                            <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => handleCheck(item.id)}/>
                                                            <span>{item.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}