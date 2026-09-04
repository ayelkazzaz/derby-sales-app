import { useEffect, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { Profile } from '../lib/types';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The profiles row is created server-side by the handle_new_user trigger
// (see supabase/schema.sql) the moment an account signs up — this just
// reads it back. A couple of short retries cover the rare case where this
// runs a beat before that insert has committed.
async function fetchProfile(user: User): Promise<Profile | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data } = await supabase.from('profiles').select('id, display_name').eq('id', user.id).maybeSingle();
    if (data) return data as Profile;
    if (attempt < 2) await sleep(400);
  }
  return null;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted.current) return;
      setSession(data.session);
      if (data.session) {
        const p = await fetchProfile(data.session.user);
        if (mounted.current) {
          setProfile(p);
          setProfileError(p ? null : 'Couldn’t load your profile. Try signing in again, or contact support if this keeps happening.');
        }
      }
      if (mounted.current) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      if (!mounted.current) return;
      setSession(next);
      if (next) {
        const p = await fetchProfile(next.user);
        if (mounted.current) {
          setProfile(p);
          setProfileError(p ? null : 'Couldn’t load your profile. Try signing in again, or contact support if this keeps happening.');
        }
      } else {
        setProfile(null);
        setProfileError(null);
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

  return { session, user: session?.user ?? null, profile, profileError, loading, needsEmailConfirm, signUp, signIn, signOut };
}
