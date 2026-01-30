import React from 'react';

export default function Zone({ role }) {
  return (
    <div>
      <h2>{role === 'admin' ? "Configuration des Zones" : "Lancer une ronde"}</h2>
      <p>
        {role === 'admin' 
          ? "Ajoutez, modifiez ou supprimez les zones de surveillance." 
          : "Sélectionnez une zone pour débuter votre ronde de vérification."}
      </p>
    </div>
  );
}