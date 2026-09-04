import { supabase } from './supabaseClient';
import type { MoodKey } from './content';
import type { Role } from './types';

/* ================= MOOD PULSE ================= */

export async function getMoods(coupleId: string, myId: string, partnerId: string | null) {
  const { data } = await supabase
    .from('moods')
    .select('user_id, mood, created_at')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
    .limit(20);
  const rows = data || [];
  const mine = rows.find((r) => r.user_id === myId)?.mood as MoodKey | undefined;
  const partner = partnerId ? (rows.find((r) => r.user_id === partnerId)?.mood as MoodKey | undefined) : undefined;
  return { mine: mine ?? null, partner: partner ?? null };
}

export async function setMood(coupleId: string, userId: string, mood: MoodKey) {
  const { error } = await supabase.from('moods').insert({ couple_id: coupleId, user_id: userId, mood, note_privacy: 'shared' });
  return { error: error?.message ?? null };
}

/* ================= CONSENT SETTINGS ================= */

export interface ConsentRow {
  couple_id: string;
  spicy: boolean;
  bold: boolean;
  after_dark_confirmed_a: boolean;
  after_dark_confirmed_b: boolean;
}

export async function getConsent(coupleId: string): Promise<ConsentRow> {
  const { data } = await supabase.from('consent_settings').select('*').eq('couple_id', coupleId).maybeSingle();
  return (data as ConsentRow) || { couple_id: coupleId, spicy: false, bold: false, after_dark_confirmed_a: false, after_dark_confirmed_b: false };
}

export async function upsertConsent(coupleId: string, patch: Partial<ConsentRow>) {
  const { error } = await supabase.from('consent_settings').upsert({ couple_id: coupleId, ...patch }, { onConflict: 'couple_id' });
  return { error: error?.message ?? null };
}

/* ================= COUPLE DNA ================= */

export interface DnaAnswers {
  connection?: string | null; stress?: string | null; conflict?: string | null;
  play?: string | null; desire?: string | null; dream?: string | null;
}

export async function getMyDna(coupleId: string, userId: string): Promise<DnaAnswers> {
  const { data } = await supabase.from('dna_answers').select('*').eq('couple_id', coupleId).eq('user_id', userId).maybeSingle();
  return (data as DnaAnswers) || {};
}

export async function upsertMyDna(coupleId: string, userId: string, patch: DnaAnswers) {
  const { error } = await supabase
    .from('dna_answers')
    .upsert({ couple_id: coupleId, user_id: userId, ...patch }, { onConflict: 'user_id,couple_id' });
  return { error: error?.message ?? null };
}

export interface DnaViewRow { dimension: string; my_value: string | null; partner_value: string | null }

export async function getDnaView(coupleId: string): Promise<DnaViewRow[]> {
  const { data, error } = await supabase.rpc('get_dna_view', { p_couple_id: coupleId });
  if (error) return [];
  return (data as DnaViewRow[]) || [];
}

/* ================= SECRET MATCH ================= */

export async function getMySecretSelections(coupleId: string, userId: string): Promise<string[]> {
  const { data } = await supabase.from('secret_selections').select('option_key').eq('couple_id', coupleId).eq('user_id', userId);
  return (data || []).map((r) => r.option_key as string);
}

export async function addSecretSelection(coupleId: string, userId: string, optionKey: string) {
  const { error } = await supabase.from('secret_selections').insert({ couple_id: coupleId, user_id: userId, option_key: optionKey });
  return { error: error?.message ?? null };
}

export async function removeSecretSelection(coupleId: string, userId: string, optionKey: string) {
  const { error } = await supabase
    .from('secret_selections')
    .delete()
    .eq('couple_id', coupleId)
    .eq('user_id', userId)
    .eq('option_key', optionKey);
  return { error: error?.message ?? null };
}

export async function getSecretMatches(coupleId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_secret_matches', { p_couple_id: coupleId });
  if (error) return [];
  return ((data as { option_key: string }[]) || []).map((r) => r.option_key);
}

/* ================= REPAIR MODE ================= */

