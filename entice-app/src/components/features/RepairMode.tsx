import { useEffect, useState } from 'react';
import { REPAIR_ACTIONS } from '../../lib/content';
import {
  createRepairSession, getLatestRepairSession, getRepairReflection, saveMyRepairEntry,
  setRepairAction, setRepairFollowUp, type RepairEntryDraft, type RepairReflectionRow, type RepairSession,
} from '../../lib/data';
import { FeatureHeader, PairGate, type ToastFn } from '../Shared';

interface Props { coupleId: string | null; userId: string; partnerName: string | null; addToast: ToastFn; unlock: (key: string) => void; onBack: () => void }

const blankDraft: RepairEntryDraft = { what: '', felt: '', needed: '', share_what: false, share_felt: false, share_needed: false };

export function RepairMode({ coupleId, userId, partnerName, addToast, unlock, onBack }: Props) {
  const [session, setSession] = useState<RepairSession | null>(null);
  const [reflection, setReflection] = useState<RepairReflectionRow[]>([]);
  const [draft, setDraft] = useState<RepairEntryDraft>(blankDraft);
  const [loaded, setLoaded] = useState(false);

  const refreshReflection = async (sessionId: string) => {
    const rows = await getRepairReflection(sessionId);
    setReflection(rows);
    const mineRow = rows.find((r) => r.is_me);
    if (mineRow) setDraft({
      what: mineRow.what || '', felt: mineRow.felt || '', needed: mineRow.needed || '',
      share_what: false, share_felt: false, share_needed: false,
    });
  };

  useEffect(() => {
    if (!coupleId) return;
    let cancelled = false;
    (async () => {
      let s = await getLatestRepairSession(coupleId);
      if (!s) s = await createRepairSession(coupleId);
      if (cancelled || !s) return;
      setSession(s);
      await refreshReflection(s.id);
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupleId]);

  if (!coupleId) return <PairGate feature="Repair Mode" onBack={onBack} />;
  if (!loaded || !session) return (
    <div className="screen feature">
      <FeatureHeader title="Repair Mode" onBack={onBack} />
      <section className="card"><p className="placeholder-note">Loading…</p></section>
    </div>
  );

  const mine = reflection.find((r) => r.is_me);
  const theirs = reflection.find((r) => !r.is_me);

  const saveMine = async () => {
    const { error } = await saveMyRepairEntry(session.id, coupleId, userId, draft);
    if (error) { addToast(`Couldn’t save — ${error}`); return; }
    await refreshReflection(session.id);
    addToast('Your part is saved.');
  };
  const chooseAction = async (text: string) => {
    const { error } = await setRepairAction(session.id, text);
    if (error) { addToast(`Couldn’t save — ${error}`); return; }
    const next = await getLatestRepairSession(coupleId);
    if (next) setSession(next);
    addToast('Repair action set — check back tomorrow.');
    unlock('first_repair');
  };
  const markFollowUp = async (result: 'helped' | 'not_yet') => {
    const { error } = await setRepairFollowUp(session.id, result);
    if (error) { addToast(`Couldn’t save — ${error}`); return; }
    const next = await getLatestRepairSession(coupleId);
    if (next) setSession(next);
    addToast(result === 'helped' ? 'Good — noted.' : 'Noted — consider revisiting the conversation.');
  };
  const dueForFollowUp = !!(session.follow_up_at && Date.now() >= new Date(session.follow_up_at).getTime() && !session.follow_up_result);

  return (
    <div className="screen feature">
      <FeatureHeader title="Repair Mode" sub="A structured way to work through friction — not about who’s right." onBack={onBack} />
      <section className="card">
        <div className="card-head"><span>1. Pause</span></div>
        <p className="card-sub">Before anything else: does this still feel safe to work through together right now?</p>
      </section>
      <section className="card">
        <div className="card-head"><span>2. Name what happened — privately</span></div>
        <label className="repair-label">What happened</label>
        <textarea className="repair-field" value={draft.what} onChange={(e) => setDraft({ ...draft, what: e.target.value })} />
        <label className="share-row"><input type="checkbox" checked={draft.share_what} onChange={(e) => setDraft({ ...draft, share_what: e.target.checked })} /> Share this with {partnerName || 'your partner'}</label>
        <label className="repair-label">What I felt</label>
        <textarea className="repair-field" value={draft.felt} onChange={(e) => setDraft({ ...draft, felt: e.target.value })} />
        <label className="share-row"><input type="checkbox" checked={draft.share_felt} onChange={(e) => setDraft({ ...draft, share_felt: e.target.checked })} /> Share this with {partnerName || 'your partner'}</label>
        <label className="repair-label">What I needed</label>
        <textarea className="repair-field" value={draft.needed} onChange={(e) => setDraft({ ...draft, needed: e.target.value })} />
        <label className="share-row"><input type="checkbox" checked={draft.share_needed} onChange={(e) => setDraft({ ...draft, share_needed: e.target.checked })} /> Share this with {partnerName || 'your partner'}</label>
        <p className="placeholder-note">Try: “I felt ___ when ___, and I need ___.”</p>
        <button className="btn primary" onClick={saveMine}>Save my part</button>
      </section>
      <section className="card">
        <div className="card-head"><span>3. Reflect together</span></div>
        <p className="reflect-name">You</p>
        {mine?.submitted_at ? (
          <>
            {mine.what && <p className="reflect-line">{mine.what}</p>}
            {mine.felt && <p className="reflect-line">{mine.felt}</p>}
            {mine.needed && <p className="reflect-line">{mine.needed}</p>}
          </>
        ) : <p className="placeholder-note">Save your part above to see it here.</p>}
        <p className="reflect-name">{partnerName || 'Your partner'}</p>
        {theirs?.submitted_at ? (
          <>
            {theirs.what && <p className="reflect-line">{theirs.what}</p>}
            {theirs.felt && <p className="reflect-line">{theirs.felt}</p>}
            {theirs.needed && <p className="reflect-line">{theirs.needed}</p>}
            {!theirs.what && !theirs.felt && !theirs.needed && <p className="placeholder-note">Nothing shared yet.</p>}
          </>
        ) : <p className="placeholder-note">Waiting for your partner.</p>}
      </section>
      <section className="card">
        <div className="card-head"><span>4. Choose a repair action</span></div>
        <div className="repair-actions">
          {REPAIR_ACTIONS.map((a) => <button key={a} className={`repair-action-btn ${session.action === a ? 'selected' : ''}`} onClick={() => chooseAction(a)}>{a}</button>)}
        </div>
      </section>
      {session.action && (
        <section className="card eve">
          <div className="card-head accent"><span>5. Follow-up</span></div>
          <p className="card-sub">Action: {session.action}</p>
          {dueForFollowUp ? (
            <div className="btn-row">
              <button className="btn primary" onClick={() => markFollowUp('helped')}>It helped</button>
              <button className="btn ghost" onClick={() => markFollowUp('not_yet')}>Not yet</button>
            </div>
          ) : session.follow_up_result ? (
            <p className="card-sub">You noted: {session.follow_up_result === 'helped' ? 'this helped.' : 'not resolved yet.'}</p>
          ) : (
            <p className="placeholder-note">Check back in on {session.follow_up_at ? new Date(session.follow_up_at).toLocaleDateString() : ''}.</p>
          )}
        </section>
      )}
    </div>
  );
}
