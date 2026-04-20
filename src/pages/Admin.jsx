import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { callGas } from '../api/GasBridge';
import Loading from '../components/Loading';
import './Admin.css';

const Admin = () => {
    const { t, setUser } = useApp();
    const [stats, setStats] = useState(null);
    const [rounds, setRounds] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('stats');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setLoading(true);
        Promise.all([
            callGas('getAdminData'), // Custom aggregator or multiple calls
            callGas('getAdminStats'),
            callGas('getRounds', true),
            callGas('getMentors', 'All') 
        ]).then(([adminData, adminStats, allRounds, allMentors]) => {
            setStats(adminStats);
            setRounds(allRounds || []);
            setMentors(allMentors || []);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('mentor_user');
        setUser(null);
    };

    if (loading) return <Loading />;

    return (
        <div className="admin-page fade-in">
            <header className="admin-header">
                <div className="header-left">
                    <h1>Admin Control Panel</h1>
                </div>
                <div className="header-right">
                    <button className="refresh-btn" onClick={loadData}>Refresh</button>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <nav className="admin-tabs">
                <button className={activeTab === 'stats' ? 'active' : ''} onClick={() => setActiveTab('stats')}>Statistics</button>
                <button className={activeTab === 'manage' ? 'active' : ''} onClick={() => setActiveTab('manage')}>Management</button>
                <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>Settings</button>
            </nav>

            <main className="admin-content">
                {activeTab === 'stats' && stats && (
                    <div className="stats-view fade-in">
                        <div className="stats-cards">
                            <div className="s-card">
                                <span>Total Mentors</span>
                                <strong>{stats.totalMentors}</strong>
                            </div>
                            <div className="s-card">
                                <span>Total Reports</span>
                                <strong>{stats.totalReports}</strong>
                            </div>
                            <div className="s-card">
                                <span>Total Diagnoses</span>
                                <strong>{stats.totalDiagnoses}</strong>
                            </div>
                        </div>

                        <div className="mentors-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Mentor</th>
                                        <th>Rounds</th>
                                        <th>Reports</th>
                                        <th>Diagnoses</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.mentors?.map(m => (
                                        <tr key={m.name}>
                                            <td>{m.name}</td>
                                            <td>{m.roundsCount}</td>
                                            <td>{m.reportsCount}</td>
                                            <td>{m.diagnosesCount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'manage' && (
                    <div className="manage-view fade-in">
                        <h3>Round Management</h3>
                        <div className="rounds-table-wrapper">
                             <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Round Name</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rounds.map(r => (
                                        <tr key={r.id}>
                                            <td>{r.name}</td>
                                            <td><span className={`tag ${r.isActive ? 'active' : 'inactive'}`}>{r.isActive ? 'Active' : 'Disabled'}</span></td>
                                            <td>
                                                <button onClick={() => callGas('toggleRoundStatus', r.id, !r.isActive).then(loadData)}>
                                                    {r.isActive ? 'Disable' : 'Enable'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                   <div className="settings-view fade-in">
                       <p>Settings logic here...</p>
                   </div>
                )}
            </main>
        </div>
    );
};

export default Admin;
