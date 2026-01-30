import React from 'react';

export default function Alarms() {
  return (
    <div>
      <h2>Centre d'Alarmes</h2>
      <div style={{ padding: '20px', backgroundColor: '#ffebeb', border: '1px solid red', borderRadius: '8px' }}>
        <strong>Attention :</strong> Aucune alarme active pour le moment.
      </div>
    </div>
  );
}