import React from 'react';

interface GamesProps {
  user: any;
  gameTab: 'single' | 'multiplayer';
  setGameTab: (tab: 'single' | 'multiplayer') => void;
  activeGame: 'memory' | 'spin' | null;
  setActiveGame: (game: 'memory' | 'spin' | null) => void;
  gameFinished: boolean;
  setGameFinished: (val: boolean) => void;
  memoryMoves: number;
  memoryMatches: number;
  gamePlaySuccess: string;
  gamePlayError: string;
  initMemoryGame: () => void;
  memoryCards: any[];
  handleCardClick: (index: number) => void;
  wheelRotation: number;
  handleSpinWheelClick: () => void;
  isSpinning: boolean;
  gameError: string;
  createGameRounds: number;
  setCreateGameRounds: (val: number) => void;
  createGameDuration: number;
  setCreateGameDuration: (val: number) => void;
  handleCreateGameRoom: () => void;
  gameRoomCodeInput: string;
  setGameRoomCodeInput: (val: string) => void;
  handleJoinGameRoom: (code: string) => void;
  isGameLoading: boolean;
  hasSpunToday: boolean;
}

export const Games: React.FC<GamesProps> = ({
  user,
  gameTab,
  setGameTab,
  activeGame,
  setActiveGame,
  gameFinished,
  setGameFinished,
  memoryMoves,
  memoryMatches,
  gamePlaySuccess,
  gamePlayError,
  initMemoryGame,
  memoryCards,
  handleCardClick,
  wheelRotation,
  handleSpinWheelClick,
  isSpinning,
  gameError,
  createGameRounds,
  setCreateGameRounds,
  createGameDuration,
  setCreateGameDuration,
  handleCreateGameRoom,
  gameRoomCodeInput,
  setGameRoomCodeInput,
  handleJoinGameRoom,
  isGameLoading,
  hasSpunToday
}) => {
  const [showMultiplayerSetup, setShowMultiplayerSetup] = React.useState(false);

  React.useEffect(() => {
    setShowMultiplayerSetup(false);
  }, [gameTab]);

  return (
    <div className="games-panel animate-fade-in">
      <div className="pl-section-h2">
        <span className="title-text"><i className="ti ti-device-gamepad-2"></i> Interactive Games</span>
      </div>
      
      <section className="games-filter-tabs">
        <button className={`games-filter-btn ${gameTab === 'single' ? 'active' : ''}`} onClick={() => setGameTab('single')}>
          Single-player Games
        </button>
        <button className={`games-filter-btn ${gameTab === 'multiplayer' ? 'active' : ''}`} onClick={() => setGameTab('multiplayer')}>
          Multiplayer Games
        </button>
      </section>

      {gameTab === 'single' ? (
        <div>
          {activeGame ? (
            /* Play Single Player Area */
            <div className="glass-card">
              <button className="btn-outline mini" onClick={() => { setActiveGame(null); setGameFinished(false); }} style={{ marginBottom: '1.5rem' }}>
                <i className="ti ti-arrow-right"></i> Back to Games
              </button>

              {activeGame === 'memory' && (
                <div className="memory-game-container">
                  <h3 style={{ fontSize: '18px', fontWeight: 800 }}>🧠 Anatomy Match Game</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Match identical terms in the fewest moves possible. Moves: {memoryMoves} | Matches: {memoryMatches}/8</p>
                  
                  {gameFinished ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <span style={{ fontSize: '48px' }}>🏆</span>
                      <h2 style={{ color: 'var(--orange)', marginTop: '0.5rem' }}>Congratulations! Challenge won!</h2>
                      {gamePlaySuccess ? (
                        <div className="pl-form-success" style={{ marginTop: '1rem' }}>{gamePlaySuccess}</div>
                      ) : (
                        <div className="pl-form-error" style={{ marginTop: '1rem' }}>{gamePlayError}</div>
                      )}
                      <button className="btn-primary" onClick={initMemoryGame} style={{ marginTop: '1rem' }}>
                        Play Again
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="memory-cards-grid">
                        {memoryCards.map((card, idx) => (
                          <div
                            key={card.id}
                            className={`memory-game-card ${card.isFlipped ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''}`}
                            onClick={() => handleCardClick(idx)}
                          >
                            <div className="card-inner">
                              <div className="card-back">🧠</div>
                              <div className="card-front">{card.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button className="btn-outline" onClick={initMemoryGame} style={{ width: '100%' }}>
                        Reset Game
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeGame === 'spin' && (
                <div className="spin-wheel-panel">
                  <h3 style={{ fontSize: '18px', fontWeight: 800 }}>🎡 Daily Wheel of Fortune</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Press the spin button for a chance to win random XP points daily!</p>
                  
                  <div className="wheel-outer-wrapper">
                    <div className="wheel-pointer"></div>
                    <svg className="wheel-spinner-svg" viewBox="0 0 100 100" style={{ transform: `rotate(${wheelRotation}deg)` }}>
                      {/* Wheel segments drawing */}
                      {Array.from({ length: 12 }).map((_, i) => {
                        const angle = 255 + i * 30; // Offset by -15 deg to center segment 9 straight UP at 270 deg
                        const x1 = 50 + 50 * Math.cos((angle * Math.PI) / 180);
                        const y1 = 50 + 50 * Math.sin((angle * Math.PI) / 180);
                        const x2 = 50 + 50 * Math.cos(((angle + 30) * Math.PI) / 180);
                        const y2 = 50 + 50 * Math.sin(((angle + 30) * Math.PI) / 180);
                        
                        // Harmonious premium gradient representation of segments
                        // Alternate between warm orange-yellow and dark cards
                        let fillColor = 'rgba(255, 106, 0, 0.15)';
                        if (i === 0) fillColor = 'rgba(255, 215, 0, 0.4)'; // Gold for Mystery
                        else if (i === 7) fillColor = 'rgba(255, 106, 0, 0.35)'; // Intended Orange-Red for +50 XP
                        else if (i % 3 === 0) fillColor = 'rgba(255, 176, 0, 0.2)';
                        else if (i % 3 === 1) fillColor = 'rgba(255, 255, 255, 0.05)';
                        else fillColor = 'rgba(255, 106, 0, 0.1)';
                        
                        return (
                          <path
                            key={i}
                            d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`}
                            fill={fillColor}
                            stroke="rgba(255, 106, 0, 0.3)"
                            strokeWidth="0.5"
                          />
                        );
                      })}
                      {/* Text values markers inside segments */}
                      {['🎁', '5⚡', '30⚡', '100⚡', '🍀', '15⚡', '5⚡', '50⚡', '🍀', '20⚡', '10⚡', '5⚡'].map((lbl, idx) => {
                        const rot = idx * 30; // Centered at multiples of 30 deg due to -15 deg offset in drawing
                        return (
                          <text
                            key={idx}
                            x="50"
                            y="14" // slightly higher radius since there are more segments and they are narrower
                            transform={`rotate(${rot} 50 50)`}
                            fill={lbl === '🎁' ? '#FFD700' : lbl === '🍀' ? '#8e8e93' : '#fff'}
                            fontSize="5.5"
                            fontWeight="950"
                            textAnchor="middle"
                          >
                            {lbl}
                          </text>
                        );
                      })}
                    </svg>
                  </div>

                  <button 
                    className="btn-primary" 
                    onClick={handleSpinWheelClick} 
                    disabled={isSpinning || hasSpunToday}
                    style={{
                      opacity: hasSpunToday ? 0.6 : 1,
                      cursor: hasSpunToday ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSpinning ? 'Spinning...' : hasSpunToday ? 'Already Spun Today 🎡' : 'Spin Now! 🚀'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Games lists menu */
            <div className="game-card-grid">
              <div className="game-widget-card glass-card">
                <span className="game-tag-badge">Memory Game</span>
                <h3 className="game-card-title">Anatomy Match</h3>
                <p className="game-card-desc">Strengthen your anatomical memory and match muscles with medical terms in fewer moves.</p>
                <div className="game-card-footer">
                  <span className="game-card-reward">+50 XP ⚡</span>
                  <button className="btn-primary mini" onClick={() => { setActiveGame('memory'); initMemoryGame(); }}>Play Now</button>
                </div>
              </div>

              <div className="game-widget-card glass-card" style={{ opacity: hasSpunToday ? 0.7 : 1 }}>
                <span className="game-tag-badge">Wheel of Fortune</span>
                <h3 className="game-card-title">Wheel of Fortune for Members</h3>
                <p className="game-card-desc">Spin the golden wheel for a chance to win random free points up to 100 XP.</p>
                <div className="game-card-footer">
                  <span className="game-card-reward">{hasSpunToday ? 'Spun Today ✅' : 'Random Prizes 🎡'}</span>
                  <button className="btn-primary mini" onClick={() => { setActiveGame('spin'); }}>
                    {hasSpunToday ? 'Open Wheel' : 'Try Your Luck'}
                  </button>
                </div>
              </div>

              <div className="game-widget-card glass-card" style={{ opacity: 0.5 }}>
                <span className="game-tag-badge" style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>Interactive Quiz</span>
                <h3 className="game-card-title">Case Diagnosis Challenge</h3>
                <p className="game-card-desc">Test your clinical diagnosis in orthopedics and neurology with questions of graded difficulty.</p>
                <div className="game-card-footer">
                  <span className="game-card-reward">Coming Soon ⏳</span>
                  <button className="btn-outline mini" disabled>Locked</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Multiplayer Lobby Card Setup */
        <div>
          {!showMultiplayerSetup ? (
            <div className="game-card-grid">
              <div className="game-widget-card glass-card">
                <span className="game-tag-badge">Multiplayer</span>
                <h3 className="game-card-title">Anatomy Challenge Online</h3>
                <p className="game-card-desc">Create a challenge room and compete with your colleagues to reveal muscle groups and anatomical structures in real-time!</p>
                <div className="game-card-footer">
                  <span className="game-card-reward">Multiplayer 👥</span>
                  <button className="btn-primary mini" onClick={() => setShowMultiplayerSetup(true)}>Play Now</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card">
              <button className="btn-outline mini" onClick={() => setShowMultiplayerSetup(false)} style={{ marginBottom: '1.5rem' }}>
                <i className="ti ti-arrow-right"></i> Back to Games
              </button>

              <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '0.5rem' }}><i className="ti ti-users"></i> Anatomy Challenge Online (Multiplayer)</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Create a challenge room and compete with your colleagues to reveal muscle groups and anatomical structures in real-time!
              </p>

              {gameError && <div className="pl-form-error">{gameError}</div>}

              <div className="stats-badge-grid" style={{ gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Host configuration toggles */}
                <div className="glass-card" style={{ background: '#0A0A0A', padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--orange)', marginBottom: '1rem' }}>Host Setup (Create Room)</h4>
                  
                  <div className="slider-group">
                    <div className="slider-group-header">
                      <span>Number of Rounds</span>
                      <span className="val-display">{createGameRounds}</span>
                    </div>
                    <input
                      type="range"
                      className="styled-range-input"
                      min="3"
                      max="10"
                      value={createGameRounds}
                      onChange={(e) => setCreateGameRounds(parseInt(e.target.value))}
                    />
                  </div>

                  <div className="slider-group">
                    <div className="slider-group-header">
                      <span>Round Duration</span>
                      <span className="val-display">{createGameDuration} seconds</span>
                    </div>
                    <input
                      type="range"
                      className="styled-range-input"
                      min="15"
                      max="120"
                      value={createGameDuration}
                      onChange={(e) => setCreateGameDuration(parseInt(e.target.value))}
                    />
                  </div>

                  <button className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={handleCreateGameRoom} disabled={isGameLoading}>
                    {isGameLoading ? 'Creating room...' : 'Create Challenge Room 🎮'}
                  </button>
                </div>

                {/* Join code forms */}
                <div className="glass-card" style={{ background: '#0A0A0A', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--orange)', marginBottom: '1rem' }}>Join Game (Enter Room)</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Enter the 4-digit code from your colleague's invite to join immediately.</p>
                  <input
                    type="text"
                    className="pl-input"
                    placeholder="e.g. ABCD"
                    value={gameRoomCodeInput}
                    onChange={(e) => setGameRoomCodeInput(e.target.value)}
                    maxLength={4}
                    style={{ textAlign: 'center', fontSize: '18px', fontWeight: 900, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '1.25rem' }}
                  />
                  <button className="btn-outline" style={{ width: '100%' }} onClick={() => handleJoinGameRoom(gameRoomCodeInput)} disabled={isGameLoading}>
                    Join Room Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
