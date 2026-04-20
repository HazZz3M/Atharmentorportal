import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { callGas } from '../api/GasBridge';
import Loading from '../components/Loading';
import './Login.css';

const Login = () => {
    const { lang, setLang, t, setUser, currentRound, setCurrentRound } = useApp();
    const [step, setStep] = useState(1); // 1: Round, 2: Mentor, 3: PIN
    const [isAdminLogin, setIsAdminLogin] = useState(false);
    const [adminCreds, setAdminCreds] = useState({ user: '', pass: '' });
    const [rounds, setRounds] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [selectedMentor, setSelectedMentor] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch rounds on mount
    useEffect(() => {
        setLoading(true);
        callGas('getRounds', false)
            .then(data => {
                setRounds(data || []);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    const handleRoundSelect = (roundId) => {
        setCurrentRound(roundId);
        setLoading(true);
        callGas('getMentors', roundId)
            .then(data => {
                setMentors(data || []);
                setStep(2);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    };

    const handleLogin = (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');
        callGas('validateLogin', selectedMentor, pin, currentRound)
            .then(res => {
                const userData = {
                    name: selectedMentor,
                    round: currentRound,
                    isAdmin: false
                };
                localStorage.setItem('mentor_user', JSON.stringify(userData));
                setUser(userData);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    };

    const handleAdminLogin = (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');
        callGas('validateAdminLogin', adminCreds.user, adminCreds.pass)
            .then(res => {
                const userData = {
                    name: 'Admin',
                    isAdmin: true
                };
                localStorage.setItem('mentor_user', JSON.stringify(userData));
                setUser(userData);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    };

    if (loading) return <Loading />;

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <div className="brand-icon">A</div>
                    <h1>{isAdminLogin ? "Admin Login" : t('signin_title')}</h1>
                    <p>{isAdminLogin ? "Management & Development Access" : t('signin_tag')}</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="login-body">
                    {isAdminLogin ? (
                        <form className="step-content fade-in" onSubmit={handleAdminLogin}>
                            <button className="back-btn" onClick={() => setIsAdminLogin(false)}>← Mentor Login</button>
                            <div className="form-group">
                                <label>Username</label>
                                <input 
                                    type="text" 
                                    value={adminCreds.user} 
                                    onChange={(e) => setAdminCreds({...adminCreds, user: e.target.value})}
                                    placeholder="Username"
                                />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input 
                                    type="password" 
                                    value={adminCreds.pass} 
                                    onChange={(e) => setAdminCreds({...adminCreds, pass: e.target.value})}
                                    placeholder="••••••••"
                                />
                            </div>
                            <button type="submit" className="submit-btn">Login as Admin</button>
                        </form>
                    ) : (
                        <>
                            {step === 1 && (
                                <div className="step-content fade-in">
                                    <label>{t('label_round')}</label>
                                    <div className="rounds-grid">
                                        {Array.isArray(rounds) && rounds.length > 0 ? rounds.map(r => (
                                            <button 
                                                key={r.id} 
                                                className={`round-btn ${currentRound === r.id ? 'active' : ''}`}
                                                onClick={() => handleRoundSelect(r.id)}
                                            >
                                                {r.label || r.name || r.id}
                                            </button>
                                        )) : (
                                            <div className="no-data">No active rounds found.</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="step-content fade-in">
                                    <button className="back-btn" onClick={() => setStep(1)}>← {t('label_round')}</button>
                                    <label>{t('label_mentor')}</label>
                                    <select 
                                        value={selectedMentor} 
                                        onChange={(e) => {
                                            setSelectedMentor(e.target.value);
                                            setStep(3);
                                        }}
                                    >
                                        <option value="">{t('select_round_first')}</option>
                                        {Array.isArray(mentors) && mentors.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            )}

                            {step === 3 && (
                                <form className="step-content fade-in" onSubmit={handleLogin}>
                                    <button className="back-btn" onClick={() => setStep(2)}>← {selectedMentor}</button>
                                    <label>{t('label_pin')}</label>
                                    <input 
                                        type="password" 
                                        value={pin} 
                                        onChange={(e) => setPin(e.target.value)}
                                        placeholder="••••"
                                        autoFocus
                                    />
                                    <button type="submit" className="submit-btn">{t('btn_signin')}</button>
                                </form>
                            )}
                        </>
                    )}
                </div>

                <div className="login-footer">
                    <button className="lang-toggle" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
                        {lang === 'ar' ? 'English' : 'العربية'}
                    </button>
                    {!isAdminLogin && <button className="admin-link" onClick={() => setIsAdminLogin(true)}>Admin Access</button>}
                </div>
            </div>
        </div>
    );
};

export default Login;
