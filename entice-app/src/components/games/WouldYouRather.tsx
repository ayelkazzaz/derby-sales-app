import { useState } from 'react';
import { WYR_DECK } from '../../lib/content';
import { FeatureHeader, GameSetup } from '../Shared';

interface Props { myName: string; partnerName: string | null; markGamePlayed: (key: string) => void; onBack: () => void }

export function WouldYouRather({ myName, partnerName, markGamePlayed, onBack }: Props) {
  const [p2Name, setP2Name] = useState(partnerName || '');
  const [started, setStarted] = useState(false);
  const deck = WYR_DECK;
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<'p1' | 'p2' | 'reveal' | 'done'>('p1');
  const [p1c, setP1c] = useState<'a' | 'b' | null>(null);
  const [p2c, setP2c] = useState<'a' | 'b' | null>(null);
  const [matches, setMatches] = useState(0);

  if (!started) return <GameSetup title="Would You Rather" sub="Choose privately, reveal together." myName={myName} p2Name={p2Name} onP2Change={setP2Name} onStart={() => setStarted(true)} onBack={onBack} />;

  const card = deck[index];
  const choose = (who: 'p1' | 'p2', val: 'a' | 'b') => { if (who === 'p1') { setP1c(val); setStage('p2'); } else { setP2c(val); setStage('reveal'); } };
  const next = () => {
    if (p1c === p2c) setMatches((m) => m + 1);
    if (index + 1 >= deck.length) { markGamePlayed('wyr'); setStage('done'); return; }
    setIndex((i) => i + 1); setP1c(null); setP2c(null); setStage('p1');
  };

  if (stage === 'done') {
    return (
      <div className="screen feature">
        <FeatureHeader title="Would You Rather" onBack={onBack} />
        <section className="card"><h3>{matches} of {deck.length} matched</h3><p className="card-sub">{matches === deck.length ? 'Perfectly in sync tonight.' : 'Worth talking through the ones you didn’t match on.'}</p></section>
      </div>
    );
  }

  return (
    <div className="screen feature">
      <FeatureHeader title="Would You Rather" onBack={onBack} />
      <section className="card deck-card-display">
        <p className="deck-category">{card.cat}</p>
        {stage === 'reveal' ? (
          <>
            <div className="reveal-row"><span>{myName}</span><strong>{p1c === 'a' ? card.a : card.b}</strong></div>
            <div className="reveal-row"><span>{p2Name}</span><strong>{p2c === 'a' ? card.a : card.b}</strong></div>
            <p className={p1c === p2c ? 'match-badge' : 'nomatch-badge'}>{p1c === p2c ? 'You matched!' : 'Different picks'}</p>
            <button className="btn primary" onClick={next}>Next</button>
          </>
        ) : (
          <>
            <p className="turn-label">{stage === 'p1' ? myName : p2Name}, choose privately{stage === 'p1' ? ' then hand over the phone' : ''}</p>
            <div className="btn-row">
              <button className="btn primary" onClick={() => choose(stage, 'a')}>{card.a}</button>
              <button className="btn primary" onClick={() => choose(stage, 'b')}>{card.b}</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
