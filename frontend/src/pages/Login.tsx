import React from 'react';

interface LoginProps {
  loginForm: any;
  setLoginForm: React.Dispatch<React.SetStateAction<any>>;
  authError: string;
  handleLogin: (e: React.FormEvent) => void;
  setCurrentPage: (page: string) => void;
}

export const Login: React.FC<LoginProps> = ({
  loginForm,
  setLoginForm,
  authError,
  handleLogin,
  setCurrentPage
}) => {
  return (
    <div className="auth-panel animate-fade-in" style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900, textAlign: 'center', marginBottom: '0.25rem' }}>Login</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>Welcome back to Why Physio? family</p>
        {authError && <div className="pl-form-error">{authError}</div>}
        <form onSubmit={handleLogin}>
          <div className="pl-form-group">
            <label>Username</label>
            <input
              type="text"
              className="pl-input"
              value={loginForm.username}
              onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
              required
            />
          </div>
          <div className="pl-form-group">
            <label>Password</label>
            <input
              type="password"
              className="pl-input"
              value={loginForm.password}
              onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Login</button>
        </form>
        <div style={{ textAlign: 'center', fontSize: '13px', marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <button onClick={() => setCurrentPage('register')} style={{ background: 'transparent', border: 'none', color: 'var(--orange)', fontWeight: 800, cursor: 'pointer' }}>Register</button>
        </div>
      </div>
    </div>
  );
};
