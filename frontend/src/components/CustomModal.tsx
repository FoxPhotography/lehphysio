import React from 'react';

interface CustomModalProps {
  modal: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null;
}

export const CustomModal: React.FC<CustomModalProps> = ({ modal }) => {
  if (!modal || !modal.isOpen) return null;

  return (
    <div className="pl-modal-overlay" onClick={() => modal.onCancel ? modal.onCancel() : modal.onConfirm()}>
      <div className="pl-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="pl-modal-header">
          <h3>{modal.title}</h3>
          <i className="ti ti-info-circle"></i>
        </div>
        <div className="pl-modal-body">
          <p>{modal.message}</p>
        </div>
        <div className="pl-modal-footer">
          <button className="btn-primary mini" onClick={modal.onConfirm}>
            {modal.confirmText || 'OK'}
          </button>
          {modal.onCancel && (
            <button className="btn-outline mini" onClick={modal.onCancel}>
              {modal.cancelText || 'Cancel'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
