import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useCouple } from './hooks/useCouple';
import { AuthScreen } from './components/Auth';
import { Toasts, type ToastItem } from './components/Shared';
import { TonightScreen } from './components/TonightScreen';
import { CategoryScreen } from './components/CategoryScreen';
import { AchievementsScreen } from './components/features/AchievementsScreen';
import { CoupleChaos } from './components/games/CoupleChaos';
import { PickupLineBattle } from './components/games/PickupLineBattle';
import { WouldYouRather } from './components/games/WouldYouRather';
import { GuessMe } from './components/games/GuessMe';
import { SecretMatch } from './components/features/SecretMatch';
import { DailyEntice } from './components/features/DailyEntice';
import { RepairMode } from './components/features/RepairMode';
import { CoupleDNA } from './components/features/CoupleDNA';
import { ConsentCenter } from './components/features/ConsentCenter';
import { ChallengeDeck } from './components/features/ChallengeDeck';
import { AfterDark } from './components/features/AfterDark';
import { EnticeUs } from './components/features/EnticeUs';
import { DreamTogether } from './components/features/DreamTogether';
import { OurVault } from './components/features/OurVault';
import { FEATURES, NAV_TABS, MOODS } from './lib/content';
import { generateId } from './lib/helpers';
import { getAchievements, getGamesPlayed, getMoods, markGamePlayed as markGamePlayedApi, setMood, unlockAchievement } from './lib/data';
import { ACHIEVEMENTS } from './lib/content';
import type { MoodKey } from './lib/content';

