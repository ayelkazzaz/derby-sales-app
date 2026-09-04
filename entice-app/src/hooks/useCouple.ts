import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Couple, Profile, Role } from '../lib/types';

interface CoupleRow {
  couple_id: string;
  role: Role;
  couples: Couple | Couple[] | null;
}

function normalizeCouple(row: CoupleRow['couples']): Couple | null {
  if (!row) return null;
  return Array.isArray(row) ? row[0] ?? null : row;
}

export function useCouple(userId: string | null | undefined) {
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteExpiresAt, setInviteExpiresAt] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [syncState, setSyncState] = useState<'live' | 'reconnecting'>('live');
  const prevStatusRef = useRef<string | null>(null);
  const pairedCallbackRef = useRef<((partnerName: string) => void) | null>(null);

  const refetch = useCallback(async () => {
    if (!userId) { setCoupleId(null); setRole(null); setCouple(null); setPartner(null); setLoaded(true); return; }

    const { data: rows } = await supabase
      .from('couple_members')
      .select('couple_id, role, couples(id, status, created_at, paired_at, updated_at)')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    const active = (rows as unknown as CoupleRow[] | null)?.find((r) => {
      const c = normalizeCouple(r.couples);
      return c && c.status !== 'disbanded';
    });

    if (!active) {
      setCoupleId(null); setRole(null); setCouple(null); setPartner(null); setInviteCode(null);
      prevStatusRef.current = null;
      setLoaded(true);
      return;
    }

    const activeCouple = normalizeCouple(active.couples)!;
    const wasStatus = prevStatusRef.current;
    setCoupleId(active.couple_id);
    setRole(active.role);
    setCouple(activeCouple);

    const { data: partnerMember } = await supabase
      .from('couple_members')
      .select('user_id')
      .eq('couple_id', active.couple_id)
      .neq('user_id', userId)
      .maybeSingle();

    if (partnerMember) {
      const { data: partnerProfile } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('id', partnerMember.user_id)
        .maybeSingle();
      setPartner((partnerProfile as Profile) || null);
      if (wasStatus === 'waiting' && activeCouple.status === 'paired' && pairedCallbackRef.current) {
        pairedCallbackRef.current((partnerProfile as Profile)?.display_name || 'Your partner');
      }
    } else {
      setPartner(null);
    }

    if (activeCouple.status === 'waiting') {
      const { data: invite } = await supabase
        .from('pairing_invites')
        .select('code, expires_at')
        .eq('couple_id', active.couple_id)
        .is('used_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setInviteCode(invite?.code ?? null);
      setInviteExpiresAt(invite ? new Date(invite.expires_at).getTime() : null);
    } else {
      setInviteCode(null);
      setInviteExpiresAt(null);
    }

    prevStatusRef.current = activeCouple.status;
    setLoaded(true);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!coupleId) return undefined;
    const channel = supabase
      .channel(`couple-${coupleId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couples', filter: `id=eq.${coupleId}` }, () => {
        setSyncState('live');
        refetch();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setSyncState('live');
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') setSyncState('reconnecting');
      });
    return () => { supabase.removeChannel(channel); };
  }, [coupleId, refetch]);

  const createSpace = async (): Promise<{ error: string | null }> => {
    const { error } = await supabase.rpc('create_couple_space');
    if (error) return { error: error.message };
    await refetch();
    return { error: null };
  };

  const joinWithCode = async (code: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.rpc('redeem_invite', { p_code: code });
    if (error) {
      const map: Record<string, string> = {
        invalid_code: 'That code doesn’t look right.',
        expired_code: 'This code has expired — ask for a new one.',
        already_used: 'This space is already paired.',
      };
      return { error: map[error.message] || error.message };
    }
    await refetch();
    return { error: null };
  };

  const leaveSpace = async (): Promise<{ error: string | null }> => {
    if (!coupleId) return { error: null };
    const { error } = await supabase.rpc('leave_couple_space', { p_couple_id: coupleId });
    if (error) return { error: error.message };
    setCoupleId(null); setRole(null); setCouple(null); setPartner(null); setInviteCode(null);
    prevStatusRef.current = null;
    return { error: null };
  };

  const onPaired = (cb: (partnerName: string) => void) => { pairedCallbackRef.current = cb; };

  return {
    coupleId, role, couple, partner, inviteCode, inviteExpiresAt, loaded, syncState,
    createSpace, joinWithCode, leaveSpace, refetch, onPaired,
  };
}
