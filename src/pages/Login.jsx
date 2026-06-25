import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../utils/apiCall';

/* ─── tiny sub-components ─────────────────────────────────────────────── */

function Spinner({ color = '#fff' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: 'spin .7s linear infinite', flexShrink: 0 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <circle cx="8" cy="8" r="6" fill="none" stroke={color} strokeWidth="2"
        strokeDasharray="24 10" strokeLinecap="round" />
    </svg>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div style={{
      background: '#fef2f2', border: '0.5px solid #fecaca', color: '#b91c1c',
      borderRadius: 8, padding: '9px 12px', fontSize: 12, marginBottom: 16,
      display: 'flex', alignItems: 'center', gap: 6,
      animation: 'fadeIn .2s ease',
    }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>
      ⚠ {message}
    </div>
  );
}

function Stepper({ step }) {
  const labels = ['Identify', 'Verify', 'Select'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28 }}>
      {[1, 2, 3].map((s) => {
        const done = step > s;
        const active = step === s;
        return (
          <React.Fragment key={s}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 500, flexShrink: 0, transition: 'all .3s',
              background: done ? '#2563eb' : active ? '#0f172a' : '#f1f5f9',
              color: done || active ? '#fff' : '#94a3b8',
              border: `1.5px solid ${done ? '#2563eb' : active ? '#0f172a' : '#e2e8f0'}`,
            }}>
              {done ? '✓' : s}
            </div>
            {s < 3 && (
              <div style={{ flex: 1, height: 1.5, background: '#e2e8f0', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', inset: 0, background: '#0f172a',
                  transform: step > s ? 'scaleX(1)' : 'scaleX(0)',
                  transformOrigin: 'left', transition: 'transform .4s ease',
                }} />
              </div>
            )}
          </React.Fragment>
        );
      })}
      <span style={{ marginLeft: 4, fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
        {labels[step - 1]}
      </span>
    </div>
  );
}

function Field({ id, label, value, onChange, placeholder, type = 'text', disabled, hint, maxLength, autoComplete, style: extraStyle = {} }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      <label htmlFor={id} style={{
        display: 'block', fontSize: 11, fontWeight: 500, color: '#374151',
        letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 6,
      }}>
        {label}
      </label>
      <input
        id={id} type={type} value={value} onChange={onChange}
        placeholder={placeholder} disabled={disabled}
        maxLength={maxLength} autoComplete={autoComplete}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          display: 'block', width: '100%', height: 40, padding: '0 12px',
          fontSize: 14, fontFamily: 'inherit', background: '#f8fafc',
          border: `0.5px solid ${focused ? '#2563eb' : '#e2e8f0'}`,
          borderRadius: 8, color: '#0f172a', outline: 'none',
          boxShadow: focused ? '0 0 0 3px #eff6ff' : 'none',
          transition: 'border .15s, box-shadow .15s', boxSizing: 'border-box',
          ...extraStyle,
        }}
      />
      {hint && <p style={{ marginTop: 5, fontSize: 11, color: '#94a3b8' }}>{hint}</p>}
    </div>
  );
}

function PrimaryButton({ label, loading, disabled, onClick, type = 'submit' }) {
  return (
    <button
      type={type} disabled={disabled || loading} onClick={onClick}
      style={{
        width: '100%', height: 42, display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 8,
        background: disabled || loading ? '#cbd5e1' : '#0f172a',
        color: '#fff', border: 'none', borderRadius: 8,
        fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'background .15s, transform .1s', letterSpacing: '.03em',
      }}
      onMouseDown={e => { if (!disabled && !loading) e.currentTarget.style.transform = 'scale(.98)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {loading ? <Spinner /> : label}
    </button>
  );
}

function GhostButton({ label, onClick, muted }) {
  return (
    <button type="button" onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      fontFamily: 'inherit', fontSize: 12, padding: 0,
      color: muted ? '#94a3b8' : '#2563eb',
    }}>
      {label}
    </button>
  );
}

/* ─── hero left panel ──────────────────────────────────────────────────── */

const FEATURES = [
  { icon: '📱', title: 'Mobile-based identity', desc: 'Your number acts as your unique key — no username to remember.' },
  { icon: '🔐', title: 'OTP verification', desc: 'A one-time code is sent to your registered mobile for every login.' },
  { icon: '🚫', title: 'Zero stored passwords', desc: 'We never store credentials — each session is independently verified.' },
];

function HeroPanel() {
  return (
    <div style={{
      background: '#0d1117', display: 'flex', flexDirection: 'column',
      padding: '52px 48px', position: 'relative', overflow: 'hidden', minHeight: '100vh',
    }}>
      {/* subtle radial glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle at 20% 50%, #1e293b55 0%, transparent 60%), radial-gradient(circle at 80% 20%, #312e8144 0%, transparent 50%)',
      }} />

      {/* grid overlay */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: .06 }}>
        <defs>
          <pattern id="hgrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" strokeWidth=".8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hgrid)" />
      </svg>

      {/* logo */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'auto' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 7, background: '#6366f1',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
        }}>⬡</div>
        <span style={{ color: '#f1f5f9', fontWeight: 500, fontSize: 14, letterSpacing: '.06em' }}>OOMS</span>
      </div>

      {/* hero body */}
      <div style={{ position: 'relative', zIndex: 1, margin: 'auto 0', padding: '40px 0' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#1e293b', border: '0.5px solid #334155',
          borderRadius: 20, padding: '5px 12px', marginBottom: 28,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ color: '#94a3b8', fontSize: 11, letterSpacing: '.04em' }}>Passwordless · Secure · Fast</span>
        </div>

        <h1 style={{ color: '#f8fafc', fontSize: 'clamp(24px,3vw,36px)', fontWeight: 500, lineHeight: 1.2, margin: '0 0 14px' }}>
          Your mobile is<br />your <span style={{ color: '#818cf8' }}>identity.</span>
        </h1>
        <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.7, maxWidth: 300, margin: '0 0 44px' }}>
          Organisation Operations Management System — sign in with just your number. No passwords, no friction.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, background: '#1e293b',
                border: '0.5px solid #334155', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 15, flexShrink: 0,
              }}>{f.icon}</div>
              <div>
                <p style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 500, margin: '0 0 3px' }}>{f.title}</p>
                <p style={{ color: '#475569', fontSize: 11, lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* footer badge */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2.4s ease-in-out infinite' }} />
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
        <span style={{ color: '#334155', fontSize: 11 }}>Secure channel active · 256-bit TLS</span>
      </div>
    </div>
  );
}

/* ─── main Login component ─────────────────────────────────────────────── */

export default function Login() {
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [countryCode, setCountryCode] = useState('91');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileSent, setMobileSent] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [profiles, setProfiles] = useState([]);

  /* handlers */
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    if (!/^[0-9]{10}$/.test(mobile)) { setError('Enter a valid 10-digit mobile number.'); return; }
    setIsSubmitting(true);
    try {
      const res = await apiCall('/auth/login/send-otp', 'POST', { country_code: countryCode, mobile });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        setMobileSent(mobile);
        setStep(2);
      } else {
        setError(data.message || 'Failed to send OTP.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setError('');
    if (otp.length < 4) { setError('Enter the OTP sent to your registered mobile.'); return; }
    setIsSubmitting(true);
    try {
      const res = await apiCall('/auth/login', 'POST', { country_code: countryCode, mobile: mobileSent, otp });
      const data = await res.json();
      if (res.ok && data.success !== false && data.token) {
        setTempToken(data.token);
        localStorage.setItem('ooms_user_data', JSON.stringify({ token: data.token }));
        const profileRes = await apiCall('/profile/list', 'GET');
        const profileData = await profileRes.json();
        if (profileRes.ok && profileData.success !== false && profileData.data?.length > 0) {
          if (profileData.data.length === 1) {
            login(data.token, profileData.data[0], { countrycode: countryCode, mobile: mobileSent });
          } else {
            setProfiles(profileData.data);
            setStep(3);
          }
        } else {
          setError('No profiles found for this user.');
          localStorage.removeItem('ooms_user_data');
        }
      } else {
        setError(data.message || 'Invalid OTP.');
      }
    } catch {
      setError('Network error. Please try again.');
      localStorage.removeItem('ooms_user_data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileSelect = (profile) => {
    login(tempToken, profile, { countrycode: countryCode, mobile: mobileSent });
  };

  const goBack = () => {
    setStep(1);
    setError('');
    setOtp('');
    localStorage.removeItem('ooms_user_data');
  };

  /* card content per step */
  const cardContent = {
    1: {
      eyebrow: 'Sign in',
      title: 'Enter your mobile',
      sub: "We'll send a one-time code to your registered number.",
      body: (
        <form onSubmit={handleSendOtp} style={{ animation: 'slideIn .25s ease' }}>
          <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 86, flexShrink: 0 }}>
              <Field
                id="cc" label="Code"
                value={`+${countryCode}`}
                onChange={e => setCountryCode(e.target.value.replace(/\D/g, ''))}
                disabled={isSubmitting}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Field
                id="mobile" label="Mobile number"
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit number"
                disabled={isSubmitting} maxLength={10} autoComplete="tel"
              />
            </div>
          </div>
          <PrimaryButton label="Send OTP →" loading={isSubmitting} disabled={mobile.length !== 10 || !countryCode} />
        </form>
      ),
    },
    2: {
      eyebrow: 'Verification',
      title: 'Check your phone',
      sub: `Code sent to +${countryCode} ${mobileSent}. Valid for 10 minutes.`,
      body: (
        <form onSubmit={handleVerifyOtp} style={{ animation: 'slideIn .25s ease' }}>
          <Field
            id="otp" label="One-time code"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="· · · · · ·"
            maxLength={6} disabled={isSubmitting} autoComplete="one-time-code"
            hint="6-digit code from your SMS"
            style={{ letterSpacing: '.35em', fontSize: 18, textAlign: 'center' }}
          />
          <PrimaryButton label="Verify and sign in" loading={isSubmitting} disabled={otp.length < 4} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
            <GhostButton label="← Change mobile" onClick={goBack} />
            <GhostButton label="Resend code" onClick={handleSendOtp} muted />
          </div>
        </form>
      ),
    },
    3: {
      eyebrow: 'Almost there',
      title: 'Select a profile',
      sub: 'Multiple accounts found. Choose which one to access.',
      body: (
        <div style={{ animation: 'slideIn .25s ease' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto' }}>
            {profiles.map((profile, idx) => (
              <div
                key={idx}
                onClick={() => handleProfileSelect(profile)}
                style={{
                  padding: 14, border: '0.5px solid #e2e8f0', borderRadius: 8,
                  cursor: 'pointer', transition: 'border .15s, background .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#0f172a'; e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'transparent'; }}
              >
                <p style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', margin: '0 0 3px' }}>{profile.name}</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 2px' }}>Branch: {profile.branch?.name || 'N/A'}</p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{profile.email}</p>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: '#e2e8f0', margin: '20px 0' }} />
          <GhostButton label="← Back to login" onClick={goBack} />
        </div>
      ),
    },
  };

  const current = cardContent[step];

  return (
    <div style={{
      minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      background: '#f8fafc', position: 'relative',
    }}>
      <style>{`
        @media (max-width: 700px) {
          .ooms-hero { display: none !important; }
          .ooms-right { padding: 24px 16px !important; }
          .ooms-card { padding: 28px 20px !important; }
        }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh' }}>

        {/* left hero */}
        <div className="ooms-hero">
          <HeroPanel />
        </div>

        {/* right form */}
        <div className="ooms-right" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '48px 32px', background: '#f8fafc',
        }}>
          <div className="ooms-card" style={{
            width: '100%', maxWidth: 384, background: '#ffffff',
            borderRadius: 16, border: '0.5px solid #e2e8f0',
            padding: '36px 32px', boxShadow: '0 4px 24px rgba(0,0,0,.05)',
            boxSizing: 'border-box',
          }}>
            {/* card header */}
            <p style={{ fontSize: 11, fontWeight: 500, color: '#2563eb', letterSpacing: '.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>
              {current.eyebrow}
            </p>
            <h2 style={{ fontSize: 20, fontWeight: 500, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.25 }}>
              {current.title}
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 28px', lineHeight: 1.6 }}>
              {current.sub}
            </p>

            <Stepper step={step} />
            <ErrorBanner message={error} />
            {current.body}

            <p style={{ textAlign: 'center', fontSize: 11, color: '#cbd5e1', marginTop: 24, lineHeight: 1.6 }}>
              By continuing you agree to OOMS{' '}
              <span style={{ color: '#94a3b8', textDecoration: 'underline', cursor: 'pointer' }}>terms of access</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}