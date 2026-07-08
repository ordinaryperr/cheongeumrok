import { supabase } from './supabase';

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function signInWithEmail(email, password) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email, password) {
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') };
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  if (!supabase) return { error: new Error('Supabase is not configured') };
  return supabase.auth.signOut();
}
