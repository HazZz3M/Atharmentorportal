import React, { useState } from 'react';
import StarRating from './StarRating';
import './FeedbackPanel.css';
import { useApp } from '../context/AppContext';

const SessionCard = ({ session, company, lang, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  
  const cats = [
    { label: 'Product', val: session.prodScore },
    { label: 'Operations', val: session.opsScore },
    { label: 'Sales', val: session.salesScore },
    { label: 'Marketing', val: session.mktScore },
    { label: 'Finance', val: session.finScore }
  ];
  
  const avg = cats.reduce((acc, c) => acc + parseFloat(c.val || 0), 0) / 5;

  return (
    <div className={`session-card ${expanded ? 'expanded' : ''}`} onClick={() => setExpanded(!expanded)}>
      <div className="session-header">
        <div className="sh-left">
           <span className="session-num">Session {session.num}</span>
           <span className="mentor-label">Mentor: {session.score || '0.0'}</span>
        </div>
        <div className="sh-right">
           <StarRating value={avg} readonly size="small" />
        </div>
      </div>

      {expanded && (
        <div className="session-details fade-in" onClick={e => e.stopPropagation()}>
          <div className="detail-section">
             <label>{lang === 'ar' ? 'الحالة الحالية' : 'Current Status'}</label>
             <p dir="auto">{session.status || '—'}</p>
          </div>
          <div className="detail-section">
             <label>{lang === 'ar' ? 'أبرز الإنجازات' : 'Key Achievements'}</label>
             <p dir="auto">{session.achievements || '—'}</p>
          </div>
          <div className="detail-section">
             <label>{lang === 'ar' ? 'خطوات العمل' : 'Action Steps'}</label>
             <p dir="auto">{session.actions || '—'}</p>
          </div>
          
          <div className="categories-grid">
             {cats.map(c => (
                <div key={c.label} className="cat-item">
                   <span>{c.label}</span>
                   <span className="cat-val">{parseFloat(c.val || 0).toFixed(1)}</span>
                </div>
             ))}
          </div>

          <div className="session-footer">
             {session.file && (
                <a href={session.file} target="_blank" rel="noreferrer" className="file-link">
                   View Uploaded File
                </a>
             )}
             <button className="edit-btn" onClick={() => onEdit({...session, companyName: company})}>Edit Session</button>
          </div>
        </div>
      )}
    </div>
  );
};

const FeedbackPanel = ({ followUpData, onCreate, onEdit }) => {
  const { lang, t } = useApp();
  const [search, setSearch] = useState('');

  const filtered = followUpData.filter(item => 
    item.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="feedback-panel fade-in">
      <div className="panel-header">
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Filter by company..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="create-feedback-btn" onClick={onCreate}>+ Create Feedback</button>
      </div>

      <div className="timeline-list">
        {filtered.map(item => {
           const active = item.sessions.filter(s => s.status || s.actions || s.score);
           if (active.length === 0) return null;

           const sessionAvgs = active.map(s => {
              const sum = [s.prodScore, s.opsScore, s.salesScore, s.mktScore, s.finScore]
                .reduce((acc, v) => acc + parseFloat(v || 0), 0);
              return sum / 5;
           });
           const compAvg = sessionAvgs.length > 0 ? (sessionAvgs.reduce((a, b) => a + b, 0) / sessionAvgs.length) : 0;

           return (
             <div key={item.company} className="company-block">
                <div className="company-header">
                   <h3>{item.company}</h3>
                   <div className="company-avg">
                      <span className="avg-label">AVG</span>
                      <span className="avg-val">{compAvg.toFixed(1)}</span>
                   </div>
                </div>
                <div className="sessions-list">
                   {active.map(s => (
                      <SessionCard key={s.num} session={s} company={item.company} lang={lang} onEdit={onEdit} />
                   ))}
                </div>
             </div>
           );
        })}
      </div>
    </div>
  );
};

export default FeedbackPanel;
