import React, { useState, useEffect } from 'react';
import { FileText, XCircle, AlertTriangle, Check, X, Edit, Save, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ReportHistory.css';

export default function ReportHistory({ user }) {
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    
    // Données pour l'édition
    const [editData, setEditData] = useState([]);
    // Infos statiques (nom, zone) des équipements
    const [equipmentDetails, setEquipmentDetails] = useState({});

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await fetch(`${apiUrl}/reports`);
            if (res.ok) setReports(await res.json());
        } catch (e) { console.error(e); }
    };

    // --- GESTION DU VOLET LATÉRAL ---
    const handleOpenDetails = async (report) => {
        setSelectedReport(report);
        setIsEditing(false);
        
        let reportData = [];
        try {
            reportData = typeof report.report_data === 'string' 
                ? JSON.parse(report.report_data) 
                : report.report_data;
        } catch(e) { console.error(e); }
        
        setEditData(reportData);

        // Chargement des détails équipements (pour avoir les noms)
        try {
            const res = await fetch(`${apiUrl}/rondes/${report.demande_id}/details`);
            if(res.ok) {
                const details = await res.json();
                const dict = {};
                details.forEach(d => dict[d.id] = d);
                setEquipmentDetails(dict);
            }
        } catch(e) { console.error(e); }
    };

    const handleEditInput = (id, field, value) => {
        setEditData(prev => prev.map(item => 
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const saveModification = async () => {
        if(!window.confirm("Attention : Cela va rendre ce rapport obsolète et en créer un nouveau corrigé. Continuer ?")) return;

        const payload = {
            old_report_id: selectedReport.id,
            demande_id: selectedReport.demande_id,
            operator_id: selectedReport.operator_id,
            new_report_data: editData,
            modifier_id: user.id
        };

        try {
            const res = await fetch(`${apiUrl}/reports/modify`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Correction enregistrée.");
                setSelectedReport(null);
                fetchReports(); 
            } else {
                alert("Erreur serveur.");
            }
        } catch (e) { console.error(e); }
    };

    // Droits d'édition
    const canEdit = selectedReport && (
        user.role_id >= 4 || user.id === selectedReport.operator_id
    ) && selectedReport.etat !== 'obsolete';

    return (
        <div className="history_container">
            
            {/* HEADER HARMONISÉ AVEC USERMANAGEMENT */}
            <div className="history_header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={24}/> Historique des Rapports
                </h2>
                {/* CORRECTION ICI : Utilisation de navigate('/apps') au lieu de onClose */}
                <button onClick={() => navigate('/apps')} className="back_btn" title="Fermer">
                    <XCircle size={24}/>
                </button>
            </div>

            {/* TABLEAU */}
            <div className="table_wrapper">
                <table className="history_table">
                    <thead>
                        <tr>
                            <th>État</th>
                            <th>Ronde</th>
                            <th>Date Prévue</th>
                            <th>Opérateur</th>
                            <th>Date Réalisée</th>
                            <th>Demandeur</th>
                            <th style={{ textAlign: 'center' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map(r => (
                            <tr key={r.id}>
                                <td>
                                    <span className={`status_badge ${r.etat}`}>
                                        {r.etat === 'modifie' ? 'Modifié' : r.etat === 'obsolete' ? 'Obsolète' : 'Valide'}
                                    </span>
                                </td>
                                <td><strong>{r.round_name}</strong></td>
                                <td>{new Date(r.scheduled_date).toLocaleDateString()}</td>
                                <td>{r.operator_name}</td>
                                <td>{new Date(r.executed_at).toLocaleString()}</td>
                                <td>{r.creator_name}</td>
                                <td style={{ textAlign: 'center' }}>
                                    <button className="view_btn" onClick={() => handleOpenDetails(r)}>
                                        <Eye size={16}/> Voir
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* VOLET LATÉRAL (DÉTAILS) */}
            <div className={`side_panel ${selectedReport ? 'open' : ''}`}>
                <div className="panel_header">
                    <h3>Détails Rapport #{selectedReport?.id}</h3>
                    <button className="close_panel" onClick={() => setSelectedReport(null)}>
                        <X size={24}/>
                    </button>
                </div>

                {selectedReport && (
                    <div className="panel_content">
                        {/* Méta-données */}
                        <div className="report_meta">
                            <div className="meta_row"><span>Ronde :</span> <strong>{selectedReport.round_name}</strong></div>
                            <div className="meta_row"><span>Opérateur :</span> {selectedReport.operator_name}</div>
                            <div className="meta_row"><span>Exécuté le :</span> {new Date(selectedReport.executed_at).toLocaleString()}</div>
                        </div>

                        <div className="items_list">
                            {editData.map((item, index) => {
                                const details = equipmentDetails[item.id] || {};
                                const isBinary = details.equipement_val === 'binary';

                                return (
                                    <div key={index} className="report_item">
                                        <div className="ri_header">
                                            <strong>{details.name || `ID #${item.id}`}</strong>
                                            <span className="ri_zone">{details.zone}</span>
                                        </div>

                                        <div className="ri_body">
                                            {isEditing ? (
                                                /* MODE ÉDITION */
                                                <>
                                                    <div className="edit_row">
                                                        <label>État</label>
                                                        <select 
                                                            value={item.status} 
                                                            onChange={e => handleEditInput(item.id, 'status', e.target.value)}
                                                            className="edit_select"
                                                        >
                                                            <option value="1">OK</option>
                                                            <option value="0">NOK</option>
                                                        </select>
                                                    </div>
                                                    {!isBinary && (
                                                        <div className="edit_row">
                                                            <label>Valeur</label>
                                                            <input 
                                                                type="number" step="0.1" 
                                                                value={item.value} 
                                                                onChange={e => handleEditInput(item.id, 'value', e.target.value)}
                                                                className="edit_input"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="edit_row full">
                                                        <input 
                                                            type="text" 
                                                            value={item.comment} 
                                                            placeholder="Commentaire..."
                                                            onChange={e => handleEditInput(item.id, 'comment', e.target.value)}
                                                            className="edit_input"
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                /* MODE LECTURE */
                                                <>
                                                    <div className="read_row">
                                                        <span className={`ri_status ${item.status === '1' ? 'ok' : 'nok'}`}>
                                                            {item.status === '1' ? <Check size={16}/> : <AlertTriangle size={16}/>}
                                                            {item.status === '1' ? 'Fonctionnel' : 'Défaut'}
                                                        </span>
                                                        {item.value && <span className="ri_value">Val: <strong>{item.value}</strong></span>}
                                                    </div>
                                                    {item.comment && <div className="ri_comment">{item.comment}</div>}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="panel_footer">
                            {canEdit ? (
                                isEditing ? (
                                    <>
                                        <button className="cancel_edit_btn" onClick={() => setIsEditing(false)}>Annuler</button>
                                        <button className="save_edit_btn" onClick={saveModification}>
                                            <Save size={18}/> Confirmer
                                        </button>
                                    </>
                                ) : (
                                    <button className="edit_mode_btn" onClick={() => setIsEditing(true)}>
                                        <Edit size={18}/> Corriger
                                    </button>
                                )
                            ) : (
                                selectedReport.etat === 'obsolete' && 
                                <p className="obs_warning">Rapport obsolète.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {selectedReport && <div className="panel_overlay" onClick={() => setSelectedReport(null)}></div>}
        </div>
    );
}