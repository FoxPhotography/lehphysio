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
  isGameLoading
}) => {
  const [showMultiplayerSetup, setShowMultiplayerSetup] = React.useState(false);

  React.useEffect(() => {
    setShowMultiplayerSetup(false);
  }, [gameTab]);

  return (
    <div className="games-panel animate-fade-in">
      <div className="pl-section-h2">
        <span className="title-text"><i className="ti ti-device-gamepad-2"></i> الألعاب التفاعلية</span>
      </div>
      
      <section className="games-filter-tabs">
        <button className={`games-filter-btn ${gameTab === 'single' ? 'active' : ''}`} onClick={() => setGameTab('single')}>
          ألعاب فردية
        </button>
        <button className={`games-filter-btn ${gameTab === 'multiplayer' ? 'active' : ''}`} onClick={() => setGameTab('multiplayer')}>
          ألعاب جماعية
        </button>
      </section>

      {gameTab === 'single' ? (
        <div>
          {activeGame ? (
            /* Play Single Player Area */
            <div className="glass-card">
              <button className="btn-outline mini" onClick={() => { setActiveGame(null); setGameFinished(false); }} style={{ marginBottom: '1.5rem' }}>
                <i className="ti ti-arrow-right"></i> العودة للألعاب
              </button>

              {activeGame === 'memory' && (
                <div className="memory-game-container">
                  <h3 style={{ fontSize: '18px', fontWeight: 800 }}>🧠 لعبة مطابقة عضلات التشريح</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>اطبق المصطلحات المتطابقة بأقل حركات ممكنة. الحركات: {memoryMoves} | المطابقات: {memoryMatches}/8</p>
                  
                  {gameFinished ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <span style={{ fontSize: '48px' }}>🏆</span>
                      <h2 style={{ color: 'var(--orange)', marginTop: '0.5rem' }}>مبروك! تم الفوز بالتحدي!</h2>
                      {gamePlaySuccess ? (
                        <div className="pl-form-success" style={{ marginTop: '1rem' }}>{gamePlaySuccess}</div>
                      ) : (
                        <div className="pl-form-error" style={{ marginTop: '1rem' }}>{gamePlayError}</div>
                      )}
                      <button className="btn-primary" onClick={initMemoryGame} style={{ marginTop: '1rem' }}>
                        العب مجدداً
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
                        إعادة تهيئة اللعبة
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeGame === 'spin' && (
                <div className="spin-wheel-panel">
                  <h3 style={{ fontSize: '18px', fontWeight: 800 }}>🎡 عجلة الحظ اليومية للأبطال</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>اضغط زر الدوران للحصول على فرصة كسب نقاط XP عشوائية يومياً!</p>
                  
                  <div className="wheel-outer-wrapper">
                    <div className="wheel-pointer"></div>
                    <svg className="wheel-spinner-svg" viewBox="0 0 100 100" style={{ transform: `rotate(${wheelRotation}deg)` }}>
                      {/* Wheel segments drawing */}
                      {Array.from({ length: 8 }).map((_, i) => {
                        const angle = i * 45;
                        const x1 = 50 + 50 * Math.cos((angle * Math.PI) / 180);
                        const y1 = 50 + 50 * Math.sin((angle * Math.PI) / 180);
                        const x2 = 50 + 50 * Math.cos(((angle + 45) * Math.PI) / 180);
                        const y2 = 50 + 50 * Math.sin(((angle + 45) * Math.PI) / 180);
                        return (
                          <path
                            key={i}
                            d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`}
                            fill={i % 2 === 0 ? 'rgba(255, 106, 0, 0.2)' : 'rgba(255, 176, 0, 0.15)'}
                            stroke="rgba(255, 106, 0, 0.4)"
                            strokeWidth="0.5"
                          />
                        );
                      })}
                      {/* Text values markers inside segments */}
                      {['🎁', '5⚡', '30⚡', '100⚡', '🍀', '10⚡', '50⚡', '20⚡'].map((lbl, idx) => {
                        const rot = idx * 45 + 22.5;
                        return (
                          <text
                            key={idx}
                            x="50"
                            y="16"
                            transform={`rotate(${rot} 50 50)`}
                            fill="#fff"
                            fontSize="6"
                            fontWeight="900"
                            textAnchor="middle"
                          >
                            {lbl}
                          </text>
                        );
                      })}
                    </svg>
                  </div>

                  <button className="btn-primary" onClick={handleSpinWheelClick} disabled={isSpinning}>
                    {isSpinning ? 'جاري دوران العجلة...' : 'ابدأ الدوران الآن! 🚀'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Games lists menu */
            <div className="game-card-grid">
              <div className="game-widget-card glass-card">
                <span className="game-tag-badge">لعبة ذاكرة</span>
                <h3 className="game-card-title">مطابقة عضلات التشريح</h3>
                <p className="game-card-desc">قوّي ذاكرتك التشريحية واجمع بطاقات العضلات والمصطلحات الطبية المتشابهة بأقل حركات.</p>
                <div className="game-card-footer">
                  <span className="game-card-reward">+50 XP ⚡</span>
                  <button className="btn-primary mini" onClick={() => { setActiveGame('memory'); initMemoryGame(); }}>العب الآن</button>
                </div>
              </div>

              <div className="game-widget-card glass-card">
                <span className="game-tag-badge">عجلة الحظ</span>
                <h3 className="game-card-title">عجلة الحظ للأعضاء</h3>
                <p className="game-card-desc">دور العجلة الذهبية للحصول على فرصة للفوز بنقاط مجانية عشوائية تصل لـ 100 XP.</p>
                <div className="game-card-footer">
                  <span className="game-card-reward">جوائز عشوائية 🎡</span>
                  <button className="btn-primary mini" onClick={() => { setActiveGame('spin'); }}>جرب حظك</button>
                </div>
              </div>

              <div className="game-widget-card glass-card" style={{ opacity: 0.5 }}>
                <span className="game-tag-badge" style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>كويز تفاعلي</span>
                <h3 className="game-card-title">تحدي تشخيص الحالات</h3>
                <p className="game-card-desc">اختبر تشخيصك الإكلينيكي في حالات العظام والأعصاب من الأسئلة المتدرجة الصعوبة.</p>
                <div className="game-card-footer">
                  <span className="game-card-reward">قريباً ⏳</span>
                  <button className="btn-outline mini" disabled>مغلق</button>
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
                <span className="game-tag-badge">لعبة جماعية</span>
                <h3 className="game-card-title">تحدي التشريح أونلاين</h3>
                <p className="game-card-desc">أنشئ غرفة تحدي ونافس زملائك في الكشف عن المجموعات العضلية والهياكل التشريحية مباشرة!</p>
                <div className="game-card-footer">
                  <span className="game-card-reward">لعبة جماعية 👥</span>
                  <button className="btn-primary mini" onClick={() => setShowMultiplayerSetup(true)}>العب الآن</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card">
              <button className="btn-outline mini" onClick={() => setShowMultiplayerSetup(false)} style={{ marginBottom: '1.5rem' }}>
                <i className="ti ti-arrow-right"></i> العودة للألعاب
              </button>

              <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '0.5rem' }}><i className="ti ti-users"></i> تحدي التشريح أونلاين (Multiplayer)</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                أنشئ غرفة تحدي ونافس زملائك في الكشف عن المجموعات العضلية والهياكل التشريحية مباشرة!
              </p>

              {gameError && <div className="pl-form-error">{gameError}</div>}

              <div className="stats-badge-grid" style={{ gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Host configuration toggles */}
                <div className="glass-card" style={{ background: '#0A0A0A', padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--orange)', marginBottom: '1rem' }}>Host Setup (إنشاء الغرفة)</h4>
                  
                  <div className="slider-group">
                    <div className="slider-group-header">
                      <span>عدد الجولات</span>
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
                      <span>توقيت الجولة</span>
                      <span className="val-display">{createGameDuration} ثانية</span>
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
                    {isGameLoading ? 'جاري إنشاء الغرفة...' : 'أنشئ غرفة التحدي 🎮'}
                  </button>
                </div>

                {/* Join code forms */}
                <div className="glass-card" style={{ background: '#0A0A0A', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--orange)', marginBottom: '1rem' }}>Join Game (انضمام للغرفة)</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>أدخل الكود المكون من 4 أرقام المكتوب في دعوة زميلك للانضمام فوراً.</p>
                  <input
                    type="text"
                    className="pl-input"
                    placeholder="مثال: ABCD"
                    value={gameRoomCodeInput}
                    onChange={(e) => setGameRoomCodeInput(e.target.value)}
                    maxLength={4}
                    style={{ textAlign: 'center', fontSize: '18px', fontWeight: 900, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '1.25rem' }}
                  />
                  <button className="btn-outline" style={{ width: '100%' }} onClick={() => handleJoinGameRoom(gameRoomCodeInput)} disabled={isGameLoading}>
                    انضم للغرفة الآن
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
