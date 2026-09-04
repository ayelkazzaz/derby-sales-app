import { useEffect, useState } from 'react';
import { CHALLENGE_DECK } from '../../lib/content';
import { completeChallenge, listChallengeProgress, saveChallenge, type ProgressRow } from '../../lib/data';
import { FeatureHeader, type ToastFn } from '../Shared';
import { SparkIcon } from '../Icons';

interface Props { coupleId: string | null; addToast: ToastFn; onBack: () => void }

export function ChallengeDeck({ coupleId, addToast, onBack }: Props) {
  const [filterTime, setFilterTime] = useState('any');
  const [filterEnergy, setFilterEnergy] = useState('any');
  const [current, setCurrent] = useState<typeof CHALLENGE_DECK[number] | null>(null);
  const [reflection, setReflection] = useState('');
  const [progress, setProgress] = useState<ProgressRow[]>([]);

  useEffect(() => {
    if (!coupleId) { setProgress([]); return; }
    let cancelled = false;
    listChallengeProgress(coupleId).then((rows) => { if (!cancelled) setProgress(rows); });
    return () => { cancelled = true; };
  }, [coupleId]);

  const pool = CHALLENGE_DECK.filter((c) => (filterTime === 'any' || c.time === filterTime) && (filterEnergy === 'any' || c.energy === filterEnergy));
  const draw = () => {
    if (pool.length === 0) { addToast('No missions match those filters — try widening them.'); return; }
    setCurrent(pool[Math.floor(Math.random() * pool.length)]);
    setReflection('');
  };
  const complete = async () => {
    if (!current) return;
    if (coupleId) {
      const { error } = await completeChallenge(coupleId, current.id, reflection);
      if (error) { addToast(`Couldn’t save — ${error}`); return; }
      setProgress(await listChallengeProgress(coupleId));
    }
    addToast('Marked complete — nice.');
    setCurrent(null);
  };
  const saveForLater = async () => {
    if (!current) return;
    if (coupleId) {
      const { error } = await saveChallenge(coupleId, current.id);
      if (error) { addToast(`Couldn’t save — ${error}`); return; }
      setProgress(await listChallengeProgress(coupleId));
    }
    addToast('Saved for later.');
  };

  const completed = progress.filter((p) => p.status === 'completed');

  return (
    <div className="screen feature">
      <FeatureHeader title="Challenge Deck" sub="Quick, romantic and adventurous missions, filtered to fit tonight." onBack={onBack} />
      <section className="card">
        <p className="section-label">Time</p>
        <div className="filter-row">{['any', '15', '30', '60'].map((t) => <button key={t} className={`filter-chip ${filterTime === t ? 'active' : ''}`} onClick={() => setFilterTime(t)}>{t === 'any' ? 'Any' : `${t} min`}</button>)}</div>
        <p className="section-label">Energy</p>
        <div className="filter-row">{['any', 'low', 'medium', 'high'].map((e) => <button key={e} className={`filter-chip ${filterEnergy === e ? 'active' : ''}`} onClick={() => setFilterEnergy(e)}>{e === 'any' ? 'Any' : e[0].toUpperCase() + e.slice(1)}</button>)}</div>
        <button className="btn primary full" onClick={draw}>Draw a mission</button>
      </section>
      {current && (
        <section className="card eve">
          <div className="card-head accent"><SparkIcon /><span>{current.category}</span></div>
          <h3>{current.title}</h3>
          <p className="card-sub">{current.body}</p>
          <p className="placeholder-note">{current.time} min · {current.energy} energy · {current.budget} budget</p>
          <textarea className="repair-field" value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="Reflection, once you've done it (optional)" />
          <div className="btn-row">
            <button className="btn primary" onClick={complete}>Mark complete</button>
            <button className="btn ghost" onClick={saveForLater}>Save for later</button>
            <button className="btn ghost" onClick={draw}>Replace</button>
          </div>
        </section>
      )}
      {completed.length > 0 && (
        <section className="card">
          <p className="section-label">Completed ({completed.length})</p>
          {completed.slice(0, 3).map((c) => <p key={c.mission_id + c.updated_at} className="reflect-line">{CHALLENGE_DECK.find((d) => d.id === c.mission_id)?.title || c.mission_id}</p>)}
        </section>
      )}
      {!coupleId && <p className="placeholder-note">Pair up to keep your saved and completed missions.</p>}
    </div>
  );
}
