import React from 'react';
import '../../styles/ConfirmDialog.css';

const ConfirmDialog = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog">
        <div className="confirm-dialog-content">
          <p>{message}</p>
          <div className="confirm-dialog-actions">
            <button 
              className="confirm-dialog-button confirm"
              onClick={onConfirm}
            >
              Confirm
            </button>
            <button 
              className="confirm-dialog-button cancel"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog; 