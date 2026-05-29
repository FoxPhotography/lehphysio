import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="pl-toast-container">
      <div className="pl-toast-message">
        <i className="ti ti-circle-check" style={{ color: 'var(--amber)' }}></i>
        <span>{message}</span>
      </div>
    </div>
  );
};
