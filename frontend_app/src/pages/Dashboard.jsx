import React, { useState, useEffect } from 'react';
import { 
    Activity, Settings, Users, AlertTriangle, CheckCircle, 
    ClipboardList, Calendar, BarChart2, PieChart, Clock 
} from 'lucide-react';
import { 
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, 
    Title, Tooltip, Legend, ArcElement 
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import './Dashboard.css';

// Enregistrement des composants Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function Dashboard() {
    const [user] = useState(JSON.parse(localStorage.getItem('user_data')) || {});
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    const [activeTab, setActiveTab] = useState('ops'); 
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Droits d'accès
    const roleId = parseInt(user.role_id || 0);
    const canViewMaint = roleId >= 3; // Opérateur+
    const canViewPerf = roleId >= 4;  // Admin+

    useEffect(() => {
        const fetchData = async () => {
            setData(null); // Reset pour éviter les erreurs d'affichage entre onglets
            setLoading(true);
            
            let endpoint = '/dashboard/operational';
            if (activeTab === 'maint') endpoint = '/dashboard/maintenance';
            if (activeTab === 'perf') endpoint = '/dashboard/performance';

            try {
                const res = await fetch(`${apiUrl}${endpoint}`);
                if (res.ok) setData(await res.json());
            } catch (e) { console.error(e); }
            setLoading(false);
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh 30s
        return () => clearInterval(interval);
    }, [activeTab]);

    // Options globales des graphiques
    const chartOptions = { responsive: true, plugins: { legend: { position: 'bottom' } } };

    return (
        <div className="dashboard_container">
            
            {/* --- MENU ONGLET --- */}
            <div className="dashboard_tabs">
                <button 
                    className={`tab_btn ${activeTab === 'ops' ? 'active' : ''}`} 
                    onClick={() => setActiveTab('ops')}
                >
                    <Activity size={18}/> KPI Opérationnels
                </button>
                
                {canViewMaint && (
                    <button 
                        className={`tab_btn ${activeTab === 'maint' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('maint')}
                    >
                        <Settings size={18}/> KPI Maintenance
                    </button>
                )}

                {canViewPerf && (
                    <button 
                        className={`tab_btn ${activeTab === 'perf' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('perf')}
                    >
                        <Users size={18}/> KPI Performance
                    </button>
                )}
            </div>

            {/* --- CONTENU --- */}
            <div className="tab_content">
                {loading || !data ? (
                    <div className="loading_state">Chargement des données...</div>
                ) : (
                    <>
                        {/* 1. VUE OPÉRATIONNELLE */}
                        {activeTab === 'ops' && (
                            <div className="fade-in">
                                {/* LIGNE 1 : CARTES CHIFFRES */}
                                <div className="kpi_grid" style={{ marginBottom: '20px' }}>
                                    <KpiCard 
                                        title="Alarmes Actives" 
                                        value={data.alarms} 
                                        icon={<AlertTriangle size={32}/>} 
                                        color="red"
                                        sub="Équipements en défaut"
                                    />
                                    <KpiCard 
                                        title="Disponibilité" 
                                        value={`${data.availability}%`} 
                                        icon={<CheckCircle size={32}/>} 
                                        color="green"
                                        sub={`Sur ${data.total_equipments} équipements`}
                                    />
                                    <KpiCard 
                                        title="Rondes en Attente" 
                                        value={data.pending_rounds} 
                                        icon={<ClipboardList size={32}/>} 
                                        color="orange"
                                        sub="À réaliser"
                                    />
                                    <KpiCard 
                                        title="Rondes du Jour" 
                                        value={data.today_rounds} 
                                        icon={<Calendar size={32}/>} 
                                        color="blue"
                                        sub="Planifiées ce jour"
                                    />
                                </div>

                                {/* LIGNE 2 : GRAPHIQUES */}
                                <div className="charts_grid">
                                    <div className="chart_card">
                                        <h3><PieChart size={20}/> Taux de Disponibilité</h3>
                                        <div className="chart_wrapper donut">
                                            <Doughnut 
                                                data={{
                                                    labels: ['Fonctionnels', 'En Panne'],
                                                    datasets: [{
                                                        data: [data.total_equipments - data.alarms, data.alarms],
                                                        backgroundColor: ['#10b981', '#ef4444'], // Vert / Rouge
                                                        borderWidth: 0
                                                    }]
                                                }} 
                                                options={chartOptions} 
                                            />
                                        </div>
                                    </div>

                                    <div className="chart_card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                                        <h3 style={{ width: '100%', justifyContent: 'center' }}>État du Parc</h3>
                                        <div style={{ fontSize: '4rem', fontWeight: 'bold', color: data.alarms > 0 ? '#ef4444' : '#10b981' }}>
                                            {data.alarms === 0 ? "100%" : "ATTENTION"}
                                        </div>
                                        <p style={{ color: 'var(--text-secondary)' }}>
                                            {data.alarms === 0 
                                                ? "Tous les systèmes sont nominaux." 
                                                : `${data.alarms} équipement(s) nécessitent une intervention immédiate.`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. VUE MAINTENANCE */}
                        {activeTab === 'maint' && (
                            <div className="charts_grid fade-in">
                                <div className="chart_card">
                                    <h3><BarChart2 size={20}/> Top Zones Critiques</h3>
                                    <div className="chart_wrapper">
                                        {(data.topZones && data.topZones.length > 0) ? (
                                            <Bar data={{
                                                labels: data.topZones.map(z => z.label),
                                                datasets: [{
                                                    label: 'Nombre de défauts',
                                                    data: data.topZones.map(z => z.count),
                                                    backgroundColor: 'rgba(239, 68, 68, 0.6)',
                                                }]
                                            }} options={chartOptions} />
                                        ) : <p className="empty_msg">Aucun défaut détecté.</p>}
                                    </div>
                                </div>

                                <div className="chart_card">
                                    <h3><PieChart size={20}/> Répartition par Type</h3>
                                    <div className="chart_wrapper donut">
                                        {(data.defectsByType && data.defectsByType.length > 0) ? (
                                            <Doughnut data={{
                                                labels: data.defectsByType.map(t => t.label),
                                                datasets: [{
                                                    data: data.defectsByType.map(t => t.count),
                                                    backgroundColor: ['#f87171', '#fb923c', '#fbbf24', '#60a5fa', '#a78bfa'],
                                                }]
                                            }} options={chartOptions} />
                                        ) : <p className="empty_msg">R.A.S.</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. VUE PERFORMANCE */}
                        {activeTab === 'perf' && (
                            <div className="charts_grid fade-in">
                                
                                {/* 1. Jauge Taux de Réalisation */}
                                <div className="chart_card">
                                    <h3><CheckCircle size={20}/> Taux de Réalisation (Net)</h3>
                                    <div className="chart_wrapper donut">
                                        <Doughnut 
                                            data={{
                                                labels: ['Réalisé', 'Non fait'],
                                                datasets: [{
                                                    data: [data.completionRate, 100 - data.completionRate],
                                                    backgroundColor: ['#3b82f6', '#e2e8f0'],
                                                    borderWidth: 0,
                                                    circumference: 180,
                                                    rotation: 270,
                                                }]
                                            }} 
                                            options={{ ...chartOptions, plugins: { legend: { display: false } } }} 
                                        />
                                        <div style={{ position: 'absolute', top: '60%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{data.completionRate}%</div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Global</div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Activité Opérateurs */}
                                <div className="chart_card">
                                    <h3><Users size={20}/> Volume de Rondes (Valides)</h3>
                                    <div className="chart_wrapper">
                                        {(data.operatorActivity && data.operatorActivity.length > 0) ? (
                                            <Bar data={{
                                                labels: data.operatorActivity.map(u => u.label),
                                                datasets: [{
                                                    label: 'Rondes effectuées',
                                                    data: data.operatorActivity.map(u => u.count),
                                                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                                                    borderRadius: 4
                                                }]
                                            }} options={chartOptions} />
                                        ) : <p className="empty_msg">Pas encore d'activité.</p>}
                                    </div>
                                </div>

                                {/* 3. NOUVEAU : Retard Moyen */}
                                <div className="chart_card">
                                    <h3><Clock size={20}/> Retard Moyen (Jours)</h3>
                                    <div className="chart_wrapper">
                                        {(data.avgDelay && data.avgDelay.length > 0) ? (
                                            <Bar data={{
                                                labels: data.avgDelay.map(u => u.label),
                                                datasets: [{
                                                    label: 'Jours de retard moyen',
                                                    data: data.avgDelay.map(u => u.avg_days),
                                                    // Rouge si positif (retard), Vert si négatif (avance)
                                                    backgroundColor: data.avgDelay.map(u => u.avg_days > 0 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.6)'),
                                                    borderRadius: 4
                                                }]
                                            }} options={{
                                                indexAxis: 'y', // Barres horizontales
                                                responsive: true,
                                                plugins: { legend: { display: false } },
                                                scales: {
                                                    x: { title: { display: true, text: 'Jours (Négatif = Avance, Positif = Retard)' } }
                                                }
                                            }} />
                                        ) : <p className="empty_msg">Aucun retard analysé.</p>}
                                    </div>
                                </div>

                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// Composant Carte KPI Simple
function KpiCard({ title, value, icon, color, sub }) {
    return (
        <div className={`kpi_card border-${color}`}>
            <div className={`kpi_icon bg-${color}`}>{icon}</div>
            <div className="kpi_content">
                <span className={`kpi_value txt-${color}`}>{value}</span>
                <span className="kpi_title">{title}</span>
                <span className="kpi_sub">{sub}</span>
            </div>
        </div>
    );
}