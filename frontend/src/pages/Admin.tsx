import React from 'react';

interface AdminProps {
  adminSection: string;
  setAdminSection: (val: string) => void;
  adminMessage: string;
  adminEpisodeForm: any;
  setAdminEpisodeForm: React.Dispatch<React.SetStateAction<any>>;
  handleAdminCreateEpisode: (e: React.FormEvent) => void;
  adminSubmitting: boolean;
  adminUsers: any[];
  adminCodes: any[];
  adminSuggestions: any[];
  adminCodeForm: any;
  setAdminCodeForm: React.Dispatch<React.SetStateAction<any>>;
  handleAdminCreateCode: (e: React.FormEvent) => void;
  handleAdminToggleUserRole: (userId: number, currentRole: string) => void;
  handleAdminUpdateSuggestionStatus: (suggestionId: number, status: 'approved' | 'rejected') => void;
  handleAdminDeleteCode: (codeId: number, codeName: string) => void;
  handleOpenModerationModal: (username: string, userId: number) => void;
}

export const Admin: React.FC<AdminProps> = ({
  adminSection,
  setAdminSection,
  adminMessage,
  adminEpisodeForm,
  setAdminEpisodeForm,
  handleAdminCreateEpisode,
  adminSubmitting,
  adminUsers,
  adminCodes,
  adminSuggestions,
  adminCodeForm,
  setAdminCodeForm,
  handleAdminCreateCode,
  handleAdminToggleUserRole,
  handleAdminUpdateSuggestionStatus,
  handleAdminDeleteCode,
  handleOpenModerationModal
}) => {
  return (
    <div className="admin-panel animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <h2 className="pl-section-h2" style={{ marginBottom: '1.5rem' }}>
        <span><i className="ti ti-shield-lock"></i> Admin Dashboard</span>
      </h2>
      
      {/* Tab Navigation */}
      <div className="games-filter-tabs admin-tabs-mobile" style={{ marginBottom: '1.5rem' }}>
        <button 
          className={`games-filter-btn ${adminSection === 'episodes' ? 'active' : ''}`} 
          onClick={() => setAdminSection('episodes')}
          style={{ whiteSpace: 'nowrap' }}
        >
          📹 New Episode
        </button>
        <button 
          className={`games-filter-btn ${adminSection === 'codes' ? 'active' : ''}`} 
          onClick={() => setAdminSection('codes')}
          style={{ whiteSpace: 'nowrap' }}
        >
          🔑 XP Codes
        </button>
        <button 
          className={`games-filter-btn ${adminSection === 'users' ? 'active' : ''}`} 
          onClick={() => setAdminSection('users')}
          style={{ whiteSpace: 'nowrap' }}
        >
          👥 Users Management
        </button>
        <button 
          className={`games-filter-btn ${adminSection === 'suggestions' ? 'active' : ''}`} 
          onClick={() => setAdminSection('suggestions')}
          style={{ whiteSpace: 'nowrap' }}
        >
          💡 Suggestions
        </button>
      </div>

      {adminMessage && (
        <div className="pl-form-success" style={{ marginBottom: '1rem', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--orange)', background: 'rgba(255, 106, 0, 0.15)', color: '#fff', fontSize: '13px' }}>
          {adminMessage}
        </div>
      )}

      {/* 1. EPISODES MANAGEMENT */}
      {adminSection === 'episodes' && (
        <form onSubmit={handleAdminCreateEpisode} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '2rem' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 900, borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', color: 'var(--orange)' }}>
            Publish a New Podcast Episode
          </h3>
          
          <div className="pl-form-group">
            <label style={{ fontSize: '12px', fontWeight: 800 }}>Title (Arabic)</label>
            <input 
              type="text" 
              className="pl-input" 
              value={adminEpisodeForm.title_ar} 
              onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, title_ar: e.target.value }))} 
              required 
            />
          </div>

          <div className="pl-form-group">
            <label style={{ fontSize: '12px', fontWeight: 800 }}>Title (English)</label>
            <input 
              type="text" 
              className="pl-input" 
              value={adminEpisodeForm.title_en} 
              onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, title_en: e.target.value }))} 
              required 
            />
          </div>

          <div className="pl-form-group">
            <label style={{ fontSize: '12px', fontWeight: 800 }}>Description</label>
            <textarea 
              className="pl-input" 
              rows={3}
              value={adminEpisodeForm.description} 
              onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, description: e.target.value }))}
            ></textarea>
          </div>

          <div className="pl-form-group">
            <label style={{ fontSize: '12px', fontWeight: 800 }}>Thumbnail URL (Poster Image)</label>
            <input 
              type="url" 
              className="pl-input" 
              placeholder="https://images.unsplash.com/photo-..."
              value={adminEpisodeForm.thumbnail_url} 
              onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, thumbnail_url: e.target.value }))} 
            />
          </div>

          <div className="pl-form-group">
            <label style={{ fontSize: '12px', fontWeight: 800 }}>YouTube URL</label>
            <input 
              type="url" 
              className="pl-input" 
              placeholder="https://www.youtube.com/watch?v=..."
              value={adminEpisodeForm.youtube_url} 
              onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, youtube_url: e.target.value }))} 
            />
          </div>

          {/* QUIZ CONFIGURATION */}
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--card-border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--orange)' }}>📝 Interactive Episode Quiz (Optional)</h4>
            
            <div className="pl-form-group">
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Quiz Question</label>
              <input 
                type="text" 
                className="pl-input" 
                placeholder="What is the first line of defense for...?"
                value={adminEpisodeForm.quiz_question || ''} 
                onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, quiz_question: e.target.value }))} 
              />
            </div>

            <div className="pl-form-group">
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Quiz Options</label>
              {[0, 1, 2, 3].map((idx) => (
                <input
                  key={idx}
                  type="text"
                  className="pl-input"
                  placeholder={`Option ${idx + 1}`}
                  value={adminEpisodeForm.quiz_options[idx] || ''}
                  onChange={(e) => {
                    const nextOpts = [...adminEpisodeForm.quiz_options];
                    nextOpts[idx] = e.target.value;
                    setAdminEpisodeForm((p: any) => ({ ...p, quiz_options: nextOpts }));
                  }}
                  required={!!adminEpisodeForm.quiz_question}
                  style={{ marginBottom: '6px' }}
                />
              ))}
            </div>

            <div className="pl-form-group">
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Correct Answer Option</label>
              <select 
                className="pl-input"
                value={adminEpisodeForm.quiz_correct}
                onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, quiz_correct: Number(e.target.value) }))}
              >
                <option value={0}>Option 1</option>
                <option value={1}>Option 2</option>
                <option value={2}>Option 3</option>
                <option value={3}>Option 4</option>
              </select>
            </div>
          </div>

          {/* EPISODE SECRET CODE */}
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--card-border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 900, color: 'var(--orange)' }}>🔑 Episode Secret Code (Optional)</h4>
            
            <div className="pl-form-group">
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Secret Code Name</label>
              <input 
                type="text" 
                className="pl-input" 
                placeholder="EPXX_SECRET"
                value={adminEpisodeForm.code || ''} 
                onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, code: e.target.value }))} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="pl-form-group">
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Max Uses</label>
                <input 
                  type="number" 
                  className="pl-input" 
                  value={adminEpisodeForm.code_max_uses || 200} 
                  onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, code_max_uses: Number(e.target.value) }))} 
                />
              </div>

              <div className="pl-form-group">
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Expiry Date</label>
                <input 
                  type="date" 
                  className="pl-input" 
                  value={adminEpisodeForm.code_expiry || ''} 
                  onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, code_expiry: e.target.value }))} 
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={adminSubmitting} style={{ marginTop: '0.5rem' }}>
            {adminSubmitting ? 'Uploading Episode...' : 'Publish Episode & Enable Quiz'}
          </button>
        </form>
      )}

      {/* 2. STANDALONE XP CODES */}
      {adminSection === 'codes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Create Code Form */}
          <form onSubmit={handleAdminCreateCode} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 900, color: 'var(--orange)', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
              Create Standalone XP / Promo Code
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="pl-form-group">
                <label style={{ fontSize: '11px', fontWeight: 800 }}>Code Name (Uppercase)</label>
                <input 
                  type="text" 
                  className="pl-input" 
                  placeholder="e.g. FACEBOOK50"
                  value={adminCodeForm.code} 
                  onChange={(e) => setAdminCodeForm((p: any) => ({ ...p, code: e.target.value }))} 
                  required 
                />
              </div>

              <div className="pl-form-group">
                <label style={{ fontSize: '11px', fontWeight: 800 }}>XP Reward Amount</label>
                <input 
                  type="number" 
                  className="pl-input" 
                  value={adminCodeForm.xp_reward} 
                  onChange={(e) => setAdminCodeForm((p: any) => ({ ...p, xp_reward: Number(e.target.value) }))} 
                  required 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="pl-form-group">
                <label style={{ fontSize: '11px', fontWeight: 800 }}>Type</label>
                <select 
                  className="pl-input"
                  value={adminCodeForm.type}
                  onChange={(e) => setAdminCodeForm((p: any) => ({ ...p, type: e.target.value }))}
                >
                  <option value="social">Social Media Code</option>
                  <option value="episode">Episode Code</option>
                </select>
              </div>

              <div className="pl-form-group">
                <label style={{ fontSize: '11px', fontWeight: 800 }}>Max Uses</label>
                <input 
                  type="number" 
                  className="pl-input" 
                  value={adminCodeForm.max_uses} 
                  onChange={(e) => setAdminCodeForm((p: any) => ({ ...p, max_uses: Number(e.target.value) }))} 
                  required 
                />
              </div>

              <div className="pl-form-group">
                <label style={{ fontSize: '11px', fontWeight: 800 }}>Expiry Date</label>
                <input 
                  type="date" 
                  className="pl-input" 
                  value={adminCodeForm.expiry_date} 
                  onChange={(e) => setAdminCodeForm((p: any) => ({ ...p, expiry_date: e.target.value }))} 
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={adminSubmitting} style={{ marginTop: '0.5rem' }}>
              Create Standalone Code
            </button>
          </form>

          {/* XP Codes Table */}
          <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 900, color: 'var(--orange)', marginBottom: '1rem' }}>
              Existing XP Codes ({adminCodes.length})
            </h3>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '500px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-border)', textAlign: 'left', opacity: 0.7 }}>
                  <th style={{ padding: '8px 12px' }}>Code</th>
                  <th style={{ padding: '8px 12px' }}>XP</th>
                  <th style={{ padding: '8px 12px' }}>Type</th>
                  <th style={{ padding: '8px 12px' }}>Uses</th>
                  <th style={{ padding: '8px 12px' }}>Expiry</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminCodes.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No XP codes registered.
                    </td>
                  </tr>
                ) : (
                  adminCodes.map((c: any) => {
                    const isExpired = c.expiry_date && new Date(c.expiry_date) < new Date();
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 800, color: '#fff' }}>{c.code}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--orange)' }}>+{c.xp_reward} XP</td>
                        <td style={{ padding: '8px 12px', textTransform: 'capitalize' }}>{c.type}</td>
                        <td style={{ padding: '8px 12px' }}>{c.current_uses} / {c.max_uses}</td>
                        <td style={{ padding: '8px 12px', color: isExpired ? '#e74c3c' : 'inherit' }}>
                          {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString('en-US') : 'Never'}
                          {isExpired && ' (Expired)'}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleAdminDeleteCode(c.id, c.code)}
                            className="btn-outline mini"
                            style={{ fontSize: '10px', padding: '4px 8px', color: '#ff4d4d', borderColor: 'rgba(255,77,77,0.2)' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. USERS MANAGEMENT */}
      {adminSection === 'users' && (
        <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 900, color: 'var(--orange)', marginBottom: '1rem' }}>
            Registered Members List ({adminUsers.length})
          </h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--card-border)', textAlign: 'left', opacity: 0.7 }}>
                <th style={{ padding: '8px 12px' }}>User</th>
                <th style={{ padding: '8px 12px' }}>Email</th>
                <th style={{ padding: '8px 12px' }}>Batch</th>
                <th style={{ padding: '8px 12px' }}>Total XP</th>
                <th style={{ padding: '8px 12px' }}>Role</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No users registered in the database.
                  </td>
                </tr>
              ) : (
                adminUsers.map((u: any) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 800, color: '#fff' }}>@{u.username}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '8px 12px' }}>{u.batch}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--orange)', fontWeight: 700 }}>{u.total_xp.toLocaleString()}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className="badge-tag mini" style={{ 
                        borderColor: u.role === 'admin' ? 'var(--orange)' : 'var(--text-secondary)',
                        color: u.role === 'admin' ? 'var(--orange)' : 'var(--text-secondary)',
                        background: u.role === 'admin' ? 'rgba(255, 106, 0, 0.15)' : 'transparent',
                        textTransform: 'uppercase'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleAdminToggleUserRole(u.id, u.role)}
                        className="btn-outline mini" 
                        style={{ fontSize: '10px', padding: '4px 8px' }}
                      >
                        Toggle Role
                      </button>
                      <button 
                        onClick={() => handleOpenModerationModal(u.username, u.id)}
                        className="btn-outline mini" 
                        style={{ fontSize: '10px', padding: '4px 8px', color: '#e67e22', borderColor: 'rgba(230,126,34,0.3)' }}
                      >
                        Moderate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. SUGGESTIONS MODERATION */}
      {adminSection === 'suggestions' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 900, color: 'var(--orange)', marginBottom: '1rem' }}>
            Suggestions Moderation Feed ({adminSuggestions.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {adminSuggestions.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>
                No suggestions have been submitted yet.
              </div>
            ) : (
              adminSuggestions.map((s: any) => {
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
                  <div key={s.id} className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: '#fff' }}>{s.title}</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Submitted by @{s.username} · {new Date(s.created_at).toLocaleString('en-US')}
                        </span>
                      </div>
                      <span className="badge-tag" style={{ color: statusColor, borderColor: statusColor, background: statusBg, fontSize: '9px', textTransform: 'capitalize' }}>
                        {s.status}
                      </span>
                    </div>

                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0.25rem 0 0.5rem 0' }}>
                      {s.content}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '11px', color: 'var(--orange)' }}>
                        👍 {s.upvotes || 0} Upvotes
                      </span>
                      
                      {s.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => handleAdminUpdateSuggestionStatus(s.id, 'approved')}
                            className="btn-primary mini" 
                            style={{ background: '#2ecc71', fontSize: '10px' }}
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleAdminUpdateSuggestionStatus(s.id, 'rejected')}
                            className="btn-outline mini" 
                            style={{ borderColor: '#e74c3c', color: '#e74c3c', fontSize: '10px' }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
