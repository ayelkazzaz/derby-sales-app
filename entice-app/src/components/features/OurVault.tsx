import { useEffect, useState } from 'react';
import { VAULT_TYPES } from '../../lib/content';
import { addVaultItem, listVaultItems, removeVaultItem, type VaultItemRow } from '../../lib/data';
import { FeatureHeader, type ToastFn } from '../Shared';

interface Props { coupleId: string | null; userId: string; addToast: ToastFn; unlock: (key: string) => void; onBack: () => void }

export function OurVault({ coupleId, userId, addToast, unlock, onBack }: Props) {
  const [items, setItems] = useState<VaultItemRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState(VAULT_TYPES[0]);
  const [privacy, setPrivacy] = useState<'shared' | 'private'>('shared');
  const [filterType, setFilterType] = useState('all');

  const refresh = async () => { if (coupleId) setItems(await listVaultItems(coupleId)); };
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [coupleId]);

  const add = async () => {
    if (!title.trim() || !coupleId) return;
    const wasEmpty = items.length === 0;
    const appreciationCount = items.filter((i) => i.type === 'Appreciation').length + (type === 'Appreciation' ? 1 : 0);
    const { error } = await addVaultItem(coupleId, userId, { title: title.trim(), body, type, visibility: privacy });
    if (error) { addToast(`Couldn’t save — ${error}`); return; }
    setTitle(''); setBody(''); setShowForm(false);
    await refresh();
    addToast('Saved to your Vault.');
    if (wasEmpty) unlock('first_memory');
    if (appreciationCount >= 10) unlock('ten_appreciations');
  };
  const remove = async (id: string) => {
    const { error } = await removeVaultItem(id);
    if (error) { addToast(`Couldn’t remove — ${error}`); return; }
    await refresh();
    addToast('Removed.');
  };
  const visibleList = items.filter((i) => filterType === 'all' || i.type === filterType);

  return (
    <div className="screen feature">
      <FeatureHeader title="Our Vault" sub="Memories, appreciations and milestones worth keeping." onBack={onBack} />
      {!coupleId && <p className="placeholder-note">Pair up to save to your shared Vault.</p>}
      {coupleId && (
        <>
          <section className="card">
            <div className="filter-row">{['all', ...VAULT_TYPES].map((t) => <button key={t} className={`filter-chip ${filterType === t ? 'active' : ''}`} onClick={() => setFilterType(t)}>{t === 'all' ? 'All' : t}</button>)}</div>
          </section>
          {visibleList.length === 0 && <p className="placeholder-note">Nothing saved yet.</p>}
          {visibleList.map((i) => (
            <section key={i.id} className="card">
              <div className="card-head"><span>{i.type}{i.visibility === 'private' ? ' · private' : ''}</span></div>
              <h3>{i.title}</h3>
              {i.body && <p className="card-sub">{i.body}</p>}
              {i.created_by === userId && <button className="btn ghost small" onClick={() => remove(i.id)}>Remove</button>}
            </section>
          ))}
          {showForm ? (
            <section className="card">
              <label className="repair-label">Title</label>
              <input className="name-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Our first road trip" />
              <label className="repair-label">Type</label>
              <div className="filter-row">{VAULT_TYPES.map((t) => <button key={t} className={`filter-chip small ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>{t}</button>)}</div>
              <label className="repair-label">Details</label>
              <textarea className="repair-field" value={body} onChange={(e) => setBody(e.target.value)} />
              <label className="share-row"><input type="checkbox" checked={privacy === 'private'} onChange={(e) => setPrivacy(e.target.checked ? 'private' : 'shared')} /> Keep this private (only you can see it)</label>
              <div className="btn-row">
                <button className="btn primary" disabled={!title.trim()} onClick={add}>Save</button>
                <button className="btn ghost" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </section>
          ) : (
            <button className="btn primary full" onClick={() => setShowForm(true)}>Add to Vault</button>
          )}
        </>
      )}
    </div>
  );
}
