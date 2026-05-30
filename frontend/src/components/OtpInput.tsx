import React, { useRef } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
}

export const OtpInput: React.FC<OtpInputProps> = ({ value, onChange }) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Split value into array of 6 digits (padded with empty strings)
  const codeArray = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    const numericVal = val.replace(/[^0-9]/g, ''); // Allow only digits
    if (!numericVal) {
      // If cleared
      const newCode = [...codeArray];
      newCode[index] = '';
      onChange(newCode.join(''));
      return;
    }

    // Take the last character entered
    const digit = numericVal.slice(-1);
    const newCode = [...codeArray];
    newCode[index] = digit;
    const combined = newCode.join('');
    onChange(combined);

    // Auto-focus next input
    if (index < 5 && digit) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!codeArray[index] && index > 0) {
        // Current box is already empty; focus previous and clear it
        const newCode = [...codeArray];
        newCode[index - 1] = '';
        onChange(newCode.join(''));
        inputsRef.current[index - 1]?.focus();
      } else {
        // Clear current box
        const newCode = [...codeArray];
        newCode[index] = '';
        onChange(newCode.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const digitsOnly = pastedData.replace(/[^0-9]/g, '').slice(0, 6);
    onChange(digitsOnly);

    // Focus the appropriate input box after pasting
    const focusIndex = Math.min(digitsOnly.length, 5);
    inputsRef.current[focusIndex]?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '1.5rem', direction: 'ltr' }}>
      {codeArray.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => { inputsRef.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          className="pl-otp-box"
          style={{
            width: '46px',
            height: '52px',
            borderRadius: '10px',
            border: '2px solid var(--card-border)',
            background: 'rgba(255, 255, 255, 0.04)',
            color: '#fff',
            fontSize: '22px',
            fontWeight: '900',
            textAlign: 'center',
            outline: 'none',
            transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)'
          }}
          required
        />
      ))}
    </div>
  );
};
