import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Grid, Bell, User } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ role }) {
  return (
    <aside className="left_side">
      <nav className="sidebar_nav">
        <ul className="nav_list">
          
          {/* 1. DASHBOARD */}
          <li>
            <NavLink to="/" className={({ isActive }) => isActive ? "nav_link active" : "nav_link"}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
          </li>

          {/* 2. ZONE (Texte dynamique selon le rôle) */}
          <li>
            <NavLink to="/zone" className={({ isActive }) => isActive ? "nav_link active" : "nav_link"}>
              <Map size={20} />
              <span>{role === 'admin' ? "Configurer Zone" : "Lancer une ronde"}</span>
            </NavLink>
          </li>

          {/* 3. APPS */}
          <li>
            <NavLink to="/apps" className={({ isActive }) => isActive ? "nav_link active" : "nav_link"}>
              <Grid size={20} />
              <span>Applications</span>
            </NavLink>
          </li>

          {/* 4. ALARMES (Visible uniquement pour les Admins) */}
          {role === 'admin' && (
            <li>
              <NavLink to="/alarms" className={({ isActive }) => isActive ? "nav_link active" : "nav_link"}>
                <Bell size={20} />
                <span>Alarmes</span>
              </NavLink>
            </li>
          )}

          {/* Espaceur pour pousser le profil vers le bas (si le CSS le gère) */}
          <li className="nav_spacer"></li>

          {/* 5. PROFIL */}
          <li>
            <NavLink to="/profile" className={({ isActive }) => isActive ? "nav_link active" : "nav_link"}>
              <User size={20} />
              <span>Profil</span>
            </NavLink>
          </li>

        </ul>
      </nav>
    </aside>
  );
}