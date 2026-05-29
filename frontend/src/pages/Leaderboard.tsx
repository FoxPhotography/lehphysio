import React from 'react';

interface LeaderboardProps {
  user: any;
  leaderboard: any[];
  leaderboardTab: string;
  setLeaderboardTab: (tab: string) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  user,
  leaderboard,
  leaderboardTab,
  setLeaderboardTab
}) => {
  return (
    <div className="leaderboard-panel animate-fade-in">
      <div className="pl-section-h2">
        <span className="title-text"><i className="ti ti-trophy"></i> Why Physio? Leaderboard</span>
      </div>
      
      {/* Toggle tabs */}
      <section className="games-filter-tabs">
        <button className={`games-filter-btn ${leaderboardTab === 'all-time' ? 'active' : ''}`} onClick={() => setLeaderboardTab('all-time')}>All-Time</button>
        <button className={`games-filter-btn ${leaderboardTab === 'weekly' ? 'active' : ''}`} onClick={() => setLeaderboardTab('weekly')}>Weekly</button>
        {user && (
          <button className={`games-filter-btn ${leaderboardTab === 'batch' ? 'active' : ''}`} onClick={() => setLeaderboardTab('batch')}>My Batch ({user.batch})</button>
        )}
      </section>

      {/* Visual Podium Top 3 */}
      {leaderboard.length >= 3 && (
        <section className="leaderboard-podium glass-card" style={{ marginBottom: '2rem' }}>
          {/* 2nd place */}
          <div className="podium-column">
            <div className="podium-avatar-container">
              <div className="podium-avatar-ring second">
                <div className="podium-avatar-inner">{(leaderboard[1] as any).username.substring(0,2).toUpperCase()}</div>
              </div>
              <span className="podium-rank-badge">2</span>
            </div>
            <span className="podium-username">{(leaderboard[1] as any).username}</span>
            <span className="podium-xp">{(leaderboard[1] as any).xp} XP</span>
            <div className="podium-bar second">2</div>
          </div>
          {/* 1st place */}
          <div className="podium-column">
            <div className="podium-avatar-container">
              <div className="podium-avatar-ring first">
                <div className="podium-avatar-inner">{(leaderboard[0] as any).username.substring(0,2).toUpperCase()}</div>
              </div>
              <span className="podium-rank-badge">1</span>
            </div>
            <span className="podium-username">{(leaderboard[0] as any).username}</span>
            <span className="podium-xp">{(leaderboard[0] as any).xp} XP</span>
            <div className="podium-bar first">1</div>
          </div>
          {/* 3rd place */}
          <div className="podium-column">
            <div className="podium-avatar-container">
              <div className="podium-avatar-ring third">
                <div className="podium-avatar-inner">{(leaderboard[2] as any).username.substring(0,2).toUpperCase()}</div>
              </div>
              <span className="podium-rank-badge">3</span>
            </div>
            <span className="podium-username">{(leaderboard[2] as any).username}</span>
            <span className="podium-xp">{(leaderboard[2] as any).xp} XP</span>
            <div className="podium-bar third">3</div>
          </div>
        </section>
      )}

      {/* Podium filter list */}
      <div className="leaderboard-list-container">
        {leaderboard.map((u: any) => {
          const isMe = user && u.username === user.username;
          return (
            <div key={u.username} className={`leaderboard-row-item ${isMe ? 'my-row' : ''}`}>
              <span className="row-rank-num">{u.rank_num}</span>
              <div className="row-avatar">{u.username.substring(0,2).toUpperCase()}</div>
              <div className="row-info">
                <div className="row-name">{u.username}</div>
                <div className="row-sub">{u.batch} · {u.rank.emoji} {u.rank.name_en}</div>
              </div>
              <span className="row-xp-badge">{u.xp} XP</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