export interface RepairSession {
  id: string; couple_id: string; action: string | null; action_set_at: string | null;
  follow_up_at: string | null; follow_up_result: string | null; created_at: string;
}

export async function getLatestRepairSession(coupleId: string): Promise<RepairSession | null> {
  const { data } = await supabase
    .from('repair_sessions')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as RepairSession) || null;
}

export async function createRepairSession(coupleId: string): Promise<RepairSession | null> {
  const { data, error } = await supabase.from('repair_sessions').insert({ couple_id: coupleId }).select('*').single();
  if (error) return null;
  return data as RepairSession;
}

export interface RepairEntryDraft {
  what: string; felt: string; needed: string;
  share_what: boolean; share_felt: boolean; share_needed: boolean;
}

export async function getMyRepairEntry(sessionId: string, userId: string) {
  const { data } = await supabase.from('repair_entries').select('*').eq('session_id', sessionId).eq('user_id', userId).maybeSingle();
  return data;
}

export async function saveMyRepairEntry(sessionId: string, coupleId: string, userId: string, draft: RepairEntryDraft) {
  const { error } = await supabase.from('repair_entries').upsert(
    { session_id: sessionId, couple_id: coupleId, user_id: userId, ...draft, submitted_at: new Date().toISOString() },
    { onConflict: 'session_id,user_id' }
  );
  return { error: error?.message ?? null };
}

export async function setRepairAction(sessionId: string, action: string) {
  const now = new Date();
  const followUp = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const { error } = await supabase
    .from('repair_sessions')
    .update({ action, action_set_at: now.toISOString(), follow_up_at: followUp.toISOString(), follow_up_result: null })
    .eq('id', sessionId);
  return { error: error?.message ?? null };
}

export async function setRepairFollowUp(sessionId: string, result: 'helped' | 'not_yet') {
  const { error } = await supabase.from('repair_sessions').update({ follow_up_result: result }).eq('id', sessionId);
  return { error: error?.message ?? null };
}

export interface RepairReflectionRow {
  is_me: boolean; what: string | null; felt: string | null; needed: string | null; submitted_at: string | null;
}

export async function getRepairReflection(sessionId: string): Promise<RepairReflectionRow[]> {
  const { data, error } = await supabase.rpc('get_repair_reflection', { p_session_id: sessionId });
  if (error) return [];
  return (data as RepairReflectionRow[]) || [];
}

/* ================= GAME COMPLETIONS ================= */

export async function getGamesPlayed(coupleId: string): Promise<Record<string, boolean>> {
  const { data } = await supabase.from('game_completions').select('game_key').eq('couple_id', coupleId);
  const out: Record<string, boolean> = {};
  (data || []).forEach((r) => { out[r.game_key as string] = true; });
  return out;
}

export async function markGamePlayed(coupleId: string, gameKey: string) {
  const { error } = await supabase
    .from('game_completions')
    .upsert({ couple_id: coupleId, game_key: gameKey }, { onConflict: 'couple_id,game_key', ignoreDuplicates: true });
  return { error: error?.message ?? null };
}

/* ================= ACHIEVEMENTS ================= */

export async function getAchievements(coupleId: string): Promise<string[]> {
  const { data } = await supabase.from('achievements').select('key').eq('couple_id', coupleId);
  return (data || []).map((r) => r.key as string);
}

export async function unlockAchievement(coupleId: string, key: string) {
  const { error } = await supabase
    .from('achievements')
    .upsert({ couple_id: coupleId, key }, { onConflict: 'couple_id,key', ignoreDuplicates: true });
  return { error: error?.message ?? null };
}

/* ================= DAILY ENTICE ================= */

export interface DailyProgress { last_date: string | null; streak: number }

export async function getDailyProgress(coupleId: string): Promise<DailyProgress> {
  const { data } = await supabase.from('daily_progress').select('last_date, streak').eq('couple_id', coupleId).maybeSingle();
  return (data as DailyProgress) || { last_date: null, streak: 0 };
}

export async function setDailyProgress(coupleId: string, next: DailyProgress) {
  const { error } = await supabase.from('daily_progress').upsert({ couple_id: coupleId, ...next }, { onConflict: 'couple_id' });
  return { error: error?.message ?? null };
}

/* ================= DREAM TOGETHER ================= */

export interface DreamRow {
  id: string; couple_id: string; created_by: string; title: string; category: string | null;
  description: string | null; first_step: string | null; status: string; created_at: string;
}

export async function listDreams(coupleId: string): Promise<DreamRow[]> {
  const { data } = await supabase.from('dreams').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false });
  return (data as DreamRow[]) || [];
}

export async function addDream(coupleId: string, userId: string, patch: { title: string; category: string; description: string; first_step: string }) {
  const { error } = await supabase.from('dreams').insert({ couple_id: coupleId, created_by: userId, status: 'Idea', ...patch });
  return { error: error?.message ?? null };
}

export async function updateDreamStatus(id: string, status: string) {
  const { error } = await supabase.from('dreams').update({ status }).eq('id', id);
  return { error: error?.message ?? null };
}

export async function removeDream(id: string) {
  const { error } = await supabase.from('dreams').delete().eq('id', id);
  return { error: error?.message ?? null };
}

/* ================= OUR VAULT ================= */

export interface VaultItemRow {
  id: string; couple_id: string; created_by: string; title: string; body: string | null;
  type: string | null; visibility: string; created_at: string;
}

export async function listVaultItems(coupleId: string): Promise<VaultItemRow[]> {
  const { data } = await supabase.from('vault_items').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false });
  return (data as VaultItemRow[]) || [];
}

export async function addVaultItem(coupleId: string, userId: string, patch: { title: string; body: string; type: string; visibility: 'shared' | 'private' }) {
  const { error } = await supabase.from('vault_items').insert({ couple_id: coupleId, created_by: userId, ...patch });
  return { error: error?.message ?? null };
}

export async function removeVaultItem(id: string) {
  const { error } = await supabase.from('vault_items').delete().eq('id', id);
  return { error: error?.message ?? null };
}

/* ================= CHALLENGE DECK ================= */

export interface ProgressRow { mission_id: string; status: 'saved' | 'completed'; reflection?: string | null; updated_at: string }

export async function listChallengeProgress(coupleId: string): Promise<ProgressRow[]> {
  const { data } = await supabase.from('challenge_progress').select('*').eq('couple_id', coupleId).order('updated_at', { ascending: false });
  return (data as ProgressRow[]) || [];
}

export async function saveChallenge(coupleId: string, missionId: string) {
  const { error } = await supabase
    .from('challenge_progress')
    .upsert({ couple_id: coupleId, mission_id: missionId, status: 'saved' }, { onConflict: 'couple_id,mission_id,status' });
  return { error: error?.message ?? null };
}

export async function completeChallenge(coupleId: string, missionId: string, reflection: string) {
  const { error } = await supabase
    .from('challenge_progress')
    .upsert({ couple_id: coupleId, mission_id: missionId, status: 'completed', reflection }, { onConflict: 'couple_id,mission_id,status' });
  return { error: error?.message ?? null };
}

/* ================= ENTICE US ================= */

export async function listEnticeProgress(coupleId: string): Promise<ProgressRow[]> {
  const { data } = await supabase.from('enticeus_progress').select('*').eq('couple_id', coupleId).order('updated_at', { ascending: false });
  return (data as ProgressRow[]) || [];
}

export async function saveEntice(coupleId: string, missionId: string) {
  const { error } = await supabase
    .from('enticeus_progress')
    .upsert({ couple_id: coupleId, mission_id: missionId, status: 'saved' }, { onConflict: 'couple_id,mission_id,status' });
  return { error: error?.message ?? null };
}

export async function completeEntice(coupleId: string, missionId: string) {
  const { error } = await supabase
    .from('enticeus_progress')
    .upsert({ couple_id: coupleId, mission_id: missionId, status: 'completed' }, { onConflict: 'couple_id,mission_id,status' });
  return { error: error?.message ?? null };
}

export type { Role };
