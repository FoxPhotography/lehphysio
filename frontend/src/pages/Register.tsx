import React from 'react';

interface RegisterProps {
  registerForm: any;
  setRegisterForm: React.Dispatch<React.SetStateAction<any>>;
  authError: string;
  authSuccess: string;
  handleRegister: (e: React.FormEvent) => void;
  setCurrentPage: (page: string) => void;
}

export const Register: React.FC<RegisterProps> = ({
  registerForm,
  setRegisterForm,
  authError,
  authSuccess,
  handleRegister,
  setCurrentPage
}) => {
  return (
    <div className="auth-panel animate-fade-in" style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900, textAlign: 'center', marginBottom: '0.25rem' }}>Register</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>Join your colleagues and compete on the leaderboard</p>
        {authError && <div className="pl-form-error">{authError}</div>}
        {authSuccess && <div className="pl-form-success">{authSuccess}</div>}
        <form onSubmit={handleRegister}>
          <div className="pl-form-group">
            <label>Username</label>
            <input
              type="text"
              className="pl-input"
              value={registerForm.username}
              onChange={(e) => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
              required
            />
          </div>
          <div className="pl-form-group">
            <label>Email</label>
            <input
              type="email"
              className="pl-input"
              value={registerForm.email}
              onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          <div className="pl-form-group">
            <label>Password</label>
            <input
              type="password"
              className="pl-input"
              value={registerForm.password}
              onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>
          <div className="pl-form-group">
            <label>Academic Batch</label>
            <select
              className="pl-input"
              value={registerForm.batch}
              onChange={(e) => setRegisterForm(prev => ({ ...prev, batch: e.target.value }))}
            >
              <option value="PT 9">PT 9 (Year 6)</option>
              <option value="PT 10">PT 10 (Year 5)</option>
              <option value="PT 11">PT 11 (Year 4)</option>
              <option value="PT 12">PT 12 (Year 3)</option>
              <option value="PT 13">PT 13 (Year 2)</option>
              <option value="PT 14">PT 14 (Year 1)</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Register</button>
        </form>
        <div style={{ textAlign: 'center', fontSize: '13px', marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
          Already have an account? <button onClick={() => setCurrentPage('login')} style={{ background: 'transparent', border: 'none', color: 'var(--orange)', fontWeight: 800, cursor: 'pointer' }}>Login</button>
        </div>
      </div>
    </div>
  );
};
