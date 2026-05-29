import React from 'react';

interface MobileHeaderProps {
  setCurrentPage: (page: string) => void;
  user: any;
  getAvatarFrameClass: () => string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  setCurrentPage,
  user,
  getAvatarFrameClass
}) => {
  return (
    <header className="app-mobile-header">
      <a href="#" className="mobile-logo" onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}>
        Why <span>Physio?</span>
      </a>
      
      <div className="mobile-header-actions">
        <button className="mobile-btn" onClick={() => setCurrentPage('rewards')}>
          <i className="ti ti-bell"></i>
          <span className="mobile-badge">3</span>
        </button>
        
        {user ? (
          <div className={`mobile-avatar-ring ${getAvatarFrameClass()}`} onClick={() => setCurrentPage('profile')}>
            <div className="mobile-avatar-inner">{user.username[0].toUpperCase()}</div>
          </div>
        ) : (
          <button className="mobile-btn" onClick={() => setCurrentPage('login')}>
            <i className="ti ti-login"></i>
          </button>
        )}
      </div>
    </header>
  );
};
