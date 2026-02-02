import React, { useState, useEffect } from 'react';
import { 
    PlusCircle, Trash2, XCircle, Settings, 
    // Bibliothèque d'icônes disponibles
    Thermometer, Lightbulb, Fan, Activity, Droplets, Zap, Lock, Speaker, Radio, Camera
} from 'lucide-react';
import './Equipements.css'; 

// Mapping: Nom BDD -> Icône React -> Nom Français
const ICON_OPTIONS = [
    { value: 'Thermometer', label: 'Thermomètre / Température', component: <Thermometer size={20}/> },
    { value: 'Lightbulb',   label: 'Éclairage / Lumière', component: <Lightbulb size={20}/> },
    { value: 'Fan',         label: 'Ventilation / VMC', component: <Fan size={20}/> },
    { value: 'Droplets',    label: 'Humidité / Eau', component: <Droplets size={20}/> },
    { value: 'Zap',         label: 'Élec / Puissance', component: <Zap size={20}/> },
    { value: 'Activity',    label: 'Capteur Mouvement', component: <Activity size={20}/> },
    { value: 'Lock',        label: 'Verrou / Porte', component: <Lock size={20}/> },
    { value: 'Speaker',     label: 'Sirène / Son', component: <Speaker size={20}/> },
    { value: 'Camera',      label: 'Caméra', component: <Camera size={20}/> },
    { value: 'Radio',       label: 'Capteur sans fil', component: <Radio size={20}/> },
];

const getIconComponent = (iconName) => {
    const found = ICON_OPTIONS.find(opt => opt.value === iconName);
    return found ? found.component : <Settings size={20}/>;
};

export default function Equipements({ onClose }) {
  const [equipements, setEquipements] = useState([]);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [form, setForm] = useState({
      name: '',
      equipement_val: 'bool',
      symbol: 'Lightbulb',
      comment: ''
  });

  useEffect(() => { fetchEquipements(); }, []);

  const fetchEquipements = async () => {
      try {
          const res = await fetch(`${apiUrl}/equipements`);
          setEquipements(await res.json());
      } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
      if(!window.confirm("Supprimer ce type d'équipement ?")) return;
      try {
          await fetch(`${apiUrl}/equipements/${id}`, { method: 'DELETE' });
          fetchEquipements();
      } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
          const res = await fetch(`${apiUrl}/equipements`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(form)
          });
          if (res.ok) {
              setForm({ name: '', equipement_val: 'bool', symbol: 'Lightbulb', comment: '' });
              fetchEquipements();
          }
      } catch (err) { console.error(err); }
  };

  return (
    <div className="equip_container">
        <div className="equip_header">
            <h2><Settings size={24}/> Gestion des Types d'Équipements</h2>
            <button onClick={onClose} className="close_btn"><XCircle size={24}/></button>
        </div>

        <div className="equip_layout">
            {/* SIDEBAR GAUCHE : CRÉATION */}
            <div className="equip_sidebar">
                <h3>Nouveau Type</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form_group">
                        <label>Nom</label>
                        <input 
                            type="text" required placeholder="Ex: Sonde Salon"
                            value={form.name}
                            onChange={e => setForm({...form, name: e.target.value})}
                        />
                    </div>
                    <div className="form_group">
                        <label>Type de donnée</label>
                        <select 
                            value={form.equipement_val} 
                            onChange={e => setForm({...form, equipement_val: e.target.value})}
                        >
                            <option value="bool">Tout ou Rien (On/Off)</option>
                            <option value="analog">Analogique (0-100%)</option>
                        </select>
                    </div>
                    <div className="form_group">
                        <label>Symbole</label>
                        <div className="symbol_selector">
                            <select 
                                value={form.symbol} 
                                onChange={e => setForm({...form, symbol: e.target.value})}
                            >
                                {ICON_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <div className="icon_preview">{getIconComponent(form.symbol)}</div>
                        </div>
                    </div>
                    <div className="form_group">
                        <label>Commentaire</label>
                        <textarea 
                            rows="2" value={form.comment}
                            onChange={e => setForm({...form, comment: e.target.value})}
                        />
                    </div>
                    <button type="submit" className="add_btn"><PlusCircle size={18}/> Créer</button>
                </form>
            </div>

            {/* LISTE DROITE */}
            <div className="equip_list_area">
                <h3>Équipements existants ({equipements.length})</h3>
                <div className="equip_grid">
                    {equipements.map(item => (
                        <div key={item.id} className="equip_card">
                            <div className="card_icon">{getIconComponent(item.symbol)}</div>
                            <div className="card_info">
                                <h4>{item.name}</h4>
                                <div className="card_meta">
                                    <span className={`tag ${item.equipement_val}`}>
                                        {item.equipement_val === 'bool' ? 'On/Off' : 'Analogique'}
                                    </span>
                                </div>
                                {item.comment && <p className="card_comment">{item.comment}</p>}
                            </div>
                            <button className="delete_mini_btn" onClick={() => handleDelete(item.id)}>
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    ))}
                    {equipements.length === 0 && <p className="empty_state">Aucun équipement.</p>}
                </div>
            </div>
        </div>
    </div>
  );
}