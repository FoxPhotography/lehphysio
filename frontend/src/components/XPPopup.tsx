import React from 'react';

interface XPPopupProps {
  popups: { id: number; amount: number }[];
}

export const XPPopup: React.FC<XPPopupProps> = ({ popups }) => {
  return (
    <>
      {popups.map((popup) => (
        <div key={popup.id} className="pl-xp-popup">
          +{popup.amount} XP ⚡
        </div>
      ))}
    </>
  );
};
