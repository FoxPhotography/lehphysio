import React from 'react';

interface BottomNavProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  setCommunityTab: (tab: 'feed' | 'chat') => void;
  unseenCount: number;
  user: any;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentPage,
  setCurrentPage,
  setCommunityTab,
  unseenCount,
  user
}) => {
  return (
    <nav className="app-bottom-nav">
      <button className={`bottom-nav-item ${currentPage === 'home' ? 'active' : ''}`} onClick={() => setCurrentPage('home')}>
        <i className="ti ti-smart-home"></i>
        <span>Home</span>
      </button>
      <button className={`bottom-nav-item ${currentPage === 'episodes' || currentPage === 'episode-detail' ? 'active' : ''}`} onClick={() => setCurrentPage('episodes')}>
        <i className="ti ti-video"></i>
        <span>Episodes</span>
      </button>
      <button className={`bottom-nav-item ${currentPage === 'community' ? 'active' : ''}`} onClick={() => { setCurrentPage('community'); setCommunityTab('chat'); }} style={{ position: 'relative' }}>
        <i className="ti ti-messages"></i>
        <span>Chat</span>
        {unseenCount > 0 && (
          <span className="mobile-badge" style={{ position: 'absolute', top: '4px', right: 'calc(50% - 22px)' }}>
            {unseenCount}
          </span>
        )}
      </button>
      <button className={`bottom-nav-item ${currentPage === 'games' || currentPage === 'play-game' ? 'active' : ''}`} onClick={() => setCurrentPage('games')}>
        <i className="ti ti-device-gamepad-2"></i>
        <span>Games</span>
      </button>
      <button className={`bottom-nav-item ${currentPage === 'profile' ? 'active' : ''}`} onClick={() => {
        if (user) setCurrentPage('profile');
        else setCurrentPage('login');
      }}>
        <i className="ti ti-user-circle"></i>
        <span>Account</span>
      </button>
    </nav>
  );
};
