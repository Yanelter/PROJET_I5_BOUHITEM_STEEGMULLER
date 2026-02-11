import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Nécessaire pour le bouton
import { 
    Map as MapIcon, PlusCircle, Save, Lock, Unlock, Info, Trash2, X, ClipboardList,
    Thermometer, Lightbulb, Fan, Activity, Droplets, Zap, Lock as LockIcon, Speaker, Radio, Camera, Settings
} from 'lucide-react';
import './Zone.css';

const ZONE_PALETTE = [
    '#3b82f6', '#ef4444', '#10b981', '#f97316', '#8b5cf6', 
    '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#d946ef'
];

const getZoneColor = (zoneName) => {
    if (!zoneName) return 'var(--accent-color)';
    let hash = 0;
    for (let i = 0; i < zoneName.length; i++) {
        hash = zoneName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % ZONE_PALETTE.length;
    return ZONE_PALETTE[index];
};

const getIconComponent = (iconName, size=24) => {
    const icons = {
        'Thermometer': <Thermometer size={size}/>,
        'Lightbulb': <Lightbulb size={size}/>,
        'Fan': <Fan size={size}/>,
        'Droplets': <Droplets size={size}/>,
        'Zap': <Zap size={size}/>,
        'Activity': <Activity size={size}/>,
        'Lock': <LockIcon size={size}/>,
        'Speaker': <Speaker size={size}/>,
        'Camera': <Camera size={size}/>,
        'Radio': <Radio size={size}/>
    };
    return icons[iconName] || <Settings size={size}/>;
};

export default function Zone({ user }) {
    const navigate = useNavigate(); // Hook pour naviguer
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    const isAdmin = user && (parseInt(user.role_id) === 4 || parseInt(user.role_id) === 5);

    const [plansList, setPlansList] = useState([]);
    const [typesList, setTypesList] = useState([]);
    const [itemsOnMap, setItemsOnMap] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [selectedItem, setSelectedItem] = useState(null); 
    const [unlockedItems, setUnlockedItems] = useState([]); 
    const [form, setForm] = useState({ name: '', type_id: '', zone: '', comment: '' });
    const mapRef = useRef(null);
    const [isDragging, setIsDragging] = useState(null); 

    useEffect(() => {
        const loadData = async () => {
            try {
                const resPlans = await fetch(`${apiUrl}/zooning/plans`);
                if(resPlans.ok) setPlansList(await resPlans.json());
            } catch (e) { console.error(e); }

            try {
                const resTypes = await fetch(`${apiUrl}/equipements`);
                if(resTypes.ok) setTypesList(await resTypes.json());
            } catch (e) { console.error(e); }
        };
        loadData();
    }, []);

    useEffect(() => {
        if(selectedPlanId) fetchMapItems(selectedPlanId);
    }, [selectedPlanId]);

    const fetchMapItems = async (planId) => {
        try {
            const res = await fetch(`${apiUrl}/terrain/plan/${planId}`);
            if(res.ok) setItemsOnMap(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if(!selectedPlanId) return alert("Sélectionnez un plan d'abord !");
        
        const payload = {
            name: form.name,
            plans_id: selectedPlanId,
            type_equipements_id: form.type_id,
            zone: form.zone,
            comment: form.comment
        };

        try {
            const res = await fetch(`${apiUrl}/terrain`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });

            if(res.ok) {
                setForm({ name: '', type_id: '', zone: '', comment: '' });
                fetchMapItems(selectedPlanId);
            }
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Supprimer cet équipement ?")) return;
        await fetch(`${apiUrl}/terrain/${id}`, { method: 'DELETE' });
        setSelectedItem(null);
        fetchMapItems(selectedPlanId);
    };

    const handleMouseDown = (e, item) => {
        if (!unlockedItems.includes(item.id)) return;
        e.preventDefault(); 
        setIsDragging(item.id);
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !mapRef.current) return;
        const rect = mapRef.current.getBoundingClientRect();
        let x = ((e.clientX - rect.left) / rect.width) * 100;
        let y = ((e.clientY - rect.top) / rect.height) * 100;
        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));

        setItemsOnMap(prev => prev.map(it => 
            it.id === isDragging ? { ...it, x_axis: x, y_axis: y } : it
        ));
    };

    const handleMouseUp = async () => {
        if (isDragging) {
            const item = itemsOnMap.find(i => i.id === isDragging);
            if(item) {
                await fetch(`${apiUrl}/terrain/${item.id}/position`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ x: item.x_axis, y: item.y_axis })
                });
            }
            setIsDragging(null);
        }
    };

    const toggleLock = (id) => {
        if (unlockedItems.includes(id)) {
            setUnlockedItems(prev => prev.filter(uid => uid !== id));
        } else {
            setUnlockedItems(prev => [...prev, id]);
        }
    };

    if (!isAdmin) {
        return <div className="zone_container"><h2>Accès Réservé aux Administrateurs</h2></div>;
    }

    const currentPlan = plansList.find(p => p.id === parseInt(selectedPlanId));

    return (
        <div className="zone_container" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
            
            <div className="zone_sidebar">
                <h3><MapIcon size={20}/> Configurer Zone</h3>
                
                <div className="form_group">
                    <label>Sélectionner le Plan</label>
                    <select value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)}>
                        <option value="">-- Choisir un plan --</option>
                        {plansList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                <hr/>

                {selectedPlanId && (
                    <form onSubmit={handleCreate}>
                        <h4>Ajouter un équipement</h4>
                        <div className="form_group">
                            <label>Type d'équipement</label>
                            <select 
                                required value={form.type_id} 
                                onChange={e => setForm({...form, type_id: e.target.value})}
                            >
                                <option value="">-- Type --</option>
                                {typesList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div className="form_group">
                            <label>Nom</label>
                            <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                        </div>
                        <div className="form_group">
                            <label>Zone (Couleur Auto)</label>
                            <input type="text" value={form.zone} onChange={e => setForm({...form, zone: e.target.value})} />
                        </div>
                        <div className="form_group">
                            <label>Commentaire</label>
                            <textarea rows="2" value={form.comment} onChange={e => setForm({...form, comment: e.target.value})} />
                        </div>
                        <button type="submit" className="add_btn"><PlusCircle size={18}/> Placer sur le plan</button>
                    </form>
                )}

                {/* BOUTON CRÉER RONDE EN BAS */}
                <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                    <button 
                        className="add_btn" 
                        style={{ backgroundColor: '#10b981' }} 
                        onClick={() => navigate('/create-round')}
                    >
                        <ClipboardList size={18}/> Créer une Ronde
                    </button>
                </div>
            </div>

            <div className="zone_map_area">
                {currentPlan ? (
                    <div className="map_wrapper" ref={mapRef}>
                        <img src={`${apiUrl}${currentPlan.img_link}`} alt="Plan" className="map_image" draggable="false" />
                        {itemsOnMap.map(item => {
                            const isUnlocked = unlockedItems.includes(item.id);
                            const badgeColor = isUnlocked ? '#ffc107' : getZoneColor(item.zone);
                            return (
                                <div 
                                    key={item.id}
                                    className={`map_item ${selectedItem?.id === item.id ? 'selected' : ''} ${isUnlocked ? 'draggable' : ''}`}
                                    style={{ left: `${item.x_axis}%`, top: `${item.y_axis}%` }}
                                    onMouseDown={(e) => handleMouseDown(e, item)}
                                    onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                                >
                                    <div className="icon_badge" style={{ backgroundColor: badgeColor }}>
                                        {getIconComponent(item.symbol, 16)}
                                    </div>
                                    <span className="mini_label">{item.name}</span>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="empty_map_state">Veuillez sélectionner un plan.</div>
                )}
            </div>

            {selectedItem && (
                <div className="item_details_card">
                    <button className="close_details" onClick={() => setSelectedItem(null)}><X size={16}/></button>
                    <div className="details_header">
                        <div style={{ color: getZoneColor(selectedItem.zone) }}>
                            {getIconComponent(selectedItem.symbol, 24)}
                        </div>
                        <div>
                            <strong>{selectedItem.name}</strong>
                            <div className="subtext">{selectedItem.type_name}</div>
                        </div>
                    </div>
                    <div className="details_body">
                        <p><strong>Zone : </strong><span style={{ fontWeight:'bold', color: getZoneColor(selectedItem.zone) }}>{selectedItem.zone || '-'}</span></p>
                        <p><strong>Info :</strong> {selectedItem.comment || '-'}</p>
                    </div>
                    <div className="details_actions">
                        <button className={`action_btn ${unlockedItems.includes(selectedItem.id) ? 'unlock' : ''}`} onClick={() => toggleLock(selectedItem.id)}>
                            {unlockedItems.includes(selectedItem.id) ? <Unlock size={16}/> : <Lock size={16}/>}
                        </button>
                        <button className="action_btn delete" onClick={() => handleDelete(selectedItem.id)}><Trash2 size={16}/></button>
                    </div>
                </div>
            )}
        </div>
    );
}