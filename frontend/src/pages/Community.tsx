import React from 'react';
import { getNameColor } from '../utils/helpers';

interface CommunityProps {
  user: any;
  onlineCount: number;
  chatMessages: any[];
  isMultiSelectMode: boolean;
  setIsMultiSelectMode: (val: boolean) => void;
  selectedMessageIds: number[];
  setSelectedMessageIds: React.Dispatch<React.SetStateAction<number[]>>;
  swipeTranslateX: { [key: number]: number };
  swipeMessageIdRef: React.MutableRefObject<number | null>;
  replyingTo: any;
  setReplyingTo: (val: any) => void;
  editingMessage: any;
  setEditingMessage: (val: any) => void;
  chatInput: string;
  setChatInput: (val: string) => void;
  handleSendChatMessage: (e: React.FormEvent) => void;
  setCurrentPage: (page: string) => void;
  activeContextMenu: any;
  setActiveContextMenu: (val: any) => void;
  handleChatContextMenu: (e: React.MouseEvent, msg: any) => void;
  handleChatTouchStart: (e: React.TouchEvent, msg: any) => void;
  handleChatTouchMove: (e: React.TouchEvent, msg: any) => void;
  handleChatTouchEnd: (e: React.TouchEvent, msg: any) => void;
  handleToggleReaction: (messageId: number, emoji: string) => void;
  handleDeleteMessage: (messageId: number) => void;
  handleBulkDeleteMessages: () => void;
  suggestions: any[];
  handleCreateSuggestion: (title: string, content: string) => void;
  handleUpvoteSuggestion: (id: number) => void;
  handleOpenModerationModal: (username: string, userId: number) => void;
}

