import { useEffect, useRef, useState } from 'react';
import { ENTICEUS_DECK } from '../../lib/content';
import { completeEntice, listEnticeProgress, saveEntice, type ProgressRow } from '../../lib/data';
import { FeatureHeader, type ToastFn } from '../Shared';
import { SparkIcon } from '../Icons';

interface Props { coupleId: string | null; addToast: ToastFn; onBack: () => void }

export function EnticeUs({ coupleId, addToast, onBack }: Props) {
  const [filterTime, setFilterTime] = useState('any');
  const [filterEnergy, setFilterEnergy] = useState('any');
  const [filterBudget, setFilterBudget] = useState('any');
  const [current, setCurrent] = useState<typeof ENTICEUS_DECK[number] | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!coupleId) { setProgress([]); return; }
    let cancelled = false;
    listEnticeProgress(coupleId).then((rows) => { if (!cancelled) setProgress(rows); });
    return () => { cancelled = true; };
  }, [coupleId]);

  const pool = ENTICEUS_DECK.filter((c) => (filterTime === 'any' || c.time === filterTime) && (filterEnergy === 'any' || c.energy === filterEnergy) && (filterBudget === 'any' || c.budget === filterBudget));
  const spin = () => {
    if (pool.length === 0) { addToast('Nothing matches — widen your filters.'); return; }
    setCurrent(pool[Math.floor(Math.random() * pool.length)]);
  };
  useEffect(() => { if (!startedRef.current) { startedRef.current = true; spin(); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const accept = async () => {
    if (!current) return;
    if (coupleId) {
      const { error } = await saveEntice(coupleId, current.id);
      if (error) { addToast(`Couldn’t save — ${error}`); return; }
      setProgress(await listEnticeProgress(coupleId));
    }
    addToast('Added to your plans.');
  };
  const complete = async () => {
    if (!current) return;
    if (coupleId) {
      const { error } = await completeEntice(coupleId, current.id);
      if (error) { addToast(`Couldn’t save — ${error}`); return; }
      setProgress(await listEnticeProgress(coupleId));
    }
    addToast('Logged — hope it was good.');
    setCurrent(null);
  };

  const saved = progress.filter((p) => p.status === 'saved');
  const completed = progress.filter((p) => p.status === 'completed');

  return (
    <div className="screen feature">
      <FeatureHeader title="Entice Us" sub="A surprise, matched to your time, energy and budget." onBack={onBack} />
      <section className="card">
        <p className="section-label">Time</p>
        <div className="filter-row">{['any', '15', '30', '45', '60'].map((t) => <button key={t} className={`filter-chip ${filterTime === t ? 'active' : ''}`} onClick={() => setFilterTime(t)}>{t === 'any' ? 'Any' : `${t}m`}</button>)}</div>
        <p className="section-label">Energy</p>
        <div className="filter-row">{['any', 'low', 'medium', 'high'].map((e) => <button key={e} className={`filter-chip ${filterEnergy === e ? 'active' : ''}`} onClick={() => setFilterEnergy(e)}>{e === 'any' ? 'Any' : e[0].toUpperCase() + e.slice(1)}</button>)}</div>
        <p className="section-label">Budget</p>
        <div className="filter-row">{['any', 'free', 'low', 'medium'].map((b) => <button key={b} className={`filter-chip ${filterBudget === b ? 'active' : ''}`} onClick={() => setFilterBudget(b)}>{b === 'any' ? 'Any' : b[0].toUpperCase() + b.slice(1)}</button>)}</div>
        <button className="btn primary full" onClick={spin}>Spin again</button>
      </section>
      {current && (
        <section className="card eve">
          <div className="card-head accent"><SparkIcon /><span>Tonight’s surprise</span></div>
          <p className="card-sub">{current.text}</p>
          <p className="placeholder-note">{current.time} min · {current.energy} energy · {current.budget} budget</p>
          <div className="btn-row">
            <button className="btn primary" onClick={complete}>We did it</button>
            <button className="btn ghost" onClick={accept}>Save for later</button>
            <button className="btn ghost" onClick={spin}>Spin again</button>
          </div>
        </section>
      )}
      {(saved.length > 0 || completed.length > 0) && (
        <section className="card">
          {saved.length > 0 && <><p className="section-label">Saved for later</p>{saved.slice(0, 3).map((s) => <p key={s.mission_id + s.updated_at} className="reflect-line">{ENTICEUS_DECK.find((d) => d.id === s.mission_id)?.text}</p>)}</>}
          {completed.length > 0 && <><p className="section-label">Done together ({completed.length})</p>{completed.slice(0, 3).map((c) => <p key={c.mission_id + c.updated_at} className="reflect-line">{ENTICEUS_DECK.find((d) => d.id === c.mission_id)?.text}</p>)}</>}
        </section>
      )}
    </div>
  );
}
