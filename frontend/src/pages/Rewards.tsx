import React from 'react';
import { playChatSound } from '../utils/helpers';

interface RewardsProps {
  user: any;
  redeemError: string;
  redeemSuccess: string;
  handleRedeem: (e: any) => void;
  secretCode: string;
  setSecretCode: (val: string) => void;
  showToast: (msg: string) => void;
  triggerXpPopup: (amount: number) => void;
  claimMockReward: (amount: number) => void;
  unlockedCosmetics: string[];
  handleShopPurchase: (itemId: string, cost: number) => void;
  hasOpenedBoxToday: boolean;
  handleClaimSurpriseBox: () => void;
}

export const Rewards: React.FC<RewardsProps> = ({
  user,
  redeemError,
  redeemSuccess,
  handleRedeem,
  secretCode,
  setSecretCode,
  showToast,
  triggerXpPopup,
  claimMockReward,
  unlockedCosmetics,
  handleShopPurchase,
  hasOpenedBoxToday,
  handleClaimSurpriseBox
}) => {
  return (
    <div className="rewards-panel animate-fade-in">
      <div className="pl-section-h2">
        <span className="title-text"><i className="ti ti-gift"></i> Reward Center & XP Shop</span>
      </div>

      <section className="stats-badge-grid" style={{ gridTemplateColumns: '1fr' }}>
        {/* Secret Code Input */}
        <div className="glass-card">
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '0.5rem' }}>🔑 Redeem Secret XP Code</h3>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Enter codes from social media or episodes to get instant points.</p>
          {redeemError && <div className="pl-form-error">{redeemError}</div>}
          {redeemSuccess && <div className="pl-form-success">{redeemSuccess}</div>}
          <form onSubmit={handleRedeem} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              type="text"
              className="pl-input"
              placeholder="Enter reward code here"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
            />
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Redeem Code</button>
          </form>
        </div>

        {/* Daily chest rewards box */}
        <div className="glass-card mystery-chest-panel" style={{ opacity: hasOpenedBoxToday ? 0.7 : 1 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800 }}>📦 Daily Surprise Box</h3>
          <div 
            className={`chest-box-visual ${hasOpenedBoxToday ? 'opened' : ''}`} 
            onClick={hasOpenedBoxToday ? undefined : handleClaimSurpriseBox}
            style={{ 
              cursor: hasOpenedBoxToday ? 'not-allowed' : 'pointer', 
              fontSize: '48px', 
              textAlign: 'center', 
              margin: '1rem 0',
              filter: hasOpenedBoxToday ? 'grayscale(0.6)' : 'none'
            }}
          >
            {hasOpenedBoxToday ? '🔓' : '📦'}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {hasOpenedBoxToday ? 'You have already opened your surprise box today. Resets at 12:00 AM.' : 'Click the box to open it and receive a random daily bonus!'}
          </p>
        </div>
      </section>

      {/* XP Shop Grid */}
      <section style={{ marginTop: '2.5rem' }}>
        <h3 className="pl-section-h2"><span className="title-text"><i className="ti ti-shopping-cart"></i> Cosmetics Shop (XP Shop)</span></h3>
        <div className="rewards-shop-grid">
          <div className="shop-item-card glass-card">
            <div className="shop-item-preview-box avatar-frame-gold-glow">🌟</div>
            <h4 className="shop-item-title">Golden Glowing Frame</h4>
            <span className="shop-item-cost">500 XP</span>
            <button
              className="btn-primary mini"
              onClick={() => handleShopPurchase('gold-glow', 500)}
              disabled={unlockedCosmetics.includes('gold-glow')}
            >
              {unlockedCosmetics.includes('gold-glow') ? 'Purchased' : 'Buy Item'}
            </button>
          </div>

          <div className="shop-item-card glass-card">
            <div className="shop-item-preview-box avatar-frame-neon-ring">🩵</div>
            <h4 className="shop-item-title">Neon Blue Ring</h4>
            <span className="shop-item-cost">800 XP</span>
            <button
              className="btn-primary mini"
              onClick={() => handleShopPurchase('neon-ring', 800)}
              disabled={unlockedCosmetics.includes('neon-ring')}
            >
              {unlockedCosmetics.includes('neon-ring') ? 'Purchased' : 'Buy Item'}
            </button>
          </div>

          <div className="shop-item-card glass-card">
            <div className="shop-item-preview-box">🧠</div>
            <h4 className="shop-item-title">Title: "Neuro Specialist"</h4>
            <span className="shop-item-cost">1,500 XP</span>
            <button
              className="btn-primary mini"
              onClick={() => handleShopPurchase('neuro-specialist', 1500)}
              disabled={unlockedCosmetics.includes('neuro-specialist')}
            >
              {unlockedCosmetics.includes('neuro-specialist') ? 'Purchased' : 'Buy Item'}
            </button>
          </div>

          <div className="shop-item-card glass-card">
            <div className="shop-item-preview-box">👑</div>
            <h4 className="shop-item-title">Title: "Diagnosis Legend"</h4>
            <span className="shop-item-cost">2,000 XP</span>
            <button
              className="btn-primary mini"
              onClick={() => handleShopPurchase('diagnosis-legend', 2000)}
              disabled={unlockedCosmetics.includes('diagnosis-legend')}
            >
              {unlockedCosmetics.includes('diagnosis-legend') ? 'Purchased' : 'Buy Item'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
