import React from 'react';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  setCommunityTab: (tab: 'feed' | 'chat') => void;
  unseenCount: number;
  user: any;
  equippedTitle: string;
  getAvatarFrameClass: () => string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  setCurrentPage,
  setCommunityTab,
  unseenCount,
  user,
  equippedTitle,
  getAvatarFrameClass
}) => {
  return (
    <aside className="app-sidebar">
      <a href="#" className="sidebar-logo" onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}>
        <i className="ti ti-microphone"></i> Why <span>Physio?</span>
      </a>

      <ul className="sidebar-nav">
        <li>
          <button className={`sidebar-link-btn ${currentPage === 'home' ? 'active' : ''}`} onClick={() => setCurrentPage('home')}>
            <i className="ti ti-smart-home"></i> Home
          </button>
        </li>
        <li>
          <button className={`sidebar-link-btn ${currentPage === 'episodes' || currentPage === 'episode-detail' ? 'active' : ''}`} onClick={() => setCurrentPage('episodes')}>
            <i className="ti ti-video"></i> Episodes
          </button>
        </li>
        <li>
          <button className={`sidebar-link-btn ${currentPage === 'community' ? 'active' : ''}`} onClick={() => { setCurrentPage('community'); setCommunityTab('chat'); }} style={{ position: 'relative', width: '100%', justifyContent: 'space-between', display: 'flex' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <i className="ti ti-messages"></i> Chat
            </span>
            {unseenCount > 0 && (
              <span className="mobile-badge" style={{ position: 'static', marginRight: 'auto', display: 'inline-flex' }}>
                {unseenCount}
              </span>
            )}
          </button>
        </li>
        <li>
          <button className={`sidebar-link-btn ${currentPage === 'games' || currentPage === 'play-game' ? 'active' : ''}`} onClick={() => setCurrentPage('games')}>
            <i className="ti ti-device-gamepad-2"></i> Games
          </button>
        </li>
        <li>
          <button className={`sidebar-link-btn ${currentPage === 'leaderboard' ? 'active' : ''}`} onClick={() => setCurrentPage('leaderboard')}>
            <i className="ti ti-trophy"></i> Leaderboard
          </button>
        </li>
        <li>
          <button className={`sidebar-link-btn ${currentPage === 'rewards' ? 'active' : ''}`} onClick={() => setCurrentPage('rewards')}>
            <i className="ti ti-gift"></i> Rewards
          </button>
        </li>
        {user && (
          <li>
            <button className={`sidebar-link-btn ${currentPage === 'profile' ? 'active' : ''}`} onClick={() => setCurrentPage('profile')}>
              <i className="ti ti-user-circle"></i> Profile
            </button>
          </li>
        )}
      </ul>

      {/* User Card inside Desktop Sidebar */}
      <div className="sidebar-user-section">
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className={`mobile-avatar-ring ${getAvatarFrameClass()}`}>
              <div className="mobile-avatar-inner">{user.username[0].toUpperCase()}</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.username}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {equippedTitle !== 'none' ? equippedTitle : `${user.rank.emoji} ${user.rank.name_en}`}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="btn-primary mini" onClick={() => setCurrentPage('login')}>Login</button>
            <button className="btn-outline mini" onClick={() => setCurrentPage('register')}>Register</button>
          </div>
        )}
      </div>
    </aside>
  );
};
