import React from 'react';

interface EpisodesProps {
  episodes: any[];
  navigateToEpisode: (id: number) => void;
}

export const Episodes: React.FC<EpisodesProps> = ({ episodes, navigateToEpisode }) => {
  return (
    <div className="episodes-panel animate-fade-in">
      <div className="pl-section-h2">
        <span className="title-text"><i className="ti ti-video"></i> حلقات بودكاست "ليه فيزيو؟"</span>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '14px' }}>
        شاهد الحلقات للبحث عن الكود السري المخفي بالداخل وحل الكويز المصاحب لها للحصول على إجمالي +250 XP لكل حلقة!
      </p>
      
      <div className="game-card-grid">
        {episodes.map((ep: any) => (
          <div key={ep.id} className="game-widget-card glass-card" onClick={() => navigateToEpisode(ep.id)} style={{ cursor: 'pointer' }}>
            <div className="continue-thumb" style={{ backgroundImage: `url(${ep.thumbnail_url || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=600&auto=format&fit=crop'})`, borderRadius: '12px' }}>
              <span className="game-tag-badge" style={{ position: 'absolute', top: '10px', right: '10px' }}>حلقة {ep.id}</span>
            </div>
            <h3 className="game-card-title" style={{ marginTop: '0.5rem' }}>{ep.title_ar}</h3>
            <p className="game-card-desc">{ep.description}</p>
            <div className="game-card-footer">
              <span className="game-card-reward">🔑 كود سري + كويز</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {new Date(ep.created_at).toLocaleDateString('ar-EG')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
