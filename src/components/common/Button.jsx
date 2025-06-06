import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  className = '', 
  type = 'button',
  variant = 'primary'
}) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const classes = [baseClass, variantClass, className].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button; 