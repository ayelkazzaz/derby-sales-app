import { useEffect, useRef, useState } from 'react';
import { DNA_DIMENSIONS, combinedTheme } from '../../lib/content';
import { getDnaView, getMyDna, upsertMyDna, type DnaAnswers, type DnaViewRow } from '../../lib/data';
import { FeatureHeader, PairGate, type ToastFn } from '../Shared';

interface Props { coupleId: string | null; userId: string; addToast: ToastFn; unlock: (key: string) => void; onBack: () => void }

export function CoupleDNA({ coupleId, userId, addToast, unlock, onBack }: Props) {
  const [mine, setMine] = useState<DnaAnswers>({});
  const [view, setView] = useState<DnaViewRow[]>([]);
  const [dreamDraft, setDreamDraft] = useState('');
  const initedRef = useRef(false);

  const load = async () => {
    if (!coupleId) return;
    const [m, v] = await Promise.all([getMyDna(coupleId, userId), getDnaView(coupleId)]);
    setMine(m);
    setView(v);
    if (!initedRef.current) { setDreamDraft(m.dream || ''); initedRef.current = true; }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [coupleId, userId]);

  if (!coupleId) return <PairGate feature="Couple DNA" onBack={onBack} />;

  const setAnswer = async (dimKey: string, val: string) => {
    const nextMine = { ...mine, [dimKey]: val };
    setMine(nextMine);
    const { error } = await upsertMyDna(coupleId, userId, { [dimKey]: val } as DnaAnswers);
    if (error) { addToast(`Couldn’t save — ${error}`); return; }
    const nextView = await getDnaView(coupleId);
    setView(nextView);
    const allDims = ['connection', 'stress', 'conflict', 'play', 'desire'];
    const complete = allDims.every((d) => nextView.find((r) => r.dimension === d)?.my_value && nextView.find((r) => r.dimension === d)?.partner_value);
    if (complete) { unlock('dna_complete'); addToast('Your Couple DNA is fully mapped.'); }
  };
  const saveDream = async () => {
    const { error } = await upsertMyDna(coupleId, userId, { dream: dreamDraft });
    if (error) { addToast(`Couldn’t save — ${error}`); return; }
    addToast('Saved.');
  };

  const viewFor = (key: string) => view.find((r) => r.dimension === key);

  return (
    <div className="screen feature">
      <FeatureHeader title="Couple DNA" sub="Private answers — only safe combined themes are ever shown." onBack={onBack} />
      {DNA_DIMENSIONS.map((dim) => {
        const row = viewFor(dim.key);
        return (
          <section key={dim.key} className="card dna-dim">
            <p className="card-sub">{dim.prompt}</p>
            <div className="dna-options">
              {dim.options.map((o) => <button key={o.v} className={`dna-option ${mine[dim.key as keyof DnaAnswers] === o.v ? 'selected' : ''}`} onClick={() => setAnswer(dim.key, o.v)}>{o.l}</button>)}
            </div>
            {row && combinedTheme(dim, row.my_value, row.partner_value) && <p className="dna-theme">{combinedTheme(dim, row.my_value, row.partner_value)}</p>}
          </section>
        );
      })}
      <section className="card">
        <p className="card-sub">One dream you hope to build together (private until you choose to share it):</p>
        <textarea className="repair-field" value={dreamDraft} onChange={(e) => setDreamDraft(e.target.value)} onBlur={saveDream} placeholder="Write freely…" />
      </section>
    </div>
  );
}
