import { useEffect, useState } from 'react';
import { SECRET_OPTIONS } from '../../lib/content';
import { addSecretSelection, getMySecretSelections, getSecretMatches, removeSecretSelection } from '../../lib/data';
import { FeatureHeader, PairGate, type ToastFn } from '../Shared';
import { SparkIcon } from '../Icons';

interface Props { coupleId: string | null; userId: string; addToast: ToastFn; unlock: (key: string) => void; onBack: () => void }

export function SecretMatch({ coupleId, userId, addToast, unlock, onBack }: Props) {
  const [mine, setMine] = useState<string[]>([]);
  const [matches, setMatches] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!coupleId) return;
    let cancelled = false;
    (async () => {
      const [mineList, matchList] = await Promise.all([getMySecretSelections(coupleId, userId), getSecretMatches(coupleId)]);
      if (!cancelled) { setMine(mineList); setMatches(matchList); setLoaded(true); }
    })();
    return () => { cancelled = true; };
  }, [coupleId, userId]);

  if (!coupleId) return <PairGate feature="Secret Match" onBack={onBack} />;

  const toggle = async (key: string) => {
    const has = mine.includes(key);
    const nextMine = has ? mine.filter((k) => k !== key) : [...mine, key];
    setMine(nextMine);
    const { error } = has ? await removeSecretSelection(coupleId, userId, key) : await addSecretSelection(coupleId, userId, key);
    if (error) { addToast(`Couldn’t save — ${error}`); setMine(mine); return; }
    const nextMatches = await getSecretMatches(coupleId);
    const wasNewMatch = !has && nextMatches.includes(key) && !matches.includes(key);
    setMatches(nextMatches);
    if (wasNewMatch) { addToast('You have a mutual match!'); unlock('first_secret_match'); }
  };

  const matchDefs = SECRET_OPTIONS.filter((o) => matches.includes(o.key));

  return (
    <div className="screen feature">
      <FeatureHeader title="Secret Match" sub="Choose privately. Only options you both pick are ever revealed." onBack={onBack} />
      {matchDefs.length > 0 && (
        <section className="card eve">
          <div className="card-head accent"><SparkIcon /><span>Mutual matches</span></div>
          {matchDefs.map((m) => <div key={m.key} className="match-chip">{m.label}</div>)}
          <p className="placeholder-note">You both chose these independently — an invitation to talk, not automatic consent.</p>
        </section>
      )}
      <section className="card">
        {!loaded ? <p className="placeholder-note">Loading…</p> : (
          <div className="secret-grid">
            {SECRET_OPTIONS.map((o) => (
              <button key={o.key} className={`secret-option ${mine.includes(o.key) ? 'selected' : ''}`} onClick={() => toggle(o.key)}>{o.label}</button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