export const Community: React.FC<CommunityProps> = ({
  user,
  onlineCount,
  chatMessages,
  isMultiSelectMode,
  setIsMultiSelectMode,
  selectedMessageIds,
  setSelectedMessageIds,
  swipeTranslateX,
  swipeMessageIdRef,
  replyingTo,
  setReplyingTo,
  editingMessage,
  setEditingMessage,
  chatInput,
  setChatInput,
  handleSendChatMessage,
  setCurrentPage,
  activeContextMenu,
  setActiveContextMenu,
  handleChatContextMenu,
  handleChatTouchStart,
  handleChatTouchMove,
  handleChatTouchEnd,
  handleToggleReaction,
  handleDeleteMessage,
  handleBulkDeleteMessages,
  suggestions,
  handleCreateSuggestion,
  handleUpvoteSuggestion,
  handleOpenModerationModal
}) => {
  const [showScrollDownBtn, setShowScrollDownBtn] = React.useState(false);
  const [activeSubTab, setActiveSubTab] = React.useState<'chat' | 'suggestions'>('chat');
  const [suggTitle, setSuggTitle] = React.useState('');
  const [suggContent, setSuggContent] = React.useState('');

  const submitSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggTitle.trim() || !suggContent.trim()) return;
    handleCreateSuggestion(suggTitle, suggContent);
    setSuggTitle('');
    setSuggContent('');
  };

  const handleScrollToBottom = () => {
    const el = document.getElementById('pl-chat-feed');
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  };

  return (
    <div className="community-panel animate-fade-in" style={{ padding: '0.5rem' }}>
      <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '650px', position: 'relative' }}>
        
        {/* Sub tab switcher */}
        <div className="games-filter-tabs" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button 
            type="button" 
            className={`games-filter-btn ${activeSubTab === 'chat' ? 'active' : ''}`} 
            onClick={() => setActiveSubTab('chat')}
            style={{ flex: 1, padding: '8px 16px', fontSize: '12px' }}
          >
            💬 General Chat
          </button>
          <button 
            type="button" 
            className={`games-filter-btn ${activeSubTab === 'suggestions' ? 'active' : ''}`} 
            onClick={() => setActiveSubTab('suggestions')}
            style={{ flex: 1, padding: '8px 16px', fontSize: '12px' }}
          >
            💡 Suggestions Board
          </button>
        </div>

        {activeSubTab === 'chat' ? (
          <>
            {/* Multi-select bar or Standard Header */}
            {isMultiSelectMode ? (
              <div className="pl-chat-bulk-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 106, 0, 0.15)', border: '1px solid var(--orange)', borderRadius: '12px', padding: '10px 16px', marginBottom: '1rem', flexShrink: 0 }}>
                <span style={{ fontSize: '13px', fontWeight: 800 }}>Selected {selectedMessageIds.length} messages</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-primary mini" style={{ background: '#e74c3c' }} onClick={handleBulkDeleteMessages} disabled={selectedMessageIds.length === 0}>Delete Selected</button>
                  <button className="btn-outline mini" onClick={() => { setIsMultiSelectMode(false); setSelectedMessageIds([]); }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.4rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="ti ti-messages" style={{ color: 'var(--orange)', fontSize: '20px' }}></i>
                  <h3 style={{ fontSize: '14px', fontWeight: 900 }}>Why Physio? Chat</h3>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--orange)', fontWeight: 800 }}>
                  {onlineCount} Online Now 🟢
                </span>
              </div>
            )}

            {/* Chat Messages Feed */}
            <div 
              id="pl-chat-feed" 
              onScroll={(e) => {
                const el = e.currentTarget;
                const isUp = el.scrollHeight - el.scrollTop - el.clientHeight > 150;
                setShowScrollDownBtn(isUp);
              }}
              style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0.25rem', direction: 'rtl' }}
            >
              {chatMessages.map((msg: any) => {
                const isMyMsg = user && msg.username === user.username;
                const isSelected = selectedMessageIds.includes(msg.id);
                
                // Swipe state values
                const tx = swipeTranslateX[msg.id] || 0;
                const isSwiping = swipeMessageIdRef.current === msg.id;

                return (
                  <div 
                    key={msg.id} 
                    className="pl-chat-message-swipe-container"
                    style={{
                      display: 'flex',
                      justifyContent: isMyMsg ? 'flex-start' : 'flex-end',
                      width: '100%'
                    }}
                  >
                    <div
                      className={`pl-chat-message-row ${isMyMsg ? 'outgoing' : 'incoming'} ${isSelected ? 'selected' : ''}`}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        maxWidth: '85%',
                        position: 'relative',
                        transform: `translateX(${tx}px)`,
                        transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
                        userSelect: 'none',
                        cursor: 'pointer'
                      }}
                      onContextMenu={(e) => handleChatContextMenu(e, msg)}
                      onTouchStart={(e) => handleChatTouchStart(e, msg)}
                      onTouchMove={(e) => handleChatTouchMove(e, msg)}
                      onTouchEnd={(e) => handleChatTouchEnd(e, msg)}
                    >
                      {/* Swipe indicator icon displayed next to bubble (slides in with row) */}
                      {tx < 0 && (
                        <div 
                          className="pl-chat-swipe-indicator"
                          style={{
                            position: 'absolute',
                            right: '-45px',
                            left: 'auto',
                            opacity: Math.min(1, Math.abs(tx) / 45),
                            transition: 'opacity 0.1s'
                          }}
                        >
                          <i className="ti ti-arrow-back-up" style={{ color: 'var(--text-secondary)', fontSize: '18px' }}></i>
                        </div>
                      )}

                      {tx > 0 && (
                        <div 
                          className="pl-chat-swipe-indicator"
                          style={{
                            position: 'absolute',
                            left: '-45px',
                            right: 'auto',
                            opacity: Math.min(1, Math.abs(tx) / 45),
                            transition: 'opacity 0.1s'
                          }}
                        >
                          <i className="ti ti-arrow-back-up" style={{ color: 'var(--text-secondary)', fontSize: '18px' }}></i>
                        </div>
                      )}

                      {/* Select Checkbox (only in multi-select mode) */}
                      {isMultiSelectMode && user && (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMessageIds(prev => 
                              prev.includes(msg.id) ? prev.filter(id => id !== msg.id) : [...prev, msg.id]
                            );
                          }}
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            border: '2px solid var(--orange)',
                            background: isSelected ? 'var(--orange)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            alignSelf: 'center',
                            marginLeft: '0.5rem',
                            flexShrink: 0
                          }}
                        >
                          {isSelected && <i className="ti ti-check" style={{ fontSize: '12px', color: '#000', fontWeight: 900 }}></i>}
                        </div>
                      )}

                      {/* Message Bubble Container */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMyMsg ? 'flex-start' : 'flex-end', width: 'auto' }}>
                        
                        {/* Sender username and meta */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', alignSelf: isMyMsg ? 'flex-start' : 'flex-end' }}>
                          <span style={{ fontSize: '11px', color: isMyMsg ? 'var(--orange)' : getNameColor(msg.username), fontWeight: 800 }}>
                            {msg.username}
                          </span>
                          <span className="badge-tag" style={{ fontSize: '9px', padding: '2px 6px', background: 'rgba(255,255,255,0.06)' }}>
                            {msg.batch}
                          </span>
                          <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
                            {msg.rank.emoji} {msg.rank.name_en}
                          </span>
                          {msg.role === 'admin' && (
                            <span className="badge-tag mini" style={{ borderColor: 'var(--orange)', color: 'var(--orange)', background: 'rgba(255, 106, 0, 0.15)', padding: '1px 4px', fontSize: '8px', marginLeft: '4px', verticalAlign: 'middle' }}>Admin</span>
                          )}
                        </div>

                        {/* Actual Bubble */}
                        <div 
                          className="pl-chat-bubble"
                          style={{
                            background: isMyMsg ? 'linear-gradient(135deg, #CC5200 0%, #E69500 100%)' : 'rgba(255,255,255,0.06)',
                            color: isMyMsg ? '#000000' : '#fff',
                            padding: '10px 14px',
                            borderRadius: '16px',
                            borderTopLeftRadius: isMyMsg ? '16px' : '4px',
                            borderTopRightRadius: isMyMsg ? '4px' : '16px',
                            fontSize: '13.5px',
                            fontWeight: 600,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            position: 'relative',
                            border: isSelected ? '1.5px solid var(--orange)' : '1px solid transparent',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {/* Quoted Reply box inside bubble */}
                          {msg.reply_to?.username && (
                            <div style={{
                              background: isMyMsg ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.04)',
                              borderLeft: '3px solid var(--orange)',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              marginBottom: '8px',
                              fontSize: '12px',
                              color: isMyMsg ? 'rgba(0,0,0,0.7)' : 'var(--text-secondary)',
                              direction: 'ltr',
                              textAlign: 'left'
                            }}>
                              <div style={{ fontWeight: 800, color: isMyMsg ? '#000' : 'var(--orange)' }}>
                                @{msg.reply_to.username}
                              </div>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {msg.reply_to.message}
                              </div>
                            </div>
                          )}

                          {/* Message content wrapper (text & time side-by-side) */}
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', flexWrap: 'wrap', justifyContent: 'space-between', direction: 'ltr' }}>
                              {/* Message text */}
                              <p style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.4, textAlign: 'left' }}>
                                {msg.message}
                              </p>

                              {/* Edited badge & timestamp inline next to the message */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', opacity: 0.7, whiteSpace: 'nowrap', alignSelf: 'flex-end', userSelect: 'none', marginLeft: 'auto' }}>
                               {!!msg.is_edited && <span>(edited)</span>}
                               <span>{new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                               {isMyMsg && (
                                 msg.isPending ? (
                                   <i className="ti ti-clock" style={{ fontSize: '11px', color: 'rgba(0, 0, 0, 0.6)' }}></i>
                                 ) : (
                                   <i className="ti ti-check" style={{ fontSize: '11px', color: '#000' }}></i>
                                 )
                               )}
                             </div>
                          </div>

                          {/* Reactions badges display */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px', borderTop: '0.5px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
                              {msg.reactions.map((react: any, rIdx: number) => (
                                <button
                                  key={rIdx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleReaction(msg.id, react.emoji);
                                  }}
                                  style={{
                                    background: react.userReacted ? 'rgba(255, 106, 0, 0.2)' : 'rgba(255,255,255,0.04)',
                                    border: react.userReacted ? '1px solid var(--orange)' : '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    padding: '2px 6px',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  <span>{react.emoji}</span>
                                  <span style={{ fontWeight: 800 }}>{react.count}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Form Area */}
            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--card-border)', paddingTop: '0.75rem', flexShrink: 0, direction: 'ltr', textAlign: 'left' }}>
              
              {/* Replying Indicator Bar */}
              {replyingTo && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255, 106, 0, 0.1)',
                  borderLeft: '4px solid var(--orange)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  marginBottom: '8px',
                  fontSize: '12px'
                }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 800, color: 'var(--orange)' }}>Replying to @{replyingTo.username}: </span>
                    <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: '200px', verticalAlign: 'bottom' }}>
                      {replyingTo.message}
                    </span>
                  </div>
                  <button 
                    onClick={() => setReplyingTo(null)}
                    style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}
                  >
                    <i className="ti ti-x"></i>
                  </button>
                </div>
              )}

              {/* Editing Indicator Bar */}
              {editingMessage && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255, 176, 0, 0.1)',
                  borderLeft: '4px solid var(--amber)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  marginBottom: '8px',
                  fontSize: '12px'
                }}>
                  <div>
                    <span style={{ fontWeight: 800, color: 'var(--amber)' }}>Editing message...</span>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingMessage(null);
                      setChatInput('');
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}
                  >
                    <i className="ti ti-x"></i>
                  </button>
                </div>
              )}

              {/* Send Input Form */}
              {user ? (
                <form onSubmit={handleSendChatMessage} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    id="community-chat-input"
                    type="text"
                    name="chatMessage"
                    autoComplete="off"
                    autoCorrect="on"
                    spellCheck="true"
                    data-lpignore="true" /* LastPass ignore */
                    data-1p-ignore="true" /* 1Password ignore */
                    className="pl-input"
                    placeholder={editingMessage ? "Edit your message here..." : "Message"}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <button type="submit" className="pl-chat-send-btn" onMouseDown={(e) => e.preventDefault()}>
                    <i className={`ti ${editingMessage ? 'ti-check' : 'ti-send'}`} style={{ transform: editingMessage ? 'none' : 'scaleX(-1)' }}></i>
                  </button>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Please <button onClick={() => setCurrentPage('login')} style={{ background: 'transparent', border: 'none', color: 'var(--orange)', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}>Login</button> to participate in the live chat.
                </div>
              )}
            </div>

            {/* Scroll Down Floating Button */}
            {showScrollDownBtn && (
              <button
                onClick={handleScrollToBottom}
                className="pl-chat-scroll-down-btn animate-fade-in"
                style={{
                  position: 'absolute',
                  left: '20px',
                  bottom: '80px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(10, 10, 10, 0.8)',
                  border: '1px solid var(--orange)',
                  boxShadow: '0 0 10px rgba(255, 106, 0, 0.3)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                  transition: 'all 0.2s ease',
                }}
                title="Scroll to new messages"
              >
                <i className="ti ti-chevron-down" style={{ fontSize: '18px' }}></i>
              </button>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {user ? (
              <form onSubmit={submitSuggestion} className="community-composer-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '12px', flexShrink: 0 }}>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--orange)' }}>💡 Submit a Suggestion or Feedback</h4>
                <input 
                  type="text" 
                  placeholder="Brief Title (e.g. Add dark mode toggle)" 
                  className="pl-input"
                  value={suggTitle}
                  onChange={(e) => setSuggTitle(e.target.value)}
                  required
                  style={{ fontSize: '12px' }}
                />
                <textarea 
                  placeholder="Explain your idea or feedback in detail..." 
                  className="pl-input"
                  value={suggContent}
                  onChange={(e) => setSuggContent(e.target.value)}
                  required
                  rows={2}
                  style={{ fontSize: '12px', resize: 'none' }}
                />
                <button type="submit" className="btn-primary mini" style={{ alignSelf: 'flex-start' }}>
                  Submit Idea +50 XP ⚡
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)', fontSize: '13px', border: '1px dashed var(--card-border)', borderRadius: '12px', marginBottom: '1rem', flexShrink: 0 }}>
                Please <button onClick={() => setCurrentPage('login')} style={{ background: 'transparent', border: 'none', color: 'var(--orange)', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}>Login</button> to submit suggestions.
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '4px' }}>
              {suggestions.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0', fontSize: '13px' }}>
                  No suggestions submitted yet. Be the first to suggest!
                </div>
              ) : (
                suggestions.map((s: any) => {
                  let statusColor = 'var(--text-secondary)';
                  let statusBg = 'rgba(255,255,255,0.06)';
                  if (s.status === 'approved') {
                    statusColor = '#2ecc71';
                    statusBg = 'rgba(46, 204, 113, 0.15)';
                  } else if (s.status === 'rejected') {
                    statusColor = '#e74c3c';
                    statusBg = 'rgba(231, 76, 60, 0.15)';
                  }

                  return (
                    <div key={s.id} className="glass-card animate-fade-in" style={{ padding: '1rem', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.01)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#fff' }}>{s.title}</h4>
                          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                            By @{s.username} · {new Date(s.created_at).toLocaleDateString('en-US')}
                          </span>
                        </div>
                        <span className="badge-tag" style={{ color: statusColor, borderColor: statusColor, background: statusBg, fontSize: '9px', textTransform: 'capitalize' }}>
                          {s.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                        {s.content}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button 
                          type="button" 
                          className={`feed-action-btn ${s.isUpvoted ? 'active' : ''}`} 
                          onClick={() => handleUpvoteSuggestion(s.id)}
                          style={{ fontSize: '11px', display: 'flex', gap: '4px', alignItems: 'center' }}
                        >
                          <i className={s.isUpvoted ? "ti ti-thumb-up-filled" : "ti ti-thumb-up"}></i> {s.upvotes || 0} Upvotes
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Custom Context Menu Overlay */}
      {activeContextMenu && (
        <div 
          className="pl-context-overlay"
          onClick={() => setActiveContextMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setActiveContextMenu(null); }}
        >
          <div 
            className="pl-context-menu"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: Math.min(activeContextMenu.y, window.innerHeight - 280),
              left: Math.max(10, Math.min(activeContextMenu.x - 105, window.innerWidth - 220))
            }}
          >
            {/* Reactions bar */}
            <div className="context-menu-emoji-bar">
              {['👍', '❤️', '🔥', '😂', '👏', '😢'].map((emoji) => (
                <button
                  key={emoji}
                  className="context-menu-emoji-btn"
                  onClick={() => {
                    handleToggleReaction(activeContextMenu.messageId, emoji);
                    setActiveContextMenu(null);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Actions */}
            <button 
              className="context-menu-item"
              onClick={() => {
                setReplyingTo({
                  id: activeContextMenu.msg.id,
                  username: activeContextMenu.msg.username,
                  message: activeContextMenu.msg.message
                });
                setActiveContextMenu(null);
              }}
            >
              <i className="ti ti-arrow-back-up"></i> Reply
            </button>

            {user && activeContextMenu.msg.username === user.username && (
              <button 
                className="context-menu-item"
                onClick={() => {
                  setEditingMessage(activeContextMenu.msg);
                  setChatInput(activeContextMenu.msg.message);
                  setReplyingTo(null);
                  setActiveContextMenu(null);
                }}
              >
                <i className="ti ti-edit"></i> Edit
              </button>
            )}

            <button 
              className="context-menu-item"
              onClick={() => {
                setIsMultiSelectMode(true);
                setSelectedMessageIds([activeContextMenu.messageId]);
                setActiveContextMenu(null);
              }}
            >
              <i className="ti ti-select"></i> Select
            </button>

            {user && (activeContextMenu.msg.username === user.username || user.role === 'admin') && (
              <button 
                className="context-menu-item delete"
                onClick={() => {
                  handleDeleteMessage(activeContextMenu.messageId);
                  setActiveContextMenu(null);
                }}
              >
                <i className="ti ti-trash"></i> Delete
              </button>
            )}
            {user && user.role === 'admin' && activeContextMenu.msg.username !== user.username && (
              <button 
                className="context-menu-item moderate"
                onClick={() => {
                  handleOpenModerationModal(activeContextMenu.msg.username, activeContextMenu.msg.user_id);
                  setActiveContextMenu(null);
                }}
                style={{ color: '#e67e22' }}
              >
                <i className="ti ti-shield"></i> Moderate User
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
