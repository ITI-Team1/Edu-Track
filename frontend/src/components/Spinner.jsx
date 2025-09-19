import React from 'react';

// Lightweight spinner using TailwindCSS utilities (no external deps)
// Props: size: 'small' | 'medium' | 'large'; color: 'primary' | 'white' | hex
const Spinner = ({ size = 'medium', color = 'primary' }) => {
  const sizePx = size === 'small' ? 24 : size === 'large' ? 64 : 40;
  const ringColor =
    color === 'white' ? '#ffffff' : color === 'primary' ? '#306cce' : color;
  const baseColor = color === 'white' ? 'rgba(255,255,255,0.25)' : '#e5e7eb';

  return (
    <div
      role="status"
      aria-label="loading"
      style={{
        width: sizePx,
        height: sizePx,
        borderRadius: '9999px',
        borderWidth: sizePx >= 48 ? 4 : 3,
        borderStyle: 'solid',
        borderColor: baseColor,
        borderTopColor: ringColor,
        animation: 'spin 1s linear infinite',
      }}
    >
      <span className="sr-only">Loading...</span>
      <style>
        {`@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}
      </style>
    </div>
  );
};

export default Spinner;
