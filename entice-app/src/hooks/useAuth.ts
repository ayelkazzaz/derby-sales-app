import { useEffect, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { Profile } from '../lib/types';

async function ensureProfile(user: User): Promise<Profile | null> {
  const { data: existing } = await supabase.from('profiles').select('id, display_name').eq('id', user.id).maybeSingle();
  if (existing) return existing as Profile;
  const displayName = (user.user_metadata?.display_name as string | undefined) || user.email || 'You';
  const { data: created, error } = await supabase
    .from('profiles')
    .insert({ id: user.id, display_name: displayName })
    .select('id, display_name')
    .single();
  if (error) return null;
  return created as Profile;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted.current) return;
      setSession(data.session);
      if (data.session) {
        const p = await ensureProfile(data.session.user);
        if (mounted.current) setProfile(p);
      }
      if (mounted.current) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      if (!mounted.current) return;
      setSession(next);
      if (next) {
        const p = await ensureProfile(next.user);
        if (mounted.current) setProfile(p);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted.current = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) return { error: error.message };
    if (!data.session) {
      setNeedsEmailConfirm(true);
      return { error: null, needsConfirm: true };
    }
    return { error: null, needsConfirm: false };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { session, user: session?.user ?? null, profile, loading, needsEmailConfirm, signUp, signIn, signOut };
}
