import React from 'react';
import './Loading.css';
import { useApp } from '../context/AppContext';

const Loading = ({ message }) => {
  const { t } = useApp();
  return (
    <div className="loading-container">
      <div className="loading-box">
        <div className="loading-spinner"></div>
        <div className="loading-text">{message || t('loading')}</div>
      </div>
    </div>
  );
};

export default Loading;
