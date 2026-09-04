import { useState } from 'react';

interface AuthScreenProps {
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null; needsConfirm?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
}

export function AuthScreen({ signUp, signIn }: AuthScreenProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmSent, setConfirmSent] = useState(false);

  const canSubmit = mode === 'signin'
    ? email.trim() && password
    : displayName.trim() && email.trim() && password.length >= 6;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true);
    setError('');
    if (mode === 'signup') {
      const res = await signUp(email.trim(), password, displayName.trim());
      setBusy(false);
      if (res.error) { setError(res.error); return; }
      if (res.needsConfirm) { setConfirmSent(true); return; }
    } else {
      const res = await signIn(email.trim(), password);
      setBusy(false);
      if (res.error) { setError(res.error); return; }
    }
  };

  if (confirmSent) {
    return (
      <div className="onboarding">
        <div className="onboarding-card">
          <div className="wordmark large">Entice</div>
          <p className="tagline">Come closer, differently.</p>
          <p className="onboarding-copy">Check your email to confirm your account, then sign in below.</p>
          <button className="btn primary full" onClick={() => { setConfirmSent(false); setMode('signin'); }}>Back to sign in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        <div className="wordmark large">Entice</div>
        <p className="tagline">Come closer, differently.</p>
        <div className="auth-tabs">
          <button type="button" className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setError(''); }}>Create account</button>
          <button type="button" className={`auth-tab ${mode === 'signin' ? 'active' : ''}`} onClick={() => { setMode('signin'); setError(''); }}>Sign in</button>
        </div>
        <form onSubmit={submit}>
          {mode === 'signup' && (
            <input className="name-input" value={displayName} placeholder="Your name" autoFocus onChange={(e) => setDisplayName(e.target.value)} />
          )}
          <input className="name-input" type="email" value={email} placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <input className="name-input" type="password" value={password} placeholder={mode === 'signup' ? 'Password (min 6 characters)' : 'Password'} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="error-text">{error}</p>}
          <button className="btn primary full" type="submit" disabled={!canSubmit || busy}>
            {busy ? 'One moment…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <p className="auth-note">Real accounts, backed by Supabase — your identity no longer resets on refresh.</p>
      </div>
    </div>
  );
}
