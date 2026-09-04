import { useState } from 'react';
import { GUESS_DECK } from '../../lib/content';
import { FeatureHeader, GameSetup } from '../Shared';

interface Props { myName: string; partnerName: string | null; markGamePlayed: (key: string) => void; onBack: () => void }

export function GuessMe({ myName, partnerName, markGamePlayed, onBack }: Props) {
  const [p2Name, setP2Name] = useState(partnerName || '');
  const [started, setStarted] = useState(false);
  const deck = GUESS_DECK;
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<'guess' | 'reveal' | 'score' | 'done'>('guess');
  const [guess, setGuess] = useState('');
  const [reveal, setReveal] = useState('');
  const [score, setScore] = useState(0);

  if (!started) return <GameSetup title="Guess Me" sub="How well do you really know each other?" myName={myName} p2Name={p2Name} onP2Change={setP2Name} onStart={() => setStarted(true)} onBack={onBack} />;

  const subjectIsMe = index % 2 === 1;
  const subject = subjectIsMe ? myName : p2Name;
  const guesser = subjectIsMe ? p2Name : myName;

  const mark = (correct: boolean) => {
    if (correct) setScore((s) => s + 1);
    if (index + 1 >= deck.length) { markGamePlayed('guessme'); setStage('done'); return; }
    setIndex((i) => i + 1); setStage('guess'); setGuess(''); setReveal('');
  };

  if (stage === 'done') {
    return (
      <div className="screen feature">
        <FeatureHeader title="Guess Me" onBack={onBack} />
        <section className="card"><h3>{score} of {deck.length} correct</h3></section>
      </div>
    );
  }

  return (
    <div className="screen feature">
      <FeatureHeader title="Guess Me" onBack={onBack} />
      <section className="card deck-card-display">
        <p className="deck-category">About {subject}</p>
        <p className="deck-text">{deck[index].q}</p>
        {stage === 'guess' && (
          <>
            <p className="turn-label">{guesser}, take your best guess</p>
            <textarea className="repair-field" value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="Your guess…" />
            <button className="btn primary" disabled={!guess.trim()} onClick={() => setStage('reveal')}>Lock it in</button>
          </>
        )}
        {stage === 'reveal' && (
          <>
            <p className="turn-label">{subject}, what’s the real answer?</p>
            <textarea className="repair-field" value={reveal} onChange={(e) => setReveal(e.target.value)} placeholder="The real answer…" />
            <button className="btn primary" disabled={!reveal.trim()} onClick={() => setStage('score')}>Reveal</button>
          </>
        )}
        {stage === 'score' && (
          <>
            <p className="reflect-line">Guess: {guess}</p>
            <p className="reflect-line">Real answer: {reveal}</p>
            <div className="btn-row">
              <button className="btn primary" onClick={() => mark(true)}>Nailed it</button>
              <button className="btn ghost" onClick={() => mark(false)}>Not quite</button>
            </div>
          </>
        )}
      </section>
      <p className="card-sub">Score: {score}</p>
    </div>
  );
}
