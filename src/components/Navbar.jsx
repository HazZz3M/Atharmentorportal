import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import './Navbar.css';

const Navbar = ({ activeTab, setActiveTab, onLogout }) => {
    const { lang, setLang, theme, setTheme, t, user } = useApp();
    const [showMenu, setShowMenu] = useState(false);

    return (
        <nav className="navbar">
            <div className="nav-inner">
                <div className="nav-left">
                    <div className="brand">
                        <div className="brand-dot"></div>
                        <span>{t('brand')}</span>
                    </div>

                    <div className="nav-tabs">
                        <button 
                            className={`tab ${activeTab === 'info' ? 'active' : ''}`}
                            onClick={() => setActiveTab('info')}
                        >
                            {t('tab_info')}
                        </button>
                        <button 
                            className={`tab ${activeTab === 'feedbacks' ? 'active' : ''}`}
                            onClick={() => setActiveTab('feedbacks')}
                        >
                            {t('tab_feedbacks')}
                        </button>
                    </div>
                </div>

                <div className="nav-actions">
                    <div className="mentor-chip" onClick={() => setShowMenu(!showMenu)}>
                        <span className="mentor-name">{user?.name}</span>
                        <span className={`chevron ${showMenu ? 'up' : ''}`}>▼</span>
                        
                        {showMenu && (
                            <div className="mentor-dropdown fade-in">
                                <button className="dd-item" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
                                    🌐 {lang === 'ar' ? 'English' : 'العربية'}
                                </button>
                                <button className="dd-item" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                                    {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                                </button>
                                <div className="dd-divider"></div>
                                <button className="dd-item logout" onClick={onLogout}>
                                    🚪 {t('btn_logout')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
