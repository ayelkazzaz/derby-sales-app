import { LinkIcon } from './Icons';
import { hoursLeft } from '../lib/helpers';
import type { Couple, Profile, Role } from '../lib/types';

export type ToastFn = (message: string) => void;

export interface ToastItem { id: string; message: string }

export function Toasts({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="toast-stack">
      {toasts.map((t) => <div key={t.id} className="toast">{t.message}</div>)}
    </div>
  );
}

export function FeatureHeader({ title, sub, onBack }: { title: string; sub?: string; onBack: () => void }) {
  return (
    <div className="feature-header">
      <button className="back-link" onClick={onBack}>← Back to Tonight</button>
      <h2>{title}</h2>
      {sub && <p className="placeholder-body">{sub}</p>}
    </div>
  );
}

export function PairGate({ feature, onBack }: { feature: string; onBack: () => void }) {
  return (
    <div className="screen feature">
      <FeatureHeader title={feature} sub="This one needs a paired space — head back to Tonight and create or join one." onBack={onBack} />
      <section className="card"><button className="btn primary" onClick={onBack}>Go pair up</button></section>
    </div>
  );
}

export interface FeatureDef { key: string; label: string; category: string; blurb: string; requiresPairing?: boolean }

export function FeatureRow({ f, status, onOpen }: { f: FeatureDef; status: string; onOpen: (key: string) => void }) {
  return (
    <button className="feature-row" onClick={() => onOpen(f.key)}>
      <span className={`row-bar cat-${f.category}`} />
      <span className="row-body">
        <span className="row-label">{f.label}</span>
        <span className="row-blurb">{f.blurb}</span>
      </span>
      <span className="row-status">{status}</span>
    </button>
  );
}

export function GameSetup({ title, sub, myName, p2Name, onP2Change, onStart, onBack }: {
  title: string; sub: string; myName: string; p2Name: string; onP2Change: (v: string) => void; onStart: () => void; onBack: () => void;
}) {
  return (
    <div className="screen feature">
      <FeatureHeader title={title} sub={sub} onBack={onBack} />
      <section className="card">
        <p className="card-sub">Player 1: {myName}</p>
        <label className="repair-label">Player 2</label>
        <input className="name-input" value={p2Name} onChange={(e) => onP2Change(e.target.value)} placeholder="Partner’s name" />
        <button className="btn primary full" disabled={!p2Name.trim()} onClick={onStart}>Start Game</button>
      </section>
    </div>
  );
}

interface PairingCardProps {
  role: Role | null;
  coupleId: string | null;
  couple: Couple | null;
  partner: Profile | null;
  inviteCode: string | null;
  inviteExpiresAt: number | null;
  pairView: 'idle' | 'join';
  joinInput: string;
  joinError: string;
  syncState: 'live' | 'reconnecting';
  busy: boolean;
  onCreate: () => void;
  onStartJoin: () => void;
  onJoinInputChange: (v: string) => void;
  onJoinSubmit: () => void;
  onCopyCode: (code: string) => void;
  onLeave: () => void;
  onCancelJoin: () => void;
}

export function PairingCard({
  coupleId, couple, partner, inviteCode, inviteExpiresAt, pairView, joinInput, joinError, syncState,
  onCreate, onStartJoin, onJoinInputChange, onJoinSubmit, onCopyCode, onLeave, onCancelJoin, busy,
}: PairingCardProps) {
  if (!coupleId) {
    if (pairView === 'join') {
      return (
        <section className="card pairing">
          <div className="card-head"><LinkIcon /><span>Join with a code</span></div>
          <p className="card-sub">Ask your partner for their 6-character invite code.</p>
          <input className="code-input" value={joinInput} maxLength={6} placeholder="ABC123" onChange={(e) => onJoinInputChange(e.target.value.toUpperCase())} />
          {joinError && <p className="error-text">{joinError}</p>}
          <div className="btn-row">
            <button className="btn ghost" onClick={onCancelJoin}>Back</button>
            <button className="btn primary" disabled={busy} onClick={onJoinSubmit}>{busy ? 'Joining…' : 'Join Partner'}</button>
          </div>
        </section>
      );
    }
    return (
      <section className="card pairing">
        <div className="card-head"><LinkIcon /><span>Your space</span></div>
        <p className="card-sub">Not paired yet — create a space or join one with a code.</p>
        <div className="btn-row">
          <button className="btn primary" disabled={busy} onClick={onCreate}>{busy ? 'Creating…' : 'Create Our Space'}</button>
          <button className="btn ghost" onClick={onStartJoin}>I have a code</button>
        </div>
      </section>
    );
  }

  if (!couple) {
    return <section className="card pairing"><div className="card-head"><LinkIcon /><span>Your space</span></div><p className="card-sub">Loading…</p></section>;
  }

  if (couple.status === 'waiting') {
    return (
      <section className="card pairing">
        <div className="card-head"><LinkIcon /><span>Waiting for your partner</span></div>
        {inviteCode && (
          <div className="invite-code" onClick={() => onCopyCode(inviteCode)}>
            {inviteCode.split('').map((c, i) => <span key={i}>{c}</span>)}
          </div>
        )}
        <p className="card-sub">Tap the code to copy it. {inviteExpiresAt ? `Expires in about ${hoursLeft(inviteExpiresAt)}h.` : ''}</p>
        <div className="sync-row"><span className={`sync-dot ${syncState}`} /><span>{syncState === 'live' ? 'Waiting live…' : 'Reconnecting…'}</span></div>
        <button className="btn ghost small" onClick={onLeave}>Cancel</button>
      </section>
    );
  }

  if (couple.status === 'paired') {
    return (
      <section className="card pairing paired">
        <div className="card-head"><LinkIcon /><span>You &amp; {partner?.display_name || 'your partner'}</span></div>
        <p className="card-sub">Paired · shared activities sync between your devices.</p>
        <div className="sync-row"><span className={`sync-dot ${syncState}`} /><span>{syncState === 'live' ? 'Live' : 'Reconnecting…'}</span></div>
        <button className="btn ghost small" onClick={onLeave}>Leave this space</button>
      </section>
    );
  }

  return (
    <section className="card pairing">
      <div className="card-head"><LinkIcon /><span>Partner disconnected</span></div>
      <p className="card-sub">{partner?.display_name || 'Your partner'} left this space.</p>
      <button className="btn primary" onClick={onLeave}>Start a new space</button>
    </section>
  );
}
