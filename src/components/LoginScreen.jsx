import React, { useState, useEffect } from 'react';
import { Fingerprint, Delete, Lock } from 'lucide-react';
import { api } from '../api';
import samakameLogo from '../Logo/SAMAKAME logo.png';

export default function LoginScreen({ onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lockout, setLockout] = useState(0); // seconds remaining
  const [triesLeft, setTriesLeft] = useState(3);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockout <= 0) return;
    const id = setInterval(() => {
      setLockout(prev => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [lockout]);

  const handleDigit = (d) => {
    if (lockout > 0 || loading) return;
    if (pin.length < 8) setPin(prev => prev + d);
    setError('');
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleSubmit = async () => {
    if (!pin || loading || lockout > 0) return;
    setLoading(true);
    try {
      const result = await api.login(pin);
      onLogin(result);
    } catch (err) {
      setPin('');
      setLoading(false);
      setShake(true);
      setTimeout(() => setShake(false), 600);

      // Network/connection error — server not running
      if (err instanceof TypeError || (err?.message && err.message.includes('fetch'))) {
        setError('Cannot connect to server. Please restart the app.');
        return;
      }

      if (err.lockedFor) {
        setLockout(err.lockedFor);
        setError(`Too many attempts. Locked for ${err.lockedFor}s.`);
        setTriesLeft(3);
      } else {
        const left = err.triesLeft ?? (triesLeft - 1);
        setTriesLeft(left);
        if (left > 0) {
          setError(`Incorrect PIN. ${left} attempt${left !== 1 ? 's' : ''} remaining.`);
        } else {
          setError('Too many attempts. Please wait 30 seconds.');
        }
      }
    }
  };

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      else if (e.key === 'Backspace') handleDelete();
      else if (e.key === 'Enter') handleSubmit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pin, loading, lockout]);

  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div className="login-screen">
      {/* Institutional refined background elements */}
      <div className="login-bg-overlay" />
      <div className="login-glow login-glow-1" />
      <div className="login-glow login-glow-2" />

      <div className={`login-card ${shake ? 'shake' : ''}`}>
        {/* Logo area - Institutional anchor */}
        <div className="login-logo">
          <div className="login-logo-wrap">
            <img src={samakameLogo} alt="SAMAKAME" className="login-brand-logo" />
          </div>
          <div className="login-titles">
            <h1>PWD Masterlist</h1>
            <p>Administrative Portal — Secure Access</p>
          </div>
        </div>

        {/* PIN Entry Zone */}
        <div className="login-auth-zone">
          <div className="login-pin-display">
            {[...Array(Math.max(4, pin.length))].map((_, i) => (
              <div
                key={i}
                className={`pin-dot ${i < pin.length ? 'filled' : ''} ${error ? 'error' : ''}`}
              />
            ))}
          </div>

          {(error || lockout > 0) && (
            <div className="login-error">
              {lockout > 0 ? (
                <><Lock size={14} /> Locked — access suspended for <strong>{lockout}s</strong></>
              ) : error}
            </div>
          )}
        </div>

        {/* PIN pad */}
        <div className={`pin-pad ${lockout > 0 ? 'locked' : ''}`}>
          {digits.map((d, i) => {
            if (d === '') return <div key={i} className="pin-btn-spacer" />;
            if (d === '⌫') return (
              <button key={i} className="pin-btn pin-btn-del" onClick={handleDelete} disabled={lockout > 0 || loading}>
                <Delete size={20} />
              </button>
            );
            return (
              <button key={i} className="pin-btn" onClick={() => handleDigit(d)} disabled={lockout > 0 || loading}>
                {d}
              </button>
            );
          })}
        </div>

        {/* Action Bar */}
        <div className="login-footer">
          <button
            className={`login-submit ${loading ? 'loading' : ''}`}
            onClick={handleSubmit}
            disabled={pin.length < 4 || loading || lockout > 0}
          >
            {loading ? <span className="login-spinner" /> : 'Sign In'}
          </button>
          <p className="login-security-notice">
            <Lock size={12} /> Secure encrypted session
          </p>
        </div>
      </div>
    </div>
  );
}

