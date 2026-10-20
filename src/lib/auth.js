import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import { supabase, authConfigured } from './supabase';

WebBrowser.maybeCompleteAuthSession();
const AuthContext = createContext(null);
export const AUTH_REDIRECT = Platform.OS === 'web' && typeof window !== 'undefined' ? `${window.location.origin}${process.env.EXPO_PUBLIC_BASE_PATH || ''}/auth/callback` : 'autolog://auth/callback';
const callbackExchanges = new Map();
async function handleCallback(url) {
  if (!url || !supabase) return;
  const returned = new URL(url), expected = new URL(AUTH_REDIRECT);
  if (returned.protocol !== expected.protocol || returned.host !== expected.host || returned.pathname.replace(/\/$/, '') !== expected.pathname) return;
  if (returned.searchParams.get('error')) throw Error('Provider rejected authentication');
  const code = returned.searchParams.get('code');
  if (!code) return;
  if (!callbackExchanges.has(code)) callbackExchanges.set(code, supabase.auth.exchangeCodeForSession(code).then(({ error }) => { if (error) throw error; }));
  await callbackExchanges.get(code);
}

export function authMessage(error) {
  if (error?.code === 'invalid_credentials') return 'E-mail ou senha incorretos.';
  if (error?.code === 'email_not_confirmed') return 'Confirme seu e-mail antes de entrar.';
  if (error?.code === 'user_already_exists') return 'Já existe uma conta com esse e-mail.';
  if (error?.code?.includes('rate_limit') || error?.status === 429) return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
  if (error?.code === 'same_password') return 'Escolha uma senha diferente da anterior.';
  if (error?.code === 'weak_password') return 'Escolha uma senha mais forte.';
  if (error?.message?.includes('fetch') || error?.message?.includes('network')) return 'Verifique sua conexão com a internet.';
  if (error?.autolog) return error.message;
  return 'Não foi possível concluir o acesso. Tente novamente ou verifique a configuração do login.';
}
function requireClient() {
  if (!supabase) throw Object.assign(Error('O login ainda não está conectado ao Supabase.'), { autolog: true });
}
export function AuthProvider({ children }) {
  const [recovering, setRecovering] = useState(false);
  const [session, setSession] = useState(null), [loading, setLoading] = useState(!!supabase), [initialError, setInitialError] = useState('');
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => { if (alive) { if (_event === 'PASSWORD_RECOVERY') setRecovering(true); if (!next) setRecovering(false); setSession(next); setLoading(false); } });
    supabase.auth.getSession().then(({ data, error }) => { if (!alive) return; if (error) setInitialError(authMessage(error)); setSession(data.session); setLoading(false); }).catch(() => { if (alive) { setInitialError('Não foi possível recuperar sua sessão. Entre novamente.'); setLoading(false); } });
    if (AppState.currentState === 'active') supabase.auth.startAutoRefresh();
    const appState = AppState.addEventListener('change', state => { if (state === 'active') supabase.auth.startAutoRefresh(); else supabase.auth.stopAutoRefresh(); });
    const consume = url => handleCallback(url).catch(e => { if (alive) setInitialError(authMessage(e)); });
    if (Platform.OS === 'web') consume(window.location.href);
    else Linking.getInitialURL().then(consume).catch(() => {});
    const links = Linking.addEventListener('url', ({ url }) => { consume(url); });
    return () => { alive = false; subscription.unsubscribe(); appState.remove(); links.remove(); supabase.auth.stopAutoRefresh(); };
  }, []);
  async function checkEmail(email) {
    requireClient();
    const { data, error } = await supabase.functions.invoke('check-email', { body: { email: email.trim().toLowerCase() } });
    if (error || typeof data?.exists !== 'boolean') {
      const status = error?.context?.status;
      throw Object.assign(Error(status === 429 ? 'Muitas consultas. Aguarde alguns minutos e tente novamente.' : 'Não foi possível consultar o e-mail. A verificação precisa estar publicada no Supabase e sua conexão ativa.'), { autolog: true });
    }
    return data.exists;
  }
  async function emailLogin(email, password) {
    requireClient(); const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password }); if (error) throw error;
  }
  async function signUp(email, password) {
    requireClient(); const { data, error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { emailRedirectTo: AUTH_REDIRECT } }); if (error) throw error; return !!data.session;
  }
  async function socialLogin(provider) {
    requireClient();
    if (!['google', 'azure'].includes(provider)) throw Error('Invalid provider');
    if (Platform.OS !== 'web' && Constants.executionEnvironment === 'storeClient') throw Object.assign(Error('Este acesso precisa da versão Android de desenvolvimento do AutoLog. No Expo Go, use e-mail e senha.'), { autolog: true });
    const redirectTo = Platform.OS === 'web' ? AUTH_REDIRECT : AuthSession.makeRedirectUri({ scheme: 'autolog', path: 'auth/callback' });
    const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true, ...(provider === 'azure' ? { scopes: 'email' } : {}) } });
    if (error) throw error;
    if (Platform.OS === 'web') { window.location.assign(data.url); return; }
    const browserResult = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (browserResult.type !== 'success') return;
    const returned = new URL(browserResult.url), expected = new URL(redirectTo);
    if (returned.protocol !== expected.protocol || returned.host !== expected.host || returned.pathname !== expected.pathname) throw Error('Unexpected callback');
    if (returned.searchParams.get('error')) throw Error('Provider rejected authentication');
    const code = returned.searchParams.get('code');
    if (!code) throw Error('Missing authorization code');
    await handleCallback(browserResult.url);
  }
  async function requestPasswordReset(email) {
    requireClient();
    if (Platform.OS !== 'web' && Constants.executionEnvironment === 'storeClient') throw Object.assign(Error('Para abrir o link de recuperação, use a versão Android de desenvolvimento do AutoLog. O Expo Go não abre links autolog://.'), { autolog: true });
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: AUTH_REDIRECT });
    if (error) throw error;
  }
  async function finishPasswordReset(password) {
    requireClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    setRecovering(false);
  }
  async function signOut() {
    requireClient(); const { error } = await supabase.auth.signOut({ scope: 'local' }); if (error) throw error; setSession(null);
  }
  return <AuthContext.Provider value={{ session, loading, recovering, requestPasswordReset, finishPasswordReset, initialError, configured: authConfigured, checkEmail, emailLogin, signUp, socialLogin, signOut }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);


