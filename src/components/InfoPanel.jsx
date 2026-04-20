import React, { useState, useEffect } from 'react';
import { callGas } from '../api/GasBridge';
import Loading from './Loading';
import './InfoPanel.css';
import { useApp } from '../context/AppContext';

const InfoPanel = ({ companies, currentMentor }) => {
  const { t, currentRound } = useApp();
  const [selectedCompany, setSelectedCompany] = useState('');
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-select first assigned company if available
  useEffect(() => {
    const assigned = companies.find(c => c.isAssigned);
    if (assigned && !selectedCompany) {
        handleCompanySelect(assigned.name);
    }
  }, [companies]);

  const handleCompanySelect = (compName) => {
    setSelectedCompany(compName);
    setLoading(true);
    callGas('getCompanyDetails', currentMentor, compName, currentRound)
      .then(data => {
        setDetails(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  return (
    <div className="info-panel fade-in">
      <div className="info-sidebar">
        <label>{t('label_filter_company')}</label>
        <div className="company-selector">
          <select value={selectedCompany} onChange={(e) => handleCompanySelect(e.target.value)}>
            <option value="">Select Startup</option>
            {Array.isArray(companies) && companies.map(c => (
              <option key={c.name} value={c.name}>
                {c.name} {c.isAssigned ? '★' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="assigned-list">
            <label>Your Assigned Startups</label>
            {Array.isArray(companies) && companies.filter(c => c.isAssigned).map(c => (
                <button 
                   key={c.name} 
                   className={`assigned-item ${selectedCompany === c.name ? 'active' : ''}`}
                   onClick={() => handleCompanySelect(c.name)}
                >
                    {c.name}
                </button>
            ))}
        </div>
      </div>

      <div className="info-main">
        {loading ? (
          <div className="details-skeleton">
             {/* Skeleton loader could go here */}
             <Loading message="Fetching details..." />
          </div>
        ) : details ? (
          <div className="details-card fade-in">
            <div className="card-header">
                <span className="badge">Assigned</span>
                <h2>{details.company}</h2>
            </div>
            
            <div className="stats-grid">
                <div className="stat-box">
                    <span className="st-label">{t('label_start_date')}</span>
                    <span className="st-value">{details.startDate || '—'}</span>
                </div>
                <div className="stat-box">
                    <span className="st-label">{t('label_stage')}</span>
                    <span className="st-value">{details.stage || '—'}</span>
                </div>
                <div className="stat-box">
                    <span className="st-label">{t('label_traction')}</span>
                    <span className="st-value">{details.traction || '—'}</span>
                </div>
                <div className="stat-box">
                    <span className="st-label">{t('label_revenue')}</span>
                    <span className="st-value">{details.annualRevenue || '—'}</span>
                </div>
            </div>

            <div className="description-section">
                <label>Startup Description</label>
                <p dir="auto">{details.description || 'No description provided.'}</p>
            </div>
            
            <div className="card-footer">
                <button className="premium-btn diagnose">Diagnose Startup</button>
            </div>
          </div>
        ) : (
          <div className="empty-state">
             <div className="icon">🚀</div>
             <p>Select a company to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoPanel;
