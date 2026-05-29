import React from 'react';

interface AdminProps {
  adminSection: string;
  setAdminSection: (val: string) => void;
  adminMessage: string;
  adminEpisodeForm: any;
  setAdminEpisodeForm: React.Dispatch<React.SetStateAction<any>>;
  handleAdminCreateEpisode: (e: React.FormEvent) => void;
  adminSubmitting: boolean;
}

export const Admin: React.FC<AdminProps> = ({
  adminSection,
  setAdminSection,
  adminMessage,
  adminEpisodeForm,
  setAdminEpisodeForm,
  handleAdminCreateEpisode,
  adminSubmitting
}) => {
  return (
    <div className="admin-panel animate-fade-in">
      <h2 className="pl-section-h2"><span><i className="ti ti-shield-lock"></i> لوحة الإدارة للمسؤولين</span></h2>
      
      <div className="games-filter-tabs" style={{ marginBottom: '1.5rem' }}>
        <button className={`games-filter-btn ${adminSection === 'episodes' ? 'active' : ''}`} onClick={() => setAdminSection('episodes')}>حلقة جديدة</button>
        <button className={`games-filter-btn ${adminSection === 'codes' ? 'active' : ''}`} onClick={() => setAdminSection('codes')}>أكواد الـ XP</button>
      </div>

      {adminSection === 'episodes' ? (
        <form onSubmit={handleAdminCreateEpisode} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {adminMessage && <div className="pl-form-success">{adminMessage}</div>}
          <div className="pl-form-group">
            <label>العنوان بالعربية</label>
            <input 
              type="text" 
              className="pl-input" 
              value={adminEpisodeForm.title_ar} 
              onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, title_ar: e.target.value }))} 
              required 
            />
          </div>
          <div className="pl-form-group">
            <label>العنوان بالإنجليزية</label>
            <input 
              type="text" 
              className="pl-input" 
              value={adminEpisodeForm.title_en} 
              onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, title_en: e.target.value }))} 
              required 
            />
          </div>
          <div className="pl-form-group">
            <label>الوصف</label>
            <textarea 
              className="pl-input" 
              value={adminEpisodeForm.description} 
              onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, description: e.target.value }))}
            ></textarea>
          </div>
          <div className="pl-form-group">
            <label>رابط يوتيوب</label>
            <input 
              type="text" 
              className="pl-input" 
              value={adminEpisodeForm.youtube_url} 
              onChange={(e) => setAdminEpisodeForm((p: any) => ({ ...p, youtube_url: e.target.value }))} 
            />
          </div>
          <button type="submit" className="btn-primary" disabled={adminSubmitting}>رفع الحلقة وتفعيل الكويز</button>
        </form>
      ) : (
        <div className="glass-card">أكواد الـ XP وإعدادات الصلاحيات للمسؤولين.</div>
      )}
    </div>
  );
};
