import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Grid, Bell, User } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ user }) {
  // Raccourcis pour lisibilité
  const perms = user?.permissions || {};
  const canWrite = perms.write || perms.admin; // Si on peut écrire ou qu'on est admin

  return (
    <aside className="left_side">
      <nav className="sidebar_nav">
        <ul className="nav_list">
          
          <li>
            <NavLink to="/" className={({ isActive }) => isActive ? "nav_link active" : "nav_link"}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
          </li>

          <li>
            <NavLink to="/zone" className={({ isActive }) => isActive ? "nav_link active" : "nav_link"}>
              <Map size={20} />
              {/* Texte change selon permission d'écriture */}
              <span>{canWrite ? "Configurer Zone" : "Lancer une ronde"}</span>
            </NavLink>
          </li>

          <li>
            <NavLink to="/apps" className={({ isActive }) => isActive ? "nav_link active" : "nav_link"}>
              <Grid size={20} />
              <span>Applications</span>
            </NavLink>
          </li>

          {/* Visible seulement si permission ADMIN */}
          {perms.admin && (
            <li>
              <NavLink to="/alarms" className={({ isActive }) => isActive ? "nav_link active" : "nav_link"}>
                <Bell size={20} />
                <span>Alarmes</span>
              </NavLink>
            </li>
          )}

          <li className="nav_spacer"></li>

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