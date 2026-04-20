import React from 'react';
import './StarRating.css';

const StarRating = ({ value, onChange, readonly = false, label, size = 'medium' }) => {
  const stars = [1, 2, 3, 4, 5];
  const roundedValue = Math.round(parseFloat(value || 0));

  return (
    <div className={`star-rating-container ${size}`}>
      {label && <label className="star-label">{label}</label>}
      <div className="stars-wrapper">
        {stars.map((s) => (
          <span
            key={s}
            className={`star-icon ${s <= roundedValue ? 'active' : ''} ${readonly ? 'readonly' : 'interactive'}`}
            onClick={() => !readonly && onChange && onChange(s.toFixed(1))}
          >
            ★
          </span>
        ))}
        <span className="rating-number">{(parseFloat(value || 0)).toFixed(1)}</span>
      </div>
    </div>
  );
};

export default StarRating;
