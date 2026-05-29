import React from 'react';
import { getYoutubeEmbedUrl } from '../utils/helpers';

interface EpisodeDetailProps {
  episodeDetailLoading: boolean;
  episodeDetail: any;
  user: any;
  setCurrentPage: (page: string) => void;
  handleEpisodeInteract: (type: string, content?: string, parentId?: number) => void;
  handleQuizSubmit: (quizId: number) => void;
  redeemError: string;
  redeemSuccess: string;
  handleRedeem: (e: React.FormEvent) => void;
  secretCode: string;
  setSecretCode: (code: string) => void;
  quizAnswer: number | null;
  setQuizAnswer: (ans: number | null) => void;
  quizResult: any;
  setQuizResult: (res: any) => void;
  commentInput: string;
  setCommentInput: (val: string) => void;
  replyingToComment: any;
  setReplyingToComment: (cmt: any) => void;
  showToast: (msg: string) => void;
}

export const EpisodeDetail: React.FC<EpisodeDetailProps> = ({
  episodeDetailLoading,
  episodeDetail,
  user,
  setCurrentPage,
  handleEpisodeInteract,
  handleQuizSubmit,
  redeemError,
  redeemSuccess,
  handleRedeem,
  secretCode,
  setSecretCode,
  quizAnswer,
  setQuizAnswer,
  quizResult,
  setQuizResult,
  commentInput,
  setCommentInput,
  replyingToComment,
  setReplyingToComment,
  showToast
}) => {
  if (episodeDetailLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="skeleton-loader" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>جاري تحميل تفاصيل الحلقة...</p>
      </div>
    );
  }
  if (!episodeDetail) return null;

  const { episode, quiz, has_solved_quiz, likes_count, shares_count, has_liked, comments } = episodeDetail;
  const embedUrl = getYoutubeEmbedUrl(episode.youtube_url);

  return (
    <div className="episode-detail-panel animate-fade-in">
      <button className="btn-outline mini" onClick={() => setCurrentPage('episodes')} style={{ marginBottom: '1.5rem' }}>
        <i className="ti ti-arrow-right"></i> العودة لقائمة الحلقات
      </button>

      <section className="cinematic-header">
        <div className="cinematic-banner-overlay"></div>
        <div className="cinematic-bg-img" style={{ backgroundImage: `url(${episode.thumbnail_url || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=600&auto=format&fit=crop'})` }}></div>
        <div className="cinematic-content" style={{ width: '100%' }}>
          <span className="cinematic-ep-num">حلقة {episode.id}</span>
          <div className="cinematic-title-row">
            <div className="cinematic-info">
              <h1 className="cinematic-title-ar">{episode.title_ar}</h1>
              <h2 className="cinematic-title-en">{episode.title_en}</h2>
            </div>
            <span style={{ background: 'rgba(255,255,255,0.06)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontFamily: 'sans-serif' }}>
              1:02:45
            </span>
          </div>

          {/* Integrated Likes & Shares buttons row inside episode card box */}
          <div className="cinematic-actions-row" style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button 
              className={`btn-outline mini ${has_liked ? 'active' : ''}`} 
              onClick={() => handleEpisodeInteract('like')}
              style={{ 
                background: has_liked ? 'var(--gradient-main)' : 'rgba(255,255,255,0.08)', 
                color: has_liked ? '#000' : '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(5px)',
                padding: '6px 12px',
                borderRadius: '12px'
              }}
            >
              <i className="ti ti-heart"></i> <span>{likes_count} إعجاب</span>
            </button>
            <button 
              className="btn-outline mini" 
              onClick={() => {
                const refUrl = `${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(user ? user.username : '')}&episode=${episode.id}`;
                navigator.clipboard.writeText(refUrl);
                showToast('تم نسخ رابط المشاركة الخاص بك! شاركه لتكسب نقاط XP عند دخول الآخرين منه 🔗');
              }}
              style={{ 
                background: 'rgba(255,255,255,0.04)', 
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                backdropFilter: 'blur(5px)',
                padding: '6px 12px',
                borderRadius: '12px'
              }}
            >
              <i className="ti ti-share"></i> <span>{shares_count} مشاركة</span>
            </button>
          </div>
        </div>
      </section>

      {/* Embedded player */}
      <section className="audio-player-panel">
        {embedUrl ? (
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '14px', marginBottom: '1rem' }}>
            <iframe
              src={embedUrl}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
            ></iframe>
          </div>
        ) : null}
      </section>

      {/* Code redeem & quiz widgets */}
      <section className="episode-widgets-row">
        <div className="glass-card">
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '0.5rem' }}>🔑 كود الحلقة السري</h3>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>دخل الكود السري المخفي بالدقيقة المحددة للحصول على نقاط الـ XP.</p>
          {redeemError && <div className="pl-form-error">{redeemError}</div>}
          {redeemSuccess && <div className="pl-form-success">{redeemSuccess}</div>}
          <form onSubmit={handleRedeem} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              type="text"
              className="pl-input"
              placeholder="مثال: EP1_SECRET"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
            />
            <button type="submit" className="btn-primary mini" style={{ width: '100%' }}>تفعيل الكود</button>
          </form>
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '0.5rem' }}>🧠 كويز الحلقة (+150 XP)</h3>
          {has_solved_quiz || quizResult ? (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <span style={{ fontSize: '32px' }}>✅</span>
              <h4 style={{ color: 'var(--orange)', marginTop: '0.5rem' }}>تم حل الكويز بنجاح!</h4>
            </div>
          ) : quiz ? (
            <div>
              <h4 style={{ fontSize: '13px', color: '#fff', marginBottom: '0.75rem' }}>{quiz.question}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {quiz.options.map((opt: string, idx: number) => (
                  <button
                    key={idx}
                    className={`poll-option-btn ${quizAnswer === idx ? 'selected' : ''}`}
                    onClick={() => setQuizAnswer(idx)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <button
                className="btn-primary mini"
                style={{ width: '100%', marginTop: '1rem' }}
                onClick={() => handleQuizSubmit(quiz.id)}
                disabled={quizAnswer === null}
              >
                إرسال الإجابة
              </button>
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>لا يوجد كويز متاح لهذه الحلقة.</p>
          )}
        </div>
      </section>

      {/* Comments section */}
      <section className="comments-panel" style={{ marginTop: '2.5rem' }}>
        <h2 className="pl-section-h2">
          <span className="title-text">
            <i className="ti ti-message-circle"></i> المناقشات والتعليقات ({comments.length})
          </span>
        </h2>
        
        {user ? (
          <div className="composer-row glass-card" style={{ marginBottom: '1.5rem' }}>
            <input
              type="text"
              className="pl-input"
              placeholder={replyingToComment ? `الرد على @${replyingToComment.username}...` : "أضف تعليقك الطبي هنا..."}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && commentInput.trim()) {
                  handleEpisodeInteract('comment', commentInput, replyingToComment?.id);
                }
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'flex-end' }}>
              {replyingToComment && (
                <button className="btn-outline mini" onClick={() => setReplyingToComment(null)}>إلغاء</button>
              )}
              <button 
                className="btn-primary mini" 
                onClick={() => handleEpisodeInteract('comment', commentInput, replyingToComment?.id)} 
                disabled={!commentInput.trim()}
              >
                {replyingToComment ? 'رد' : 'تعليق'}
              </button>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1.5rem' }}>
            يرجى تسجيل الدخول للمشاركة في النقاشات.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {comments.map((c: any) => (
            <div key={c.id} className="glass-card" style={{ background: '#0D0D0D' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--orange)' }}>@{c.username}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                  {new Date(c.created_at).toLocaleDateString('ar-EG')}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#fff', lineHeight: 1.5 }}>{c.content}</p>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button 
                  className={`feed-action-btn ${c.has_liked ? 'active' : ''}`}
                  onClick={() => handleEpisodeInteract('comment_like', undefined, c.id)}
                  style={{ fontSize: '11px' }}
                >
                  <i className="ti ti-heart"></i> {c.likes_count} إعجاب
                </button>
                {user && (
                  <button className="feed-action-btn" onClick={() => setReplyingToComment(c)} style={{ fontSize: '11px' }}>
                    <i className="ti ti-arrow-back-up"></i> رد
                  </button>
                )}
              </div>

              {/* Nested replies */}
              {c.replies && c.replies.length > 0 && (
                <div style={{ borderRight: '2px solid rgba(255,255,255,0.06)', paddingRight: '1rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {c.replies.map((r: any) => (
                    <div key={r.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>@{r.username}</span>
                        <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
                          {new Date(r.created_at).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#ccc' }}>{r.content}</p>
                      <button 
                        className={`feed-action-btn ${r.has_liked ? 'active' : ''}`}
                        onClick={() => handleEpisodeInteract('comment_like', undefined, r.id)}
                        style={{ fontSize: '10px', marginTop: '0.25rem' }}
                      >
                        <i className="ti ti-heart"></i> {r.likes_count}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
