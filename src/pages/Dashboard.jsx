import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { callGas } from '../api/GasBridge';
import Loading from '../components/Loading';
import './Dashboard.css';

// Sub-components
import Navbar from '../components/Navbar';
import InfoPanel from '../components/InfoPanel';
import FeedbackPanel from '../components/FeedbackPanel';
import FeedbackModal from '../components/FeedbackModal';

const Dashboard = () => {
    const { user, t, setUser, currentRound } = useApp();
    const [activeTab, setActiveTab] = useState('info');
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState([]);
    const [followUpData, setFollowUpData] = useState([]);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);

    const loadData = () => {
        setLoading(true);
        Promise.all([
            callGas('getAllCompaniesForForm', user.name, currentRound),
            callGas('getFollowUpData', user.name, currentRound)
        ]).then(([allComps, followUps]) => {
            setCompanies(allComps || []);
            setFollowUpData(followUps || []);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    };

    useEffect(() => {
        loadData();
    }, [user.name, currentRound]);

    const handleLogout = () => {
        localStorage.removeItem('mentor_user');
        setUser(null);
    };

    const openCreateModal = () => {
        setModalData(null);
        setIsModalOpen(true);
    };

    const openEditModal = (sessionData) => {
        setModalData(sessionData);
        setIsModalOpen(true);
    };

    if (loading) return <Loading />;

    return (
        <div className="dashboard-page">
            <Navbar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                onLogout={handleLogout}
            />
            
            <main className="dashboard-content">
                {activeTab === 'info' ? (
                    <InfoPanel 
                        companies={companies} 
                        currentMentor={user.name} 
                    />
                ) : (
                    <FeedbackPanel 
                        followUpData={followUpData} 
                        onCreate={openCreateModal}
                        onEdit={openEditModal}
                    />
                )}
            </main>

            <FeedbackModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                companies={companies}
                existingData={modalData}
                onRefresh={loadData}
            />

            {/* Mobile Nav */}
            <div className="mobile-navbar">
                <button 
                    className={`nav-item ${activeTab === 'info' ? 'active' : ''}`}
                    onClick={() => setActiveTab('info')}
                >
                    <span className="icon">ℹ️</span>
                    <span>{t('tab_info')}</span>
                </button>
                <button 
                    className={`nav-item ${activeTab === 'feedbacks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('feedbacks')}
                >
                    <span className="icon">📝</span>
                    <span>{t('tab_feedbacks')}</span>
                </button>
            </div>
            
            <button className="mobile-fab" onClick={openCreateModal}>+</button>
        </div>
    );
};

export default Dashboard;
