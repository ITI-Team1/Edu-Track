import React from 'react';
import { Hourglass } from 'react-loader-spinner';

const Spinner = ({ size = 'medium', color = 'primary' }) => {
  const sizeMap = {
    small: 24,
    medium: 48,
    large: 64,
  };
  const dim = sizeMap[size] || sizeMap.medium;

  // Default colors as requested; adjust for white variant
  const colors = color === 'white'
    ? ['#ffffff', '#e5e7eb']
    : ['#306cce', '#72a1ed'];

  return (
    <Hourglass
      visible
      height={dim}
      width={dim}
      ariaLabel="hourglass-loading"
      colors={colors}
    />
  );
};

export default Spinner;
