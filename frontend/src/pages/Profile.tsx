import React from 'react';

interface ProfileProps {
  user: any;
  equippedFrame: string;
  setEquippedFrame: (val: string) => void;
  equippedTitle: string;
  setEquippedTitle: (val: string) => void;
  unlockedCosmetics: string[];
  setCurrentPage: (page: string) => void;
  handleLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({
  user,
  equippedFrame,
  setEquippedFrame,
  equippedTitle,
  setEquippedTitle,
  unlockedCosmetics,
  setCurrentPage,
  handleLogout
}) => {
  if (!user) return null;
  const progressPct = (user.total_xp % 1000) / 10;
  // Circular calculations
  const radius = 60;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (progressPct / 100) * circ;

  const getAvatarFrameClass = () => {
    if (equippedFrame === 'gold-glow') return 'avatar-frame-gold-glow';
    if (equippedFrame === 'neon-ring') return 'avatar-frame-neon-ring';
    return '';
  };

  return (
    <div className="profile-panel animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="glass-card profile-rank-panel">
        {/* Circular level progress */}
        <div className="circle-progress-wrapper">
          <svg className="svg-progress-ring" width="140" height="140">
            <defs>
              <linearGradient id="orange-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6A00" />
                <stop offset="100%" stopColor="#FFB000" />
              </linearGradient>
            </defs>
            <circle className="progress-ring-circle-bg" strokeWidth="8" fill="transparent" r={radius} cx="70" cy="70" />
            <circle
              className="progress-ring-circle-fill"
              strokeWidth="8"
              fill="transparent"
              r={radius}
              cx="70"
              cy="70"
              strokeDasharray={circ}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="circle-progress-inner-text">
            <span className="circle-progress-level-num">{Math.floor(user.total_xp / 1000) + 1}</span>
            <span className="circle-progress-level-lbl">LEVEL</span>
          </div>
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 900 }}>{user.username}</h2>
        <span style={{ color: 'var(--orange)', fontWeight: 800, fontSize: '14.5px', marginBottom: '1.5rem', display: 'inline-block' }}>
          {user.rank.emoji} {user.rank.name_en}
        </span>

        {/* Equips frames and titles badges */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1.5rem' }}>
          {equippedFrame !== 'none' && (
            <span className="badge-tag" style={{ borderColor: equippedFrame === 'gold-glow' ? '#FFD700' : '#00ffff', color: '#fff' }}>
              Frame: {equippedFrame === 'gold-glow' ? 'Gold Glow 🌟' : 'Neon Ring 🩵'}
            </span>
          )}
          {equippedTitle !== 'none' && (
            <span className="badge-tag" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', borderColor: 'var(--orange)' }}>
              Title: {equippedTitle}
            </span>
          )}
        </div>

        {/* Stats Badges Grid */}
        <div className="stats-badge-grid" style={{ gridTemplateColumns: '1fr 1fr', width: '100%', marginBottom: '1.5rem' }}>
          <div className="glass-card" style={{ background: '#0A0A0A' }}>
            <span className="stat-badge-label">Total XP</span>
            <div className="stat-badge-value" style={{ fontSize: '20px' }}>{user.total_xp}</div>
          </div>
          <div className="glass-card" style={{ background: '#0A0A0A' }}>
            <span className="stat-badge-label">Login Streak</span>
            <div className="stat-badge-value" style={{ fontSize: '20px' }}>{user.streak_count} 🔥</div>
          </div>
        </div>

        {/* Equipment customization */}
        {unlockedCosmetics.length > 0 && (
          <div className="glass-card" style={{ width: '100%', background: '#0A0A0A', textAlign: 'right', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--orange)' }}>Equip Cosmetics</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Equip Glow Frame:</label>
                <select
                  className="pl-input"
                  value={equippedFrame}
                  onChange={(e) => {
                    setEquippedFrame(e.target.value);
                    localStorage.setItem('eq_frame', e.target.value);
                  }}
                  style={{ marginTop: '4px' }}
                >
                  <option value="none">No Frame</option>
                  {unlockedCosmetics.includes('gold-glow') && <option value="gold-glow">Gold Glow Frame 🌟</option>}
                  {unlockedCosmetics.includes('neon-ring') && <option value="neon-ring">Neon Ring Frame 🩵</option>}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Equip Title:</label>
                <select
                  className="pl-input"
                  value={equippedTitle}
                  onChange={(e) => {
                    setEquippedTitle(e.target.value);
                    localStorage.setItem('eq_title', e.target.value);
                  }}
                  style={{ marginTop: '4px' }}
                >
                  <option value="none">No Title</option>
                  {unlockedCosmetics.includes('neuro-specialist') && <option value="Neuro Specialist 🧠">Neuro Specialist 🧠</option>}
                  {unlockedCosmetics.includes('diagnosis-legend') && <option value="Diagnosis Legend 👑">Diagnosis Legend 👑</option>}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
          {user.role === 'admin' && (
            <button className="btn-primary" onClick={() => setCurrentPage('admin')}>
              <i className="ti ti-shield-lock"></i> Admin Dashboard
            </button>
          )}
          <button className="btn-outline" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};
