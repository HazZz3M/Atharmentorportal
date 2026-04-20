import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import StarRating from './StarRating';
import { useApp } from '../context/AppContext';
import { callGas } from '../api/GasBridge';

const FeedbackModal = ({ isOpen, onClose, companies, existingData, onRefresh }) => {
  const { user, t, currentRound } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    dayOfSession: '',
    currentStatus: '',
    achievements: '',
    actionSteps: '',
    prodScore: '0.0',
    opsScore: '0.0',
    salesScore: '0.0',
    mktScore: '0.0',
    finScore: '0.0',
    mentorScore: '0.0'
  });

  // Populate form if editing
  useEffect(() => {
    if (existingData) {
      setFormData({
        ...existingData,
        mentorScore: existingData.score || '0.0'
      });
    } else {
        // Reset
        setFormData(prev => ({
            ...prev,
            companyName: '',
            dayOfSession: '',
            currentStatus: '',
            achievements: '',
            actionSteps: '',
            prodScore: '0.0',
            opsScore: '0.0',
            salesScore: '0.0',
            mktScore: '0.0',
            finScore: '0.0',
            mentorScore: '0.0'
        }));
    }
  }, [existingData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Update or Create
    const backendData = {
        ...formData,
        mentorName: user.name,
        roundName: currentRound.replace('R_', 'Round_')
    };

    const action = existingData ? 'updateFollowupSession' : 'submitFeedback';
    const args = existingData 
        ? [currentRound, formData.companyName, formData.sessionNum, formData.status, formData.achievements, formData.actions, formData.prodScore, formData.opsScore, formData.salesScore, formData.mktScore, formData.finScore, formData.mentorScore]
        : [backendData];

    callGas(action, ...args)
      .then(() => {
        setLoading(false);
        onRefresh();
        onClose();
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
        alert("Error saving feedback: " + err.message);
      });
  };

  const updateField = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existingData ? "Edit Session" : t('modal_feedback_title')} maxWidth="800px">
      <form onSubmit={handleSubmit} className="feedback-form">
        <div className="form-row">
            <div className="form-group">
                <label>{t('label_company_name')}</label>
                <select 
                    value={formData.companyName} 
                    onChange={e => updateField('companyName', e.target.value)}
                    required
                    disabled={!!existingData}
                >
                    <option value="">{t('placeholder_company')}</option>
                    {companies.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
            </div>
            <div className="form-group" style={{maxWidth: '150px'}}>
                <label>{t('label_day')}</label>
                <select 
                    value={formData.dayOfSession} 
                    onChange={e => updateField('dayOfSession', e.target.value)}
                    required
                    disabled={!!existingData}
                >
                    <option value="">{t('select_day')}</option>
                    {[1,2,3,4,5].map(n => <option key={n} value={`Day_0${n}`}>Day_0{n}</option>)}
                </select>
            </div>
        </div>

        <div className="form-group">
            <label>{t('label_status')}</label>
            <textarea 
                value={formData.currentStatus || formData.status} 
                onChange={e => updateField(existingData ? 'status' : 'currentStatus', e.target.value)}
                placeholder={t('placeholder_desc')}
                dir="auto"
            />
        </div>

        <div className="form-group">
            <label>{t('label_achievements')}</label>
            <textarea 
                value={formData.achievements} 
                onChange={e => updateField('achievements', e.target.value)}
                placeholder={t('placeholder_achievements')}
                dir="auto"
            />
        </div>

        <div className="form-group">
            <label>{t('label_action_steps')}</label>
            <textarea 
                value={formData.actionSteps || formData.actions} 
                onChange={e => updateField(existingData ? 'actions' : 'actionSteps', e.target.value)}
                placeholder={t('placeholder_next_steps')}
                dir="auto"
            />
        </div>

        <div className="scores-section">
            <div className="scores-grid">
                <StarRating label="Product" value={formData.prodScore} onChange={v => updateField('prodScore', v)} />
                <StarRating label="Operations" value={formData.opsScore} onChange={v => updateField('opsScore', v)} />
                <StarRating label="Sales" value={formData.salesScore} onChange={v => updateField('salesScore', v)} />
                <StarRating label="Marketing" value={formData.mktScore} onChange={v => updateField('mktScore', v)} />
                <StarRating label="Finance" value={formData.finScore} onChange={v => updateField('finScore', v)} />
            </div>
            <div className="main-score">
                <StarRating label={t('label_mentor_score')} value={formData.mentorScore} onChange={v => updateField('mentorScore', v)} size="large" />
            </div>
        </div>

        <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>{t('btn_cancel')}</button>
            <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? "Saving..." : existingData ? "Save Changes" : t('btn_submit')}
            </button>
        </div>
      </form>

      <style>{`
        .form-row { display: flex; gap: 20px; margin-bottom: 20px; }
        .form-group { flex: 1; margin-bottom: 20px; }
        .form-group label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 8px; color: var(--muted); }
        .form-group textarea { width: 100%; min-height: 100px; padding: 16px; border-radius: 16px; border: 1px solid var(--border); background: var(--card-2); }
        .scores-section { background: var(--card-2); padding: 24px; border-radius: 20px; margin-bottom: 24px; }
        .scores-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
        .modal-actions { display: flex; gap: 12px; justify-content: flex-end; }
        .secondary-btn { padding: 14px 24px; border-radius: 14px; border: 1px solid var(--border); background: var(--card); font-weight: 700; }
        .primary-btn { padding: 14px 24px; border-radius: 14px; background: var(--accent); color: white; border: none; font-weight: 800; cursor: pointer; }
      `}</style>
    </Modal>
  );
};

export default FeedbackModal;
