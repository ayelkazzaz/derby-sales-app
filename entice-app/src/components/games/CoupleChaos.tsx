import { useState } from 'react';
import { CHAOS_DECK, FORFEITS } from '../../lib/content';
import { FeatureHeader, GameSetup, type ToastFn } from '../Shared';

interface Props { myName: string; partnerName: string | null; addToast: ToastFn; markGamePlayed: (key: string) => void; onBack: () => void }

export function CoupleChaos({ myName, partnerName, addToast, markGamePlayed, onBack }: Props) {
  const [p2Name, setP2Name] = useState(partnerName || '');
  const [started, setStarted] = useState(false);
  const deck = CHAOS_DECK;
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState<'p1' | 'p2'>('p1');
  const [scoreP1, setScoreP1] = useState(0);
  const [scoreP2, setScoreP2] = useState(0);
  const [status, setStatus] = useState<'playing' | 'won'>('playing');
  const [winner, setWinner] = useState<'p1' | 'p2' | null>(null);
  const [forfeit, setForfeit] = useState<string | null>(null);

  const advance = () => {
    setForfeit(null);
    setIndex((i) => (i + 1) % deck.length);
    setTurn((t) => (t === 'p1' ? 'p2' : 'p1'));
  };
  const award = (who: 'p1' | 'p2') => {
    if (status !== 'playing') return;
    const s1 = who === 'p1' ? scoreP1 + 1 : scoreP1;
    const s2 = who === 'p2' ? scoreP2 + 1 : scoreP2;
    setScoreP1(s1); setScoreP2(s2);
    if (s1 >= 7 || s2 >= 7) {
      setStatus('won');
      setWinner(s1 >= 7 ? 'p1' : 'p2');
      markGamePlayed('chaos');
      addToast(`${s1 >= 7 ? myName : p2Name} wins!`);
    } else {
      advance();
    }
  };
  const restart = () => { setIndex(0); setScoreP1(0); setScoreP2(0); setTurn('p1'); setStatus('playing'); setWinner(null); setForfeit(null); };

  if (!started) return <GameSetup title="Couple Chaos" sub="Fast questions, dares and points — first to seven wins." myName={myName} p2Name={p2Name} onP2Change={setP2Name} onStart={() => setStarted(true)} onBack={onBack} />;

  const card = deck[index];
  const currentName = turn === 'p1' ? myName : p2Name;

  return (
    <div className="screen feature">
      <FeatureHeader title="Couple Chaos" onBack={onBack} />
      <div className="battle-scoreboard">
        <div className={`score-side ${turn === 'p1' ? 'active' : ''}`}><span>{myName}</span><strong>{scoreP1}</strong></div>
        <div className="score-vs">vs</div>
        <div className={`score-side ${turn === 'p2' ? 'active' : ''}`}><span>{p2Name}</span><strong>{scoreP2}</strong></div>
      </div>
      {status === 'won' ? (
        <section className="card"><h3>{winner === 'p1' ? myName : p2Name} wins!</h3><button className="btn primary" onClick={restart}>Play again</button></section>
      ) : (
        <>
          <section className="card deck-card-display">
            <p className="deck-category">{card.cat}</p>
            <p className="deck-text">{card.text}</p>
            <p className="turn-label">{currentName}’s turn</p>
          </section>
          <div className="btn-row">
            <button className="btn primary" onClick={() => award(turn)}>Point to {currentName}</button>
            <button className="btn ghost" onClick={advance}>Pass</button>
          </div>
          <button className="btn ghost small" onClick={() => setForfeit(FORFEITS[Math.floor(Math.random() * FORFEITS.length)])}>Random forfeit instead</button>
          {forfeit && <p className="placeholder-note">Forfeit: {forfeit}</p>}
        </>
      )}
    </div>
  );
}
