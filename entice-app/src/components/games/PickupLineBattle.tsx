import { useState } from 'react';
import { PICKUP_LINES } from '../../lib/content';
import { FeatureHeader, GameSetup } from '../Shared';

interface Props { myName: string; partnerName: string | null; markGamePlayed: (key: string) => void; onBack: () => void }

export function PickupLineBattle({ myName, partnerName, markGamePlayed, onBack }: Props) {
  const [p2Name, setP2Name] = useState(partnerName || '');
  const [started, setStarted] = useState(false);
  const deck = PICKUP_LINES;
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState<'p1' | 'p2'>('p1');
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [done, setDone] = useState(false);

  const rate = (stars: number) => {
    if (turn === 'p1') setScoreP1((s) => s + stars); else setScoreP2((s) => s + stars);
    if (index + 1 >= deck.length) { setDone(true); markGamePlayed('pickup'); }
    else { setIndex((i) => i + 1); setTurn((t) => (t === 'p1' ? 'p2' : 'p1')); }
  };

  if (!started) return <GameSetup title="Pickup-Line Battle" sub="Deliver the line, your partner scores the charm." myName={myName} p2Name={p2Name} onP2Change={setP2Name} onStart={() => setStarted(true)} onBack={onBack} />;

  if (done) {
    const winner = scoreP1 >= scoreP2 ? myName : p2Name;
    return (
      <div className="screen feature">
        <FeatureHeader title="Pickup-Line Battle" onBack={onBack} />
        <section className="card"><h3>{winner} wins on charm!</h3><p className="card-sub">{myName}: {scoreP1} · {p2Name}: {scoreP2}</p></section>
      </div>
    );
  }

  const performer = turn === 'p1' ? myName : p2Name;
  return (
    <div className="screen feature">
      <FeatureHeader title="Pickup-Line Battle" onBack={onBack} />
      <section className="card deck-card-display">
        <p className="deck-category">Line {index + 1} of {deck.length}</p>
        <p className="deck-text">“{deck[index]}”</p>
        <p className="turn-label">{performer} delivers it</p>
      </section>
      <p className="card-sub">Rate the delivery (charm points):</p>
      <div className="star-row">{[1, 2, 3, 4, 5].map((n) => <button key={n} className="star-btn" onClick={() => rate(n)}>{n}</button>)}</div>
    </div>
  );
}
