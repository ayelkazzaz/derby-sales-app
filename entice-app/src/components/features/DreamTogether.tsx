import { useEffect, useState } from 'react';
import { DREAM_CATEGORIES, DREAM_STATUSES } from '../../lib/content';
import { addDream, listDreams, removeDream, updateDreamStatus, type DreamRow } from '../../lib/data';
import { FeatureHeader, type ToastFn } from '../Shared';

interface Props { coupleId: string | null; userId: string; addToast: ToastFn; unlock: (key: string) => void; onBack: () => void }

export function DreamTogether({ coupleId, userId, addToast, unlock, onBack }: Props) {
  const [dreams, setDreams] = useState<DreamRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(DREAM_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [firstStep, setFirstStep] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const refresh = async () => { if (coupleId) setDreams(await listDreams(coupleId)); };
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [coupleId]);

  const add = async () => {
    if (!title.trim() || !coupleId) return;
    const wasEmpty = dreams.length === 0;
    const { error } = await addDream(coupleId, userId, { title: title.trim(), category, description, first_step: firstStep });
    if (error) { addToast(`Couldn’t save — ${error}`); return; }
    setTitle(''); setDescription(''); setFirstStep(''); setShowForm(false);
    await refresh();
    addToast('Dream added.');
    if (wasEmpty) unlock('first_dream');
  };
  const setStatus = async (id: string, status: string) => {
    const { error } = await updateDreamStatus(id, status);
    if (error) { addToast(`Couldn’t save — ${error}`); return; }
    await refresh();
  };
  const remove = async (id: string) => {
    const { error } = await removeDream(id);
    if (error) { addToast(`Couldn’t remove — ${error}`); return; }
    await refresh();
    addToast('Removed.');
  };
  const list = dreams.filter((d) => filterStatus === 'all' || d.status === filterStatus);

  return (
    <div className="screen feature">
      <FeatureHeader title="Dream Together" sub="Turn shared hopes into a plan with a first step." onBack={onBack} />
      {!coupleId && <p className="placeholder-note">Pair up to save dreams to your shared space.</p>}
      {coupleId && (
        <>
          <section className="card">
            <div className="filter-row">{['all', ...DREAM_STATUSES].map((s) => <button key={s} className={`filter-chip ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>{s === 'all' ? 'All' : s}</button>)}</div>
          </section>
          {list.length === 0 && <p className="placeholder-note">No dreams here yet.</p>}
          {list.map((d) => (
            <section key={d.id} className="card">
              <div className="card-head"><span>{d.category}</span></div>
              <h3>{d.title}</h3>
              {d.description && <p className="card-sub">{d.description}</p>}
              {d.first_step && <p className="reflect-line">First step: {d.first_step}</p>}
              <div className="filter-row">{DREAM_STATUSES.map((s) => <button key={s} className={`filter-chip small ${d.status === s ? 'active' : ''}`} onClick={() => setStatus(d.id, s)}>{s}</button>)}</div>
              <button className="btn ghost small" onClick={() => remove(d.id)}>Remove</button>
            </section>
          ))}
          {showForm ? (
            <section className="card">
              <label className="repair-label">Title</label>
              <input className="name-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Move somewhere new" />
              <label className="repair-label">Category</label>
              <div className="filter-row">{DREAM_CATEGORIES.map((c) => <button key={c} className={`filter-chip small ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</button>)}</div>
              <label className="repair-label">Why it matters</label>
              <textarea className="repair-field" value={description} onChange={(e) => setDescription(e.target.value)} />
              <label className="repair-label">First small step</label>
              <input className="name-input" value={firstStep} onChange={(e) => setFirstStep(e.target.value)} placeholder="e.g. Research neighborhoods" />
              <div className="btn-row">
                <button className="btn primary" disabled={!title.trim()} onClick={add}>Add dream</button>
                <button className="btn ghost" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </section>
          ) : (
            <button className="btn primary full" onClick={() => setShowForm(true)}>Add a dream</button>
          )}
        </>
      )}
    </div>
  );
}