export default function App() {
  const auth = useAuth();
  const couple = useCouple(auth.user?.id ?? null);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const addToast = useCallback((message: string) => {
    const id = generateId();
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  const [screen, setScreen] = useState('tonight');
  const [soloMood, setSoloMood] = useState<MoodKey | null>(null);
  const [ownMood, setOwnMood] = useState<MoodKey | null>(null);
  const [partnerMood, setPartnerMood] = useState<MoodKey | null>(null);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [gamesPlayed, setGamesPlayed] = useState<Record<string, boolean>>({});

  const [pairView, setPairView] = useState<'idle' | 'join'>('idle');
  const [joinInput, setJoinInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [busy, setBusy] = useState(false);

  const userId = auth.user?.id ?? null;
  const myName = auth.profile?.display_name || 'You';
  const partnerName = couple.partner?.display_name ?? null;

  useEffect(() => {
    couple.onPaired((partner) => {
      addToast(`You and ${partner} are paired.`);
      if (couple.coupleId) unlockAchievement(couple.coupleId, 'paired');
      setAchievements((a) => (a.includes('paired') ? a : [...a, 'paired']));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!couple.coupleId || !userId) { setOwnMood(null); setPartnerMood(null); return; }
    let cancelled = false;
    getMoods(couple.coupleId, userId, couple.partner?.id ?? null).then((m) => {
      if (!cancelled) { setOwnMood(m.mine); setPartnerMood(m.partner); }
    });
    return () => { cancelled = true; };
  }, [couple.coupleId, userId, couple.partner?.id, couple.couple?.updated_at]);

  useEffect(() => {
    if (!couple.coupleId) { setAchievements([]); setGamesPlayed({}); return; }
    let cancelled = false;
    Promise.all([getAchievements(couple.coupleId), getGamesPlayed(couple.coupleId)]).then(([a, g]) => {
      if (!cancelled) { setAchievements(a); setGamesPlayed(g); }
    });
    return () => { cancelled = true; };
  }, [couple.coupleId, couple.couple?.updated_at]);

  const unlock = useCallback(async (key: string) => {
    if (achievements.includes(key)) return;
    if (couple.coupleId) {
      const { error } = await unlockAchievement(couple.coupleId, key);
      if (error) return;
    }
    setAchievements((a) => (a.includes(key) ? a : [...a, key]));
    const meta = ACHIEVEMENTS.find((a) => a.key === key);
    addToast(`Achievement: ${meta ? meta.label : key}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [achievements, couple.coupleId, addToast]);

  const markGamePlayed = useCallback(async (key: string) => {
    const already = !!gamesPlayed[key];
    const next = { ...gamesPlayed, [key]: true };
    setGamesPlayed(next);
    if (couple.coupleId) await markGamePlayedApi(couple.coupleId, key);
    if (!already) unlock('first_game');
    if (['chaos', 'pickup', 'guessme', 'wyr'].every((k) => next[k])) unlock('played_every_game');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamesPlayed, couple.coupleId, unlock]);

  const handleSelectMood = async (key: MoodKey) => {
    if (couple.coupleId && userId) {
      setOwnMood(key);
      const { error } = await setMood(couple.coupleId, userId, key);
      if (error) { addToast(`Couldn’t save — ${error}`); return; }
    } else {
      setSoloMood(key);
    }
    addToast(`Feeling ${MOODS.find((m) => m.key === key)?.label.toLowerCase()} — saved.`);
    unlock('first_pulse');
  };

  const handleCreate = async () => {
    setBusy(true);
    const { error } = await couple.createSpace();
    setBusy(false);
    if (error) addToast(`Couldn’t create your space — ${error}`);
    else addToast('Space created — share your code with your partner.');
  };
  const handleStartJoin = () => { setJoinError(''); setPairView('join'); };
  const handleCancelJoin = () => { setJoinError(''); setPairView('idle'); };
  const handleJoinSubmit = async () => {
    const code = joinInput.trim().toUpperCase();
    if (code.length !== 6) { setJoinError('Codes are 6 characters.'); return; }
    setBusy(true);
    const { error } = await couple.joinWithCode(code);
    setBusy(false);
    if (error) { setJoinError(error); return; }
    setPairView('idle'); setJoinInput('');
    unlock('paired');
  };
  const handleCopyCode = async (code: string) => {
    try { await navigator.clipboard.writeText(code); addToast('Code copied.'); } catch { addToast(`Your code: ${code}`); }
  };
  const handleLeave = async () => {
    const { error } = await couple.leaveSpace();
    if (error) { addToast(`Couldn’t leave — ${error}`); return; }
    setPairView('idle');
    addToast('You left this space.');
  };

  const openFeature = (key: string) => setScreen(key);
  const handleNav = (key: string) => {
    if (key === 'tonight') setScreen('tonight');
    else if (key === 'repair') setScreen('repair');
    else setScreen(`cat:${key}`);
  };

  const activeNav = (() => {
    if (screen === 'tonight') return 'tonight';
    if (screen.startsWith('cat:')) return screen.slice(4);
    if (screen === 'achievements') return 'us';
    const f = FEATURES.find((x) => x.key === screen);
    return f ? f.category : 'tonight';
  })();

  if (auth.loading) {
    return <div className="app-root" style={{ alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--muted)' }}>Loading…</p></div>;
  }

  if (!auth.session || !auth.profile) {
    return (
      <div className="app-root">
        <Toasts toasts={toasts} />
        <AuthScreen signUp={auth.signUp} signIn={auth.signIn} />
      </div>
    );
  }

  const back = () => setScreen('tonight');
  const effectiveOwnMood = couple.coupleId ? ownMood : soloMood;
  const effectivePartnerMood = couple.coupleId ? partnerMood : null;

  const renderScreen = () => {
    if (screen === 'tonight') {
      return (
        <TonightScreen
          name={myName} ownMood={effectiveOwnMood} partnerMood={effectivePartnerMood} partnerName={partnerName}
          onSelectMood={handleSelectMood} onOpen={openFeature}
          pairingProps={{
            role: couple.role, coupleId: couple.coupleId, couple: couple.couple, partner: couple.partner,
            inviteCode: couple.inviteCode, inviteExpiresAt: couple.inviteExpiresAt, pairView, joinInput, joinError,
            syncState: couple.syncState, busy,
            onCreate: handleCreate, onStartJoin: handleStartJoin, onJoinInputChange: setJoinInput,
            onJoinSubmit: handleJoinSubmit, onCopyCode: handleCopyCode, onLeave: handleLeave, onCancelJoin: handleCancelJoin,
          }}
        />
      );
    }
    if (screen.startsWith('cat:')) return <CategoryScreen category={screen.slice(4)} coupleId={couple.coupleId} onOpen={openFeature} onBack={back} />;
    if (screen === 'achievements') return <AchievementsScreen unlocked={achievements} onBack={back} />;
    switch (screen) {
      case 'chaos': return <CoupleChaos myName={myName} partnerName={partnerName} addToast={addToast} markGamePlayed={markGamePlayed} onBack={back} />;
      case 'pickup': return <PickupLineBattle myName={myName} partnerName={partnerName} markGamePlayed={markGamePlayed} onBack={back} />;
      case 'guessme': return <GuessMe myName={myName} partnerName={partnerName} markGamePlayed={markGamePlayed} onBack={back} />;
      case 'wyr': return <WouldYouRather myName={myName} partnerName={partnerName} markGamePlayed={markGamePlayed} onBack={back} />;
      case 'secretmatch': return <SecretMatch coupleId={couple.coupleId} userId={userId!} addToast={addToast} unlock={unlock} onBack={back} />;
      case 'dailyentice': return <DailyEntice coupleId={couple.coupleId} addToast={addToast} unlock={unlock} onBack={back} />;
      case 'repair': return <RepairMode coupleId={couple.coupleId} userId={userId!} partnerName={partnerName} addToast={addToast} unlock={unlock} onBack={back} />;
      case 'dna': return <CoupleDNA coupleId={couple.coupleId} userId={userId!} addToast={addToast} unlock={unlock} onBack={back} />;
      case 'consent': return <ConsentCenter coupleId={couple.coupleId} role={couple.role} partnerName={partnerName} addToast={addToast} onBack={back} />;
      case 'challenge': return <ChallengeDeck coupleId={couple.coupleId} addToast={addToast} onBack={back} />;
      case 'afterdark': return <AfterDark coupleId={couple.coupleId} myName={myName} partnerName={partnerName} onGoConsent={() => setScreen('consent')} onBack={back} />;
      case 'enticeus': return <EnticeUs coupleId={couple.coupleId} addToast={addToast} onBack={back} />;
      case 'dream': return <DreamTogether coupleId={couple.coupleId} userId={userId!} addToast={addToast} unlock={unlock} onBack={back} />;
      case 'vault': return <OurVault coupleId={couple.coupleId} userId={userId!} addToast={addToast} unlock={unlock} onBack={back} />;
      default: return null;
    }
  };

  return (
    <div className="app-root">
      <Toasts toasts={toasts} />
      <header className="topbar">
        <div className="wordmark">Entice</div>
        <div className="topbar-actions">
          <button className="icon-btn" onClick={() => auth.signOut()} title="Sign out">⏻</button>
        </div>
      </header>
      <main className="content">{renderScreen()}</main>
      <nav className="bottom-nav">
        {NAV_TABS.map((item) => (
          <button key={item.key} className={`nav-btn ${activeNav === item.key ? 'active' : ''}`} onClick={() => handleNav(item.key)}>{item.label}</button>
        ))}
      </nav>
    </div>
  );
}
