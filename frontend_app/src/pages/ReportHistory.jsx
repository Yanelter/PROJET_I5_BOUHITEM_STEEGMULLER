import React, { useState, useEffect } from 'react';
import { FileText, XCircle, AlertTriangle, Check, X, Edit, Save, Eye, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ReportHistory.css';

export default function ReportHistory({ user }) {
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    
    const [editData, setEditData] = useState([]);
    const [equipmentDetails, setEquipmentDetails] = useState({});
    const [groupedPlans, setGroupedPlans] = useState([]);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await fetch(`${apiUrl}/reports`);
            if (res.ok) setReports(await res.json());
        } catch (e) { console.error(e); }
    };

    // --- FONCTION D'EXPORT CSV (KPI) ---
    const exportToCSV = () => {
        const headers = ["ID", "Ronde", "Operateur", "Date_Prevue", "Date_Realisee", "Etat"];
        
        const rows = reports.map(r => [
            r.id,
            r.round_name,
            r.operator_name,
            new Date(r.scheduled_date).toLocaleDateString(),
            new Date(r.executed_at).toLocaleString(),
            r.etat
        ]);

        // On ajoute \uFEFF (le BOM) au début pour Excel et on utilise le ";"
        const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(";")).join("\n");
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "KPI_HealthCheck360.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleOpenDetails = async (report) => {
        setSelectedReport(report);
        setIsEditing(false);
        setGroupedPlans([]); 
        
        let reportData = [];
        try {
            reportData = typeof report.report_data === 'string'
                ? JSON.parse(report.report_data)
                : report.report_data;
        } catch(e) { console.error(e); }
        
        setEditData(reportData);

        try {
            const res = await fetch(`${apiUrl}/rondes/${report.demande_id}/details`);
            if(res.ok) {
                const details = await res.json();
                const dict = {};
                details.forEach(d => dict[d.id] = d);
                setEquipmentDetails(dict);

                const planGroups = {};
                details.forEach(item => {
                    const planKey = item.plan_image;
                    if (planKey) {
                        if (!planGroups[planKey]) {
                            planGroups[planKey] = {
                                name: item.plan_name || 'Plan de la zone',
                                image: item.plan_image,
                                equipments: []
                            };
                        }
                        planGroups[planKey].equipments.push(item);
                    }
                });
                setGroupedPlans(Object.values(planGroups));
            }
        } catch(e) { console.error(e); }
    };

    const handleEditInput = (id, field, value) => {
        setEditData(prev => prev.map(item =>
            item.id.toString() === id.toString() ? { ...item, [field]: value } : item
        ));
    };

    const saveModification = async () => {
        if(!window.confirm("Attention : Cela va rendre ce rapport obsolète et en créer un nouveau corrigé. Continuer ?")) return;

        const payload = {
            old_report_id: selectedReport.id,
            demande_id: selectedReport.demande_id,
            operator_id: selectedReport.operator_id,
            new_report_data: editData,
            modifier_id: user?.id
        };

        try {
            const res = await fetch(`${apiUrl}/reports/modify`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setSelectedReport(null);
                fetchReports();
            } else {
                alert("Erreur serveur.");
            }
        } catch (e) { console.error(e); }
    };

    const canEdit = selectedReport && user && (
        user.role_id >= 4 || user.id === selectedReport.operator_id
    ) && selectedReport.etat !== 'obsolete';

    return (
        <div className="history_container">
            {/* HEADER AVEC BOUTON CSV */}
            <div className="history_header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <FileText size={28} color="#a855f7"/>
                    <h2 style={{ margin: 0 }}>Historique des Rapports</h2>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="export_csv_btn" onClick={exportToCSV}>
                        <FileSpreadsheet size={18}/> KPI (CSV)
                    </button>
                    <button onClick={() => navigate('/apps')} className="back_btn" title="Fermer">
                        <XCircle size={28}/>
                    </button>
                </div>
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

            {/* MODALE CENTRALE */}
            {selectedReport && (
                <div className="report_modal_overlay">
                    <div className="report_modal_content">
                        
                        <div className="rm_header">
                            <div>
                                <h3>Détails Rapport #{selectedReport.id} - {selectedReport.round_name}</h3>
                                <div className="rm_meta">
                                    <span>Opérateur : <strong>{selectedReport.operator_name}</strong></span>
                                    <span>•</span>
                                    <span>Exécuté le : {new Date(selectedReport.executed_at).toLocaleString()}</span>
                                </div>
                            </div>
                            <button className="close_modal_btn" onClick={() => setSelectedReport(null)}>
                                <X size={28}/>
                            </button>
                        </div>

                        <div className="rm_body_split">
                            {/* PARTIE GAUCHE : QUESTIONS ET CORRECTIONS */}
                            <div className="rm_questions_panel">
                                {editData.map((item, index) => {
                                    const details = equipmentDetails[item.id] || {};
                                    const isBinary = details.equipement_val === 'binary';

                                    return (
                                        <div key={index} className={`report_item ${item.status === '0' ? 'item_nok' : 'item_ok'}`}>
                                            <div className="ri_header">
                                                <strong className="ri_name">{details.name || `Équipement #${item.id}`}</strong>
                                                <span className="ri_zone">{details.zone || 'Sans zone'}</span>
                                            </div>

                                            <div className="ri_body">
                                                {isEditing ? (
                                                    <div className="edit_form_row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                        <select
                                                            value={item.status}
                                                            onChange={e => handleEditInput(item.id, 'status', e.target.value)}
                                                            className="styled_select"
                                                        >
                                                            <option value="1">✅ OK</option>
                                                            <option value="0">❌ NOK</option>
                                                        </select>
                                                        
                                                        {!isBinary && (
                                                            <input
                                                                type="number" step="0.1"
                                                                value={item.value || ''}
                                                                onChange={e => handleEditInput(item.id, 'value', e.target.value)}
                                                                className="styled_input"
                                                                style={{ maxWidth: '100px' }}
                                                                placeholder="Valeur"
                                                            />
                                                        )}
                                                        
                                                        <input
                                                            type="text"
                                                            value={item.comment || ''}
                                                            placeholder="Note ou observation..."
                                                            onChange={e => handleEditInput(item.id, 'comment', e.target.value)}
                                                            className="styled_input"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="read_mode_flex">
                                                        <span className={`ri_status ${item.status === '1' ? 'ok' : 'nok'}`}>
                                                            {item.status === '1' ? <Check size={16}/> : <AlertTriangle size={16}/>}
                                                            {item.status === '1' ? 'Fonctionnel' : 'Défaut'}
                                                        </span>
                                                        {item.value && <span className="ri_value">Val: <strong>{item.value}</strong></span>}
                                                        {item.comment && <div className="ri_comment">"{item.comment}"</div>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* PARTIE DROITE : PLANS MULTIPLES */}
                            <div className="rm_plan_panel">
                                <h4 className="rm_plan_main_title">Localisations</h4>
                                <div className="rm_plan_scroll_area">
                                    {groupedPlans.length > 0 ? (
                                        groupedPlans.map((plan, index) => (
                                            <div key={index} className="rm_single_plan_card">
                                                <h5 className="rm_plan_title">{plan.name}</h5>
                                                <div className="rm_plan_wrapper">
                                                    <img src={`${apiUrl}${plan.image}`} alt={plan.name} className="rm_plan_img" />
                                                    
                                                    {plan.equipments.map(equip => {
                                                        const currentItem = editData.find(e => e.id.toString() === equip.id.toString());
                                                        const currentStatus = currentItem ? currentItem.status : null;
                                                        
                                                        return (
                                                            <div
                                                                key={`marker-${equip.id}`}
                                                                className={`plan_marker ${currentStatus === '1' ? 'marker-ok' : currentStatus === '0' ? 'marker-nok' : 'marker-neutral'}`}
                                                                style={{ left: `${equip.x_axis}%`, top: `${equip.y_axis}%` }}
                                                            >
                                                                <span className="marker_tooltip">{equip.name}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="rm_no_plan">Aucun plan associé à cette ronde.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* FOOTER : ACTIONS */}
                        <div className="rm_footer">
                            <div style={{ flex: 1 }}></div>
                            {canEdit ? (
                                isEditing ? (
                                    <div className="edit_actions">
                                        <button className="cancel_edit_btn" onClick={() => setIsEditing(false)}>Annuler</button>
                                        <button className="save_edit_btn" onClick={saveModification}>
                                            <Save size={18}/> Confirmer la correction
                                        </button>
                                    </div>
                                ) : (
                                    <button className="edit_mode_btn" onClick={() => setIsEditing(true)}>
                                        <Edit size={18}/> Corriger le rapport
                                    </button>
                                )
                            ) : (
                                selectedReport.etat === 'obsolete' &&
                                <p className="obs_warning"><AlertTriangle size={16}/> Ce rapport est obsolète et ne peut plus être modifié.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}