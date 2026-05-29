import React from 'react';
import { playChatSound } from '../utils/helpers';

interface PlayGameProps {
  activeGameRoom: any;
  user: any;
  handleLeaveGameRoom: () => void;
  handleStartGame: () => void;
  handleSubmitGameAnswer: (e: React.FormEvent) => void;
  submittedGameAnswer: string;
  setSubmittedGameAnswer: (val: string) => void;
  handleNextRound: () => void;
  handlePlayAgain: () => void;
  showToast: (msg: string) => void;
  token: string;
}

export const PlayGame: React.FC<PlayGameProps> = ({
  activeGameRoom,
  user,
  handleLeaveGameRoom,
  handleStartGame,
  handleSubmitGameAnswer,
  submittedGameAnswer,
  setSubmittedGameAnswer,
  handleNextRound,
  handlePlayAgain,
  showToast,
  token
}) => {
  if (!activeGameRoom) return null;
  const room = activeGameRoom;
  const isHost = room.host === user?.username;
  
  // Timer calculations
  let timeLeft = 0;
  let elapsed = 0;
  if (room.status === 'playing' && room.roundStartTime) {
    elapsed = Math.max(0, (Date.now() - room.roundStartTime) / 1000);
    timeLeft = Math.max(0, Math.ceil(room.roundDuration - elapsed));
  }
  
  const inviteUrl = `${window.location.origin}${window.location.pathname}?gameCode=${room.code}`;
  
  const handleCopyInviteUrl = () => {
    navigator.clipboard.writeText(inviteUrl);
    showToast('Invite link copied! Share it with your colleagues to join immediately 🔗');
    playChatSound('success');
  };

  if (room.status === 'waiting') {
    return (
      <div className="games-panel animate-fade-in">
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <span className="badge-tag">Waiting for players ⏳</span>
              <h2 style={{ fontSize: '20px', fontWeight: 900, marginTop: '4px' }}>Anatomy Online Challenge Room</h2>
            </div>
            <button className="btn-outline mini" style={{ color: '#ff4d4d', borderColor: 'rgba(255,77,77,0.2)' }} onClick={handleLeaveGameRoom}>
              Leave Room
            </button>
          </div>

          <div style={{ textAlign: 'center', margin: '2rem 0' }}>
            <div
              className="pl-invite-code-clickable"
              onClick={() => {
                navigator.clipboard.writeText(room.code);
                showToast(`Room code copied: ${room.code} 📋`);
                playChatSound('success');
              }}
              title="Click to copy code"
            >
              {room.code}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Click on code to copy and share</p>
          </div>

          <div className="small-invite-row">
            <input type="text" readOnly value={inviteUrl} className="small-invite-input" />
            <button className="btn-primary mini-compact" onClick={handleCopyInviteUrl}>Copy Link</button>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '0.75rem' }}>Connected Players ({room.players.length})</h4>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {room.players.map((p: any) => (
                <div key={p.username} className="glass-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0A0A0A' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>{p.username}</span>
                  {p.username === room.host && <span className="badge-tag" style={{ fontSize: '8px', padding: '1px 4px' }}>Host</span>}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '2.5rem' }}>
            {isHost ? (
              <button className="btn-primary" style={{ width: '100%', padding: '14px' }} onClick={handleStartGame}>
                Start Challenge Now! 🚀
              </button>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <div className="skeleton-loader" style={{ width: '16px', height: '16px', borderRadius: '50%' }}></div>
                <span>Waiting for host to start the game...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (room.status === 'playing') {
    const question = room.currentQuestion;
    const myScore = room.players.find((p: any) => p.username === user?.username)?.score || 0;
    const currentHintIdx = Math.min(3, Math.floor(elapsed / (room.roundDuration / 4)));
    const currentHint = question.hints[currentHintIdx];

    return (
      <div className="games-panel animate-fade-in">
        <div className="glass-card">
          {/* Arena Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <span className="badge-tag">Round {room.currentRound} of {room.rounds}</span>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--orange)', marginTop: '4px' }}>Guess the Anatomical Structure 🤔</h3>
            </div>
            <div style={{ textAlign: 'center', background: 'rgba(255, 106, 0, 0.1)', border: '1px solid var(--orange)', borderRadius: '12px', padding: '6px 14px' }}>
              <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--amber)', fontFamily: 'sans-serif' }}>{room.roundWinner ? ' Break' : timeLeft}</span>
            </div>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>My Score</span>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#fff', fontFamily: 'sans-serif' }}>{myScore}</div>
            </div>
          </div>

          {/* Simple Question Card */}
          <div className="glass-card" style={{ background: '#0A0A0A', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '0.5rem' }}>
              <span className="badge-tag">Type: {question.type === 'muscle' ? 'Muscle 💪' : 'Bone 🦴'}</span>
              <span className="badge-tag" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff' }}>Hint {currentHintIdx + 1} of 4</span>
            </div>
            <p style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.6, color: '#fff' }}>
              {room.roundWinner ? `Answer revealed: ${question.structure}` : currentHint}
            </p>
          </div>

          {/* Proximity Form */}
          {!room.roundWinner && (
            <form onSubmit={handleSubmitGameAnswer} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input
                type="text"
                className="pl-input"
                placeholder="Type structure name in English or Latin..."
                value={submittedGameAnswer}
                onChange={(e) => setSubmittedGameAnswer(e.target.value)}
              />
              <button type="submit" className="btn-primary">Submit</button>
            </form>
          )}

          {/* Intermission Row */}
          {room.roundWinner && (
            <div className="glass-card" style={{ background: 'rgba(255, 106, 0, 0.05)', borderColor: 'var(--orange)', textAlign: 'center', marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--amber)', fontWeight: 800, fontSize: '15px' }}>
                {room.roundWinner === 'timeout' ? ' Round time ended!' : ` ${room.roundWinner} answered correctly!`}
              </h4>
              <p style={{ marginTop: '0.25rem', fontSize: '13px' }}>Correct structure: <strong>{question.structure}</strong></p>
              {isHost && (
                <button className="btn-primary mini" onClick={handleNextRound} style={{ marginTop: '1rem' }}>
                  {room.currentRound < room.rounds ? 'Next Round ➡️' : 'Show Final Results 🏆'}
                </button>
              )}
            </div>
          )}

          {/* Answers Log */}
          <div className="glass-card" style={{ background: '#0A0A0A', maxHeight: '180px', overflowY: 'auto' }}>
            <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Answers Log 💬</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {room.answersLog.map((log: any, idx: number) => (
                <div key={idx} style={{ fontSize: '12px', color: log.type === 'correct' ? '#2ed573' : log.type === 'wrong' ? '#ff4d4d' : 'var(--text-secondary)' }}>
                  {log.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (room.status === 'finished') {
    const sorted = [...room.players].sort((a,b) => b.score - a.score);
    return (
      <div className="games-panel animate-fade-in">
        <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <span style={{ fontSize: '64px' }}>🏆</span>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--orange)', marginTop: '1rem' }}>Group Challenge Ended!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0.5rem 0 2.5rem' }}>{room.finalWinner} was crowned champion of the room.</p>

          <div className="leaderboard-list-container" style={{ maxWidth: '400px', margin: '0 auto 2rem' }}>
            {sorted.map((p: any, idx: number) => (
              <div key={p.username} className="leaderboard-row-item" style={{ background: '#0A0A0A' }}>
                <span className="row-rank-num">{idx + 1}</span>
                <span className="row-info" style={{ textAlign: 'right' }}>{p.username}</span>
                <span className="row-xp-badge">{p.score} points</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {isHost && (
              <button className="btn-primary" onClick={handlePlayAgain} style={{ backgroundColor: '#2ed573', color: '#000' }}>
                Play Again (Same Room) 🔄
              </button>
            )}
            <button className="btn-outline" onClick={handleLeaveGameRoom} style={{ color: '#ff4d4d', borderColor: 'rgba(255,77,77,0.2)' }}>
              Leave Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
