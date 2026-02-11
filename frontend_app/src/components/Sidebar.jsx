import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Grid, Bell, User, PlayCircle } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ user }) {
  const perms = user?.permissions || {};
  // canWrite est true pour Admin (4) et SuperAdmin (5), false pour Operateur (3)
  const canWrite = perms.write || perms.admin;
  
  const isOperatorOrAdmin = user.role_id >= 3;
  const isOperator = user.role_id === 3;
  const isAdmin = user.role_id >= 4;

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

         {/* MODIFICATION ICI : On affiche ce lien UNIQUEMENT si on est Admin (canWrite) */}
          {isAdmin && (
            <li>
                <NavLink to="/zone" className={({ isActive }) => isActive ? "nav_link active" : "nav_link"}>
                <Map size={20} />
                <span>Configurer Zone</span>
                </NavLink>
            </li>
          )}

          {/* Les opérateurs voient ça à la place */}
          {isOperator && (
            <li>
                <NavLink to="/operator-rounds" className={({ isActive }) => isActive ? "nav_link active" : "nav_link"}>
                    <PlayCircle size={20} />
                    <span>Lancer une ronde</span>
                </NavLink>
            </li>
          )}

          <li>
            <NavLink to="/apps" className={({ isActive }) => isActive ? "nav_link active" : "nav_link"}>
              <Grid size={20} />
              <span>Applications</span>
            </NavLink>
          </li>

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