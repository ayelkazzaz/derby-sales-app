import { FEATURES, MOODS, RECS } from '../lib/content';
import { getGreeting } from '../lib/helpers';
import { FeatureRow, PairingCard } from './Shared';
import { SparkIcon } from './Icons';
import type { MoodKey } from '../lib/content';
import type { ComponentProps } from 'react';

interface Props {
  name: string;
  ownMood: MoodKey | null;
  partnerMood: MoodKey | null;
  partnerName: string | null;
  onSelectMood: (key: MoodKey) => void;
  onOpen: (key: string) => void;
  pairingProps: ComponentProps<typeof PairingCard>;
}

export function TonightScreen({ name, ownMood, partnerMood, partnerName, onSelectMood, onOpen, pairingProps }: Props) {
  const rec = (ownMood && RECS[ownMood]) || RECS.default;
  return (
    <div className="screen tonight">
      <div className="greeting-block">
        <h1>{getGreeting()}, {name}</h1>
        <p className="tagline">Come closer, differently.</p>
      </div>
      <section className="mood-block">
        <p className="section-label">How are you feeling?</p>
        <div className="mood-row">
          {MOODS.map((m) => <button key={m.key} className={`mood-pill mood-${m.key} ${ownMood === m.key ? 'active' : ''}`} onClick={() => onSelectMood(m.key)} title={m.hint}>{m.label}</button>)}
        </div>
        {partnerMood && <p className="partner-mood">{partnerName || 'Your partner'} feels {MOODS.find((m) => m.key === partnerMood)?.label.toLowerCase()}.</p>}
      </section>
      <PairingCard {...pairingProps} />
      <section className="card eve">
        <div className="card-head accent"><SparkIcon /><span>EVE suggests</span></div>
        <h3>{rec.title}</h3>
        <p className="card-sub">{rec.body}</p>
        <div className="btn-row">
          <button className="btn primary" onClick={() => onOpen('chaos')}>See what’s ready</button>
          <button className="btn ghost" onClick={() => onOpen('cat:spark')}>More like this</button>
        </div>
      </section>
      <section className="explore-block">
        <p className="section-label">Explore</p>
        <div className="feature-list">
          {FEATURES.map((f) => <FeatureRow key={f.key} f={f} status={f.requiresPairing && !pairingProps.coupleId ? 'Pair first' : 'Open'} onOpen={onOpen} />)}
        </div>
      </section>
    </div>
  );
}
