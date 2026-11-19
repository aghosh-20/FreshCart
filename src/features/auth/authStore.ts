import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../../api/supabase';

export interface Profile { id: string; full_name: string | null; email: string | null; avatar_url: string | null; phone_number: string | null; created_at: string; updated_at: string; }
interface AuthState {
  session: Session | null; user: User | null; profile: Profile | null;
  initialized: boolean; loading: boolean; error: string | null;
  initialize: () => Promise<void>; refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  signInGoogle: () => Promise<void>; signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<Profile, 'full_name' | 'phone_number' | 'avatar_url'>>) => Promise<void>;
  uploadAvatar: (uri: string) => Promise<void>;
}
async function loadProfile(user: User): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  if (data) return data as Profile;
  const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'FreshCart User';
  const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
  const { data: created, error: insertError } = await supabase.from('profiles').insert({ id: user.id, full_name: name, email: user.email, avatar_url: avatar }).select('*').single();
  if (insertError) throw insertError;
  return created as Profile;
}
export const useAuthStore = create<AuthState>((set, get) => ({
  session: null, user: null, profile: null, initialized: false, loading: false, error: null,
  initialize: async () => {
    if (!isSupabaseConfigured) { set({ initialized: true }); return; }
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      set({ session, user: session?.user ?? null });
      if (session?.user) set({ profile: await loadProfile(session.user) });
    } catch (e) { set({ error: e instanceof Error ? e.message : 'Could not restore your session.' }); }
    finally { set({ initialized: true }); }
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, ...(session ? {} : { profile: null }) });
      if (session?.user) setTimeout(() => { void loadProfile(session.user).then((profile) => set({ profile })).catch(() => undefined); }, 0);
    });
  },
  refreshProfile: async () => { const user = get().user; if (user) set({ profile: await loadProfile(user) }); },
  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try { const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password }); if (error) throw error; }
    catch (e) { const message = e instanceof Error ? e.message : 'Sign in failed.'; set({ error: message }); throw e; }
    finally { set({ loading: false }); }
  },
  signUp: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() } } });
      if (error) throw error;
      if (data.session && data.user) { await loadProfile(data.user); return true; }
      return false;
    } catch (e) { const message = e instanceof Error ? e.message : 'Registration failed.'; set({ error: message }); throw e; }
    finally { set({ loading: false }); }
  },
  signInGoogle: async () => {
    const { makeRedirectUri } = await import('expo-auth-session');
    const WebBrowser = await import('expo-web-browser');
    const Linking = await import('expo-linking');
    await WebBrowser.maybeCompleteAuthSession();
    const redirectTo = makeRedirectUri({ scheme: 'freshcart', path: 'auth/callback' });
    console.log('Google Redirect URL:', redirectTo);
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true } });
    if (error) throw error;
    if (!data.url) throw new Error('Google sign-in URL was not returned.');
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return;
    const parsed = Linking.parse(result.url);
    const code = typeof parsed.queryParams?.code === 'string' ? parsed.queryParams.code : null;
    if (code) { const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code); if (exchangeError) throw exchangeError; return; }
    const hash = result.url.split('#')[1] || '';
    const params = new URLSearchParams(hash);
    const access_token = params.get('access_token'); const refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) throw new Error('Google sign-in did not return a valid session.');
    const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token }); if (sessionError) throw sessionError;
  },
  signOut: async () => { set({ loading: true, error: null }); try { const { error } = await supabase.auth.signOut(); if (error) throw error; set({ session: null, user: null, profile: null }); } finally { set({ loading: false }); } },
  updateProfile: async (updates) => { const user = get().user; if (!user) throw new Error('Please sign in.'); const { data, error } = await supabase.from('profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', user.id).select('*').single(); if (error) throw error; set({ profile: data as Profile }); },
  uploadAvatar: async (uri) => {
    const user = get().user; if (!user) throw new Error('Please sign in.');
    const response = await fetch(uri); const blob = await response.blob();
    if (blob.size > 5 * 1024 * 1024) throw new Error('Choose an image smaller than 5 MB.');
    const path = `${user.id}/avatar-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg', upsert: true }); if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    await get().updateProfile({ avatar_url: data.publicUrl });
  },
}));
