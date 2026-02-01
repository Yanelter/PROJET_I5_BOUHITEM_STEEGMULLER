import React, { useState, useEffect } from 'react';
import { Save, XCircle, Users } from 'lucide-react';
import './UserManagement.css'; 

export default function UserManagement({ currentUser, onClose }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [message, setMessage] = useState(null);
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const resUsers = await fetch(`${apiUrl}/admin/users`);
      const dataUsers = await resUsers.json();
      setUsers(dataUsers);

      const resRoles = await fetch(`${apiUrl}/roles`);
      const dataRoles = await resRoles.json();
      setRoles(dataRoles);
    } catch (error) {
      console.error("Erreur chargement", error);
    }
  };

  const handleRoleChange = async (targetUserId, newRoleId) => {
    setMessage(null);
    try {
      const res = await fetch(`${apiUrl}/admin/update-role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            targetUserId, 
            newRoleId, 
            requesterRoleId: currentUser.role_id 
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Rôle modifié !", type: "success" });
        fetchData();
      } else {
        setMessage({ text: data.error, type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Erreur de communication", type: "error" });
    }
  };

  return (
    <div className="usermanagement_container">
      <div className="um_header">
        <h2><Users size={24}/> Gestion des Utilisateurs</h2>
        <button onClick={onClose} className="close_btn"><XCircle size={24}/></button>
      </div>

      {message && <div className={`msg_box ${message.type}`}>{message.text}</div>}

      <div className="table_wrapper">
        <table className="users_table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Identifiant</th>
              <th>Email</th>
              <th>Date création</th>
              <th>Rôle Actuel</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className={u.role_id === 5 ? "row_superadmin" : ""}>
                <td>{u.id}</td>
                <td><strong>{u.identifier}</strong></td>
                <td>{u.email}</td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  <span className={`badge_role role_${u.role_id}`}>
                    {u.role_name}
                  </span>
                </td>
                <td>
                  {u.role_id === 5 ? (
                    <span className="locked_text">Verrouillé</span>
                  ) : (
                    <select 
                      value={u.role_id} 
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="role_select"
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}