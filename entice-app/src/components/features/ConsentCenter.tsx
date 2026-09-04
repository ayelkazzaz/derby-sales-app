import { useEffect, useState } from 'react';
import { getConsent, upsertConsent, type ConsentRow } from '../../lib/data';
import { FeatureHeader, type ToastFn } from '../Shared';
import type { Role } from '../../lib/types';

interface Props { coupleId: string | null; role: Role | null; partnerName: string | null; addToast: ToastFn; onBack: () => void }

const blank: Omit<ConsentRow, 'couple_id'> = { spicy: false, bold: false, after_dark_confirmed_a: false, after_dark_confirmed_b: false };

export function ConsentCenter({ coupleId, role, partnerName, addToast, onBack }: Props) {
  const [data, setData] = useState<Omit<ConsentRow, 'couple_id'>>(blank);

  useEffect(() => {
    if (!coupleId) { setData(blank); return; }
    let cancelled = false;
    getConsent(coupleId).then((d) => { if (!cancelled) setData(d); });
    return () => { cancelled = true; };
  }, [coupleId]);

  const myConfirmedKey = role === 'B' ? 'after_dark_confirmed_b' : 'after_dark_confirmed_a';
  const partnerConfirmedKey = role === 'B' ? 'after_dark_confirmed_a' : 'after_dark_confirmed_b';

  const toggle = async (key: keyof typeof data, labelText: string) => {
    const next = { ...data, [key]: !data[key] };
    setData(next);
    addToast(`${labelText} ${next[key] ? 'enabled' : 'disabled'}.`);
    if (coupleId) {
      const { error } = await upsertConsent(coupleId, { [key]: next[key] } as Partial<ConsentRow>);
      if (error) addToast(`Couldn’t save — ${error}`);
    }
  };

  return (
    <div className="screen feature">
      <FeatureHeader title="Consent Center" sub="Private by default. Sensitive content is always opt-in, and either partner can turn it off." onBack={onBack} />
      <section className="card">
        <p className="card-sub">Individual answers in Couple DNA and one-sided Secret Match picks are never shown to your partner — only mutual matches are revealed.</p>
      </section>
      <section className="card">
        <div className="consent-toggle-row"><span>Show spicier content in games</span><button className={`switch ${data.spicy ? 'on' : ''}`} onClick={() => toggle('spicy', 'Spicy content')}><span className="switch-thumb" /></button></div>
        <div className="consent-toggle-row"><span>Show bold-tier content</span><button className={`switch ${data.bold ? 'on' : ''}`} onClick={() => toggle('bold', 'Bold content')}><span className="switch-thumb" /></button></div>
        <div className="consent-toggle-row"><span>I consent to enable After Dark (18+)</span><button className={`switch ${data[myConfirmedKey] ? 'on' : ''}`} onClick={() => toggle(myConfirmedKey, 'After Dark')}><span className="switch-thumb" /></button></div>
      </section>
      {coupleId && (
        <section className="card">
          <p className="placeholder-note">{partnerName || 'Your partner'} has {data[partnerConfirmedKey] ? '' : 'not '}opted in to After Dark. Both of you need to opt in here — plus confirm again each visit — before it unlocks.</p>
        </section>
      )}
      {!coupleId && <p className="placeholder-note">These settings save locally until you pair — they’ll sync to your shared space once you do.</p>}
    </div>
  );
}
