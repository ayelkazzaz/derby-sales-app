import { useEffect, useState } from 'react';
import { DAILY_POOL } from '../../lib/content';
import { dailyIndex, todayStr, yesterdayStr } from '../../lib/helpers';
import { getDailyProgress, setDailyProgress, type DailyProgress } from '../../lib/data';
import { FeatureHeader, type ToastFn } from '../Shared';
import { SparkIcon } from '../Icons';

interface Props { coupleId: string | null; addToast: ToastFn; unlock: (key: string) => void; onBack: () => void }

export function DailyEntice({ coupleId, addToast, unlock, onBack }: Props) {
  const idx = dailyIndex(DAILY_POOL.length);
  const today = DAILY_POOL[idx];
  const [state, setState] = useState<DailyProgress>({ last_date: null, streak: 0 });

  useEffect(() => {
    if (!coupleId) { setState({ last_date: null, streak: 0 }); return; }
    let cancelled = false;
    getDailyProgress(coupleId).then((d) => { if (!cancelled) setState(d); });
    return () => { cancelled = true; };
  }, [coupleId]);

  const doneToday = state.last_date === todayStr();

  const complete = async () => {
    if (doneToday) return;
    const streak = state.last_date === yesterdayStr() ? state.streak + 1 : 1;
    const next = { last_date: todayStr(), streak };
    setState(next);
    if (coupleId) {
      const { error } = await setDailyProgress(coupleId, next);
      if (error) { addToast(`Couldn’t save — ${error}`); return; }
    }
    addToast('Marked done for today.');
    if (streak >= 3) unlock('three_day_streak');
  };

  return (
    <div className="screen feature">
      <FeatureHeader title="Daily Entice" sub="One small connection ritual, chosen for today." onBack={onBack} />
      <section className="card eve">
        <div className="card-head accent"><SparkIcon /><span>{today.title}</span></div>
        <p className="card-sub">{today.body}</p>
        <button className="btn primary" disabled={doneToday} onClick={complete}>{doneToday ? 'Done for today' : 'Mark done'}</button>
      </section>
      <p className="placeholder-note">Current streak: {state.streak || 0} day{state.streak === 1 ? '' : 's'}.</p>
      {!coupleId && <p className="placeholder-note">Pair up to keep your streak saved across devices.</p>}
    </div>
  );
}
