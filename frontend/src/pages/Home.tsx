import React from 'react';

interface HomeProps {
  user: any;
  loginReward: any;
  navigateToEpisode: (id: number) => void;
  setCurrentPage: (page: string) => void;
  setCommunityTab: (tab: 'feed' | 'chat') => void;
  pollVotes: number[];
  userVotedOption: number | null;
  hasVotedPoll: boolean;
  handlePollVote: (idx: number) => void;
  newPostContent: string;
  setNewPostContent: (content: string) => void;
  handleCreatePost: (e: React.FormEvent) => void;
  communityPosts: any[];
  handleLikePost: (id: number) => void;
  showToast: (msg: string) => void;
}

export const Home: React.FC<HomeProps> = ({
  user,
  loginReward,
  navigateToEpisode,
  setCurrentPage,
  setCommunityTab,
  pollVotes,
  userVotedOption,
  hasVotedPoll,
  handlePollVote,
  newPostContent,
  setNewPostContent,
  handleCreatePost,
  communityPosts,
  handleLikePost,
  showToast
}) => {
  const activeStreak = user?.streak_count || 12;

  return (
    <div className="home-panel animate-fade-in">
      {/* Banner alerts */}
      {loginReward && loginReward.daily_login && (
        <div className="pl-banner">
          <i className="ti ti-gift"></i>
          <span>Welcome back! You earned <strong>+10 XP</strong> for your daily login.</span>
        </div>
      )}

      {/* Hero podcast card */}
      <section className="home-hero-card glass-card">
        <div className="hero-thumbnail" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=600&auto=format&fit=crop')` }}>
          <div className="hero-thumbnail-overlay"></div>
          <i className="ti ti-microphone hero-mic-glow"></i>
        </div>
        <div className="hero-info-section">
          <div className="hero-badge-row">
            <span className="badge-tag">NEW EPISODE</span>
            <span className="badge-tag" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff' }}>EP.23</span>
          </div>
          <h2 className="hero-title">SPASM</h2>
          <h3 className="hero-title" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--orange)' }}>Upper Motor Neuron</h3>
          <p className="hero-desc">A detailed explanation of muscle spasticity resulting from central nervous system injuries and control mechanics.</p>
          <div className="hero-actions-row">
            <button className="btn-primary" onClick={() => navigateToEpisode(1)}>
              <i className="ti ti-player-play"></i> Watch Now
            </button>
            <button className="btn-outline" style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0 }}>
              <i className="ti ti-bookmark"></i>
            </button>
          </div>
        </div>
      </section>

      {/* Streak & Streak Panel */}
      <section className="streak-row-wrapper">
        <div className="streak-welcome-text">
          <h1>Why Physio? 🔥</h1>
          <p>Listen. Learn. Elevate your level.</p>
        </div>
        <button className="streak-badge" onClick={() => setCurrentPage('profile')}>
          <i className="ti ti-flame" style={{ fontSize: '20px' }}></i>
          <span>{activeStreak} Day Streak</span>
          <i className="ti ti-chevron-left" style={{ fontSize: '12px', marginRight: '4px' }}></i>
        </button>
      </section>

      {/* Quick XP actions grid */}
      <section className="quick-actions-row">
        <div className="quick-action-card" onClick={() => setCurrentPage('episodes')}>
          <div className="quick-action-icon"><i className="ti ti-player-play"></i></div>
          <span className="quick-action-name">Watch</span>
          <span className="quick-action-xp">+50 XP</span>
        </div>
        <div className="quick-action-card" onClick={() => setCurrentPage('rewards')}>
          <div className="quick-action-icon"><i className="ti ti-key"></i></div>
          <span className="quick-action-name">Enter Code</span>
          <span className="quick-action-xp">+100 XP</span>
        </div>
        <div className="quick-action-card" onClick={() => { setCurrentPage('community'); setCommunityTab('chat'); }}>
          <div className="quick-action-icon"><i className="ti ti-messages"></i></div>
          <span className="quick-action-name">Comment</span>
          <span className="quick-action-xp">+20 XP</span>
        </div>
        <div className="quick-action-card" onClick={() => setCurrentPage('games')}>
          <div className="quick-action-icon"><i className="ti ti-device-gamepad-2"></i></div>
          <span className="quick-action-name">Challenges</span>
          <span className="quick-action-xp">+30 XP</span>
        </div>
        <div className="quick-action-card" onClick={() => setCurrentPage('rewards')}>
          <div className="quick-action-icon"><i className="ti ti-shopping-cart"></i></div>
          <span className="quick-action-name">Rewards Shop</span>
          <span className="quick-action-xp">Shop</span>
        </div>
      </section>

      {/* Stats Grid */}
      {user && (
        <section className="stats-badge-grid">
          <div className="stat-badge-card glass-card">
            <span className="stat-badge-label">Total XP</span>
            <div className="stat-badge-value">{user.total_xp.toLocaleString()}</div>
            {/* Sparkline decoration */}
            <svg className="stat-sparkline" viewBox="0 0 100 20">
              <path d="M0,15 L10,12 L20,18 L30,10 L40,14 L50,8 L60,11 L70,5 L80,12 L90,6 L100,2" />
            </svg>
          </div>
          <div className="stat-badge-card glass-card">
            <span className="stat-badge-label">Level</span>
            <div className="stat-badge-value">{Math.floor(user.total_xp / 1000) + 1}</div>
            <div className="stat-badge-progress-bar">
              <div className="stat-badge-progress-fill" style={{ width: `${(user.total_xp % 1000) / 10}%` }}></div>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {(user.total_xp % 1000)} / 1,000 to next
            </span>
          </div>
          <div className="stat-badge-card glass-card">
            <span className="stat-badge-label">Global Rank</span>
            <div className="stat-badge-value">#87</div>
            <span style={{ fontSize: '11px', color: 'var(--orange)', fontWeight: 800 }}>Top 1%</span>
          </div>
          <div className="stat-badge-card glass-card">
            <span className="stat-badge-label">Badges</span>
            <div className="badges-row">
              <span className="mini-badge" title="Active Streak">🔥</span>
              <span className="mini-badge" title="Rehab Legend">👑</span>
              <span className="mini-badge" title="Anatomy Champ">🧠</span>
              <span className="mini-badge mini-badge-more">+12</span>
            </div>
          </div>
        </section>
      )}

      {/* Top 3 Podium Preview */}
      <section className="leaderboard-podium-preview" style={{ marginBottom: '2.5rem' }}>
        <div className="pl-section-h2">
          <span className="title-text"><i className="ti ti-trophy"></i> Leaderboard</span>
          <button className="title-link" onClick={() => setCurrentPage('leaderboard')}>
            View All <i className="ti ti-chevron-left"></i>
          </button>
        </div>
        <div className="leaderboard-podium glass-card">
          {/* 2nd Place */}
          <div className="podium-column">
            <div className="podium-avatar-container">
              <div className="podium-avatar-ring second">
                <div className="podium-avatar-inner">OE</div>
              </div>
              <span className="podium-rank-badge">2</span>
            </div>
            <span className="podium-username">Omar Ashraf</span>
            <span className="podium-xp">12,540 XP</span>
            <div className="podium-bar second">2</div>
          </div>
          {/* 1st Place */}
          <div className="podium-column">
            <div className="podium-avatar-container">
              <div className="podium-avatar-ring first">
                <div className="podium-avatar-inner">MT</div>
              </div>
              <span className="podium-rank-badge">1</span>
            </div>
            <span className="podium-username">Mahmoud Tarek</span>
            <span className="podium-xp">15,670 XP</span>
            <div className="podium-bar first">1</div>
          </div>
          {/* 3rd Place */}
          <div className="podium-column">
            <div className="podium-avatar-container">
              <div className="podium-avatar-ring third">
                <div className="podium-avatar-inner">NE</div>
              </div>
              <span className="podium-rank-badge">3</span>
            </div>
            <span className="podium-username">Nourhan Emad</span>
            <span className="podium-xp">11,230 XP</span>
            <div className="podium-bar third">3</div>
          </div>
        </div>
      </section>

      {/* Continue Listening row */}
      <section className="continue-listening-section">
        <div className="pl-section-h2">
          <span className="title-text"><i className="ti ti-playlist"></i> Continue Listening</span>
          <button className="title-link" onClick={() => setCurrentPage('episodes')}>
            View All <i className="ti ti-chevron-left"></i>
          </button>
        </div>
        <div className="horizontal-slider">
          <div className="continue-card glass-card">
            <div className="continue-thumb" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=280&auto=format&fit=crop')` }}>
              <button className="continue-play-btn" onClick={() => navigateToEpisode(1)}>
                <i className="ti ti-player-play"></i>
              </button>
            </div>
            <div className="continue-info">
              <h4 className="continue-title">SPASM</h4>
              <div className="continue-episode-num">Episode 23</div>
              <div className="continue-progress-container">
                <div className="progress-track"><div className="progress-fill" style={{ width: '62%' }}></div></div>
                <span>62%</span>
              </div>
            </div>
          </div>
          <div className="continue-card glass-card">
            <div className="continue-thumb" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=280&auto=format&fit=crop')` }}>
              <button className="continue-play-btn" onClick={() => navigateToEpisode(2)}>
                <i className="ti ti-player-play"></i>
              </button>
            </div>
            <div className="continue-info">
              <h4 className="continue-title">PAIN Mechanics</h4>
              <div className="continue-episode-num">Episode 22</div>
              <div className="continue-progress-container">
                <div className="progress-track"><div className="progress-fill" style={{ width: '40%' }}></div></div>
                <span>40%</span>
              </div>
            </div>
          </div>
          <div className="continue-card glass-card">
            <div className="continue-thumb" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=280&auto=format&fit=crop')` }}>
              <button className="continue-play-btn" onClick={() => navigateToEpisode(3)}>
                <i className="ti ti-player-play"></i>
              </button>
            </div>
            <div className="continue-info">
              <h4 className="continue-title">GAIT & Biomechanics</h4>
              <div className="continue-episode-num">Episode 21</div>
              <div className="continue-progress-container">
                <div className="progress-track"><div className="progress-fill" style={{ width: '75%' }}></div></div>
                <span>75%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Feed */}
      <section className="community-preview-section">
        <div className="pl-section-h2" style={{ marginBottom: '1.5rem' }}>
          <span className="title-text"><i className="ti ti-news"></i> Why Physio? Community Feed</span>
        </div>

        {/* Poll of the Day */}
        <div className="daily-poll-card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="poll-question">📊 Interactive Medical Question of the Day: What is the nerve supplying the Deltoid muscle?</h3>
          <div className="poll-options-list">
            {['Axillary nerve', 'Radial nerve', 'Median nerve', 'Musculocutaneous nerve'].map((option, idx) => {
              const totalV = pollVotes.reduce((a,b) => a+b, 0);
              const pct = totalV > 0 ? Math.round((pollVotes[idx] / totalV) * 100) : 0;
              return (
                <button
                  key={idx}
                  className={`poll-option-btn ${userVotedOption === idx ? 'selected' : ''}`}
                  onClick={() => handlePollVote(idx)}
                  disabled={hasVotedPoll}
                >
                  <span>{option}</span>
                  {hasVotedPoll && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="poll-option-percentage">{pct}%</span>
                      <div className="poll-option-fill" style={{ width: `${pct}%` }}></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {hasVotedPoll && (
            <p style={{ fontSize: '11px', color: 'var(--amber)', marginTop: '0.75rem', fontWeight: 800 }}>
              You earned +30 XP for participating in the interactive poll! ⚡
            </p>
          )}
        </div>

        {/* Post Composer */}
        {user && (
          <form onSubmit={handleCreatePost} className="community-composer-card" style={{ marginBottom: '1.5rem' }}>
            <div className="composer-row">
              <div className="composer-avatar">{user.username[0].toUpperCase()}</div>
              <div className="composer-main">
                <textarea
                  className="composer-textarea"
                  placeholder="What's on your mind today, champ? Share your question or achievement..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  maxLength={300}
                ></textarea>
                <div className="composer-actions">
                  <button type="submit" className="btn-primary mini" disabled={!newPostContent.trim()}>
                    Publish Post <i className="ti ti-send"></i>
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Posts feed */}
        <div className="leaderboard-list-container">
          {communityPosts.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>No posts available at the moment.</p>
          ) : (
            communityPosts.map((post: any) => (
              <div key={post.id} className="community-feed-item glass-card" style={{ marginBottom: '1rem' }}>
                <div className="feed-item-header">
                  <div className="feed-user-block">
                    <div className="feed-user-avatar">{post.username[0].toUpperCase()}</div>
                    <div className="feed-user-details">
                      <div className="feed-username-row">
                        <span className="feed-username">{post.username}</span>
                        <span className="feed-badge-role">{post.batch}</span>
                      </div>
                      <span className="feed-user-meta">
                        {post.rank.emoji} {post.rank.name_en} · {new Date(post.created_at).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="feed-item-content">{post.content}</p>
                <div className="feed-item-actions">
                  <button className={`feed-action-btn ${post.isLiked ? 'active' : ''}`} onClick={() => handleLikePost(post.id)}>
                    <i className={post.isLiked ? 'ti ti-heart-filled' : 'ti-heart'}></i> {post.likes_count}
                  </button>
                  <button className="feed-action-btn" onClick={() => showToast('Comments coming soon 💬')}>
                    <i className="ti ti-message-circle"></i> Comment
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
