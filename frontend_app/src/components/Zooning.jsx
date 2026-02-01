import React, { useState, useEffect } from 'react';
import { Upload, XCircle, Map as MapIcon, Trash2 } from 'lucide-react'; // Ajout de Trash2
import './Zooning.css'; 

export default function Zooning({ onClose }) {
  const [plans, setPlans] = useState([]);
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState(null);
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${apiUrl}/zooning/plans`);
      const data = await res.json();
      setPlans(data);
    } catch (error) {
      console.error(error);
    }
  };

  // --- NOUVELLE FONCTION DE SUPPRESSION ---
  const handleDelete = async (id) => {
    // Petite sécurité pour éviter les clics accidentels
    if (!window.confirm("Voulez-vous vraiment supprimer ce plan définitivement ?")) {
        return;
    }

    try {
        const res = await fetch(`${apiUrl}/zooning/plan/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            setMessage({ text: "Plan supprimé.", type: "success" });
            fetchPlans(); // On rafraîchit la liste
        } else {
            setMessage({ text: "Erreur lors de la suppression.", type: "error" });
        }
    } catch (error) {
        console.error(error);
        setMessage({ text: "Erreur serveur.", type: "error" });
    }
  };
  // ----------------------------------------

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !file) {
        setMessage({ text: "Veuillez remplir le nom et choisir une image.", type: "error" });
        return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('planImage', file);

    try {
      const res = await fetch(`${apiUrl}/zooning/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Plan sauvegardé !", type: "success" });
        setName('');
        setFile(null);
        document.getElementById('fileInput').value = ""; 
        fetchPlans();
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Erreur serveur.", type: "error" });
    }
  };

  return (
    <div className="zooning_container">
      <div className="zooning_header">
        <h2><MapIcon size={24}/> Zooning - Gestion des Plans</h2>
        <button onClick={onClose} className="close_btn"><XCircle size={24}/></button>
      </div>

      <div className="zooning_content">
        {/* COLONNE GAUCHE */}
        <div className="zooning_form_card">
            <h3>Ajouter un nouveau plan</h3>
            {message && <div className={`msg_box ${message.type}`}>{message.text}</div>}
            
            <form onSubmit={handleSubmit}>
                <div className="form_group">
                    <label>Nom du plan / Zone</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="Ex: Rez-de-chaussée"
                    />
                </div>
                <div className="form_group">
                    <label>Fichier Image</label>
                    <div className="file_input_wrapper">
                        <input 
                            id="fileInput"
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                        />
                    </div>
                </div>
                <button type="submit" className="upload_btn">
                    <Upload size={18} /> Uploader le plan
                </button>
            </form>
        </div>

        {/* COLONNE DROITE : LISTE AVEC SUPPRESSION */}
        <div className="zooning_list">
            <h3>Plans existants</h3>
            <div className="plans_grid">
                {plans.length === 0 ? <p>Aucun plan pour le moment.</p> : null}
                
                {plans.map(plan => (
                    <div key={plan.id} className="plan_item">
                        <div className="plan_preview">
                            <img src={`${apiUrl}${plan.img_link}`} alt={plan.name} />
                            
                            {/* BOUTON SUPPRIMER */}
                            <button 
                                className="delete_plan_btn"
                                onClick={() => handleDelete(plan.id)}
                                title="Supprimer ce plan"
                            >
                                <Trash2 size={16} />
                            </button>

                        </div>
                        <div className="plan_info">
                            <strong>{plan.name}</strong>
                            <small>{new Date(plan.created_at).toLocaleDateString()}</small>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}