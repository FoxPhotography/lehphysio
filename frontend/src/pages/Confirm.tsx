import React from 'react';

interface ConfirmProps {
  confirmCode: string;
  setConfirmCode: (val: string) => void;
  authError: string;
  authSuccess: string;
  handleConfirm: (e: React.FormEvent) => void;
}

export const Confirm: React.FC<ConfirmProps> = ({
  confirmCode,
  setConfirmCode,
  authError,
  authSuccess,
  handleConfirm
}) => {
  return (
    <div className="auth-panel animate-fade-in" style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900, textAlign: 'center', marginBottom: '0.25rem' }}>Verify Account</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>Enter the 6-digit verification code sent to your email</p>
        {authError && <div className="pl-form-error">{authError}</div>}
        {authSuccess && <div className="pl-form-success">{authSuccess}</div>}
        <form onSubmit={handleConfirm}>
          <input
            type="text"
            className="pl-input"
            maxLength={6}
            value={confirmCode}
            onChange={(e) => setConfirmCode(e.target.value)}
            style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '8px', fontWeight: 900, marginBottom: '1.5rem' }}
            required
          />
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>Verify Account</button>
        </form>
      </div>
    </div>
  );
};
