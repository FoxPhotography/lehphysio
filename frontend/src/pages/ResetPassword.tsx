import React, { useState } from 'react';
import { OtpInput } from '../components/OtpInput';

interface ResetPasswordProps {
  email: string;
  authError: string;
  authSuccess: string;
  onSubmit: (code: string, newPassword: string) => void;
  setCurrentPage: (page: string) => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({
  email,
  authError,
  authSuccess,
  onSubmit,
  setCurrentPage
}) => {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(code, newPassword);
  };

  return (
    <div className="auth-panel animate-fade-in" style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900, textAlign: 'center', marginBottom: '0.25rem' }}>Reset Password</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>
          Reset code sent to <strong style={{ color: 'var(--orange)' }}>{email}</strong>
        </p>
        {authError && <div className="pl-form-error">{authError}</div>}
        {authSuccess && <div className="pl-form-success">{authSuccess}</div>}
        <form onSubmit={handleSubmit}>
          <div className="pl-form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '8px', textAlign: 'center' }}>6-Digit Code</label>
            <OtpInput value={code} onChange={setCode} />
          </div>
          <div className="pl-form-group">
            <label>New Password</label>
            <input
              type="password"
              className="pl-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Update Password</button>
        </form>
        <div style={{ textAlign: 'center', fontSize: '13px', marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
          Remember your password? <button onClick={() => setCurrentPage('login')} style={{ background: 'transparent', border: 'none', color: 'var(--orange)', fontWeight: 800, cursor: 'pointer' }}>Login</button>
        </div>
      </div>
    </div>
  );
};
