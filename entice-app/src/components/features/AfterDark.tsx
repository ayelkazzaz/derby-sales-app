import { useEffect, useState } from 'react';
import { AFTERDARK_DECK } from '../../lib/content';
import { getConsent, type ConsentRow } from '../../lib/data';
import { FeatureHeader } from '../Shared';

interface Props { coupleId: string | null; myName: string; partnerName: string | null; onGoConsent: () => void; onBack: () => void }

export function AfterDark({ coupleId, myName, partnerName, onGoConsent, onBack }: Props) {
  const [consent, setConsent] = useState<Omit<ConsentRow, 'couple_id'>>({ spicy: false, bold: false, after_dark_confirmed_a: false, after_dark_confirmed_b: false });
  const [confirmed1, setConfirmed1] = useState(false);
  const [confirmed2, setConfirmed2] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!coupleId) return;
    let cancelled = false;
    getConsent(coupleId).then((c) => { if (!cancelled) setConsent(c); });
    return () => { cancelled = true; };
  }, [coupleId]);

  const afterDarkEnabled = consent.after_dark_confirmed_a && consent.after_dark_confirmed_b;

  if (!afterDarkEnabled) {
    return (
      <div className="screen feature">
        <FeatureHeader title="After Dark" onBack={onBack} />
        <section className="card">
          <p className="card-sub">After Dark is off. Both of you need to opt in from Consent Center first.</p>
          <button className="btn primary" onClick={onGoConsent}>Go to Consent Center</button>
        </section>
      </div>
    );
  }

  if (stopped) {
    return (
      <div className="screen feature">
        <FeatureHeader title="After Dark" onBack={onBack} />
        <section className="card"><p className="card-sub">No problem — come back whenever you’re both ready.</p></section>
      </div>
    );
  }

  if (!confirmed1 || !confirmed2) {
    return (
      <div className="screen feature">
        <FeatureHeader title="After Dark" sub="For consenting adults only. Both of you need to confirm before anything shows." onBack={onBack} />
        <section className="card">
          <label className="share-row"><input type="checkbox" checked={confirmed1} onChange={(e) => setConfirmed1(e.target.checked)} /> {myName || 'Player 1'} is 18+ and wants to participate</label>
          <label className="share-row"><input type="checkbox" checked={confirmed2} onChange={(e) => setConfirmed2(e.target.checked)} /> {partnerName || 'Player 2'} is 18+ and wants to participate</label>
          <button className="btn ghost small" onClick={() => setStopped(true)}>Not tonight</button>
        </section>
      </div>
    );
  }

  const filtered = AFTERDARK_DECK.filter((c) => c.tier === 'warm' || c.tier === 'playful' || (c.tier === 'spicy' && consent.spicy) || (c.tier === 'bold' && consent.bold));
  const card = filtered[index % filtered.length];

  return (
    <div className="screen feature">
      <FeatureHeader title="After Dark" onBack={onBack} />
      <section className="card deck-card-display">
        <p className="deck-category">{card.category} · {card.tier}</p>
        <p className="deck-text">{card.text}</p>
      </section>
      <div className="btn-row">
        <button className="btn primary" onClick={() => setIndex((i) => i + 1)}>Next card</button>
        <button className="btn ghost" onClick={() => { setConfirmed1(false); setConfirmed2(false); setStopped(true); }}>Stop</button>
      </div>
      <p className="placeholder-note">Showing {consent.bold ? 'warm through bold' : consent.spicy ? 'warm through spicy' : 'warm & playful'} tiers, based on your Consent Center settings.</p>
    </div>
  );
}
