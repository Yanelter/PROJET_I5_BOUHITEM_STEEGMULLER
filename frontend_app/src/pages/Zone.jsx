import React from 'react';

export default function Zone({ user }) {
  const canConfig = user?.permissions?.write || user?.permissions?.admin;

  return (
    <div>
      <h2>{canConfig ? "Configuration des Zones" : "Lancer une ronde"}</h2>
      <p>
        {canConfig 
          ? "Ajoutez, modifiez ou supprimez les zones de surveillance (Mode Édition)." 
          : "Sélectionnez une zone pour débuter votre ronde de vérification (Mode Lecture)."}
      </p>
    </div>
  );
}