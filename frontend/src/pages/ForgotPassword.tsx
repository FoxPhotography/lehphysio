import React, { useState } from 'react';

interface ForgotPasswordProps {
  authError: string;
  authSuccess: string;
  onSubmit: (email: string) => void;
  setCurrentPage: (page: string) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({
  authError,
  authSuccess,
  onSubmit,
  setCurrentPage
}) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email);
  };

  return (
    <div className="auth-panel animate-fade-in" style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900, textAlign: 'center', marginBottom: '0.25rem' }}>Forgot Password</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>Enter your email to receive a reset code</p>
        {authError && <div className="pl-form-error">{authError}</div>}
        {authSuccess && <div className="pl-form-success">{authSuccess}</div>}
        <form onSubmit={handleSubmit}>
          <div className="pl-form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="pl-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Send Code</button>
        </form>
        <div style={{ textAlign: 'center', fontSize: '13px', marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
          Remember your password? <button onClick={() => setCurrentPage('login')} style={{ background: 'transparent', border: 'none', color: 'var(--orange)', fontWeight: 800, cursor: 'pointer' }}>Login</button>
        </div>
      </div>
    </div>
  );
};
