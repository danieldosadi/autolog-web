import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { Alert } from '../lib/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, uiStyles as s } from '../components/Dashboard';
import { PasswordField } from '../components/Login';
import { useAuth, authMessage, AUTH_REDIRECT } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { KEY } from '../lib/model';
import { VEHICLES_KEY } from '../lib/vehicles';
import { STATIONS_KEY } from '../lib/stations';
import Svg, { Path, Circle } from 'react-native-svg';
import TabIcon from '../components/TabIcon';
export default function Account() {
  const { session, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [page, setPage] = useState('menu'), [password, setPassword] = useState(''), [repeat, setRepeat] = useState(''), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  async function changePassword() {
    if (busy) return;
    if (password.length < 8 || password !== repeat) { setMessage('Use pelo menos 8 caracteres e repita a mesma senha.'); return; }
    setBusy(true); setMessage('');
    try { const { error } = await supabase.auth.updateUser({ password }); if (error) throw error; setPassword(''); setRepeat(''); setPage('data'); Alert.alert('Senha alterada', 'Sua nova senha foi salva.'); }
    catch (e) { setMessage(authMessage(e)); } finally { setBusy(false); }
  }
  async function removeAccount() {
    if (busy) return;
    setBusy(true); setMessage('');
    try {
      const { data, error } = await supabase.functions.invoke('delete-account', { body: {} });
      if (error || !data?.deleted) throw Error('delete_failed');
      await AsyncStorage.multiRemove([...([KEY, VEHICLES_KEY, STATIONS_KEY].map(key => `${key}.${session.user.id}`)), `${VEHICLES_KEY}.${session.user.id}.pending.v1`, `${VEHICLES_KEY}.${session.user.id}.cloud-migrated.v1`]);
      await signOut();
    } catch { setMessage('Não foi possível concluir o encerramento. Verifique a conexão e tente novamente.'); } finally { setBusy(false); }
  }
  function go(next) { setMessage(''); setPassword(''); setRepeat(''); setEmail(''); setPage(next); }
  async function changeEmail() {
    if (busy) return;
    const next = email.trim().toLowerCase();
    if (next.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next)) { setMessage('Informe um e-mail válido.'); return; }
    if (next === session.user.email?.toLowerCase()) { setMessage('Informe um e-mail diferente do atual.'); return; }
    setBusy(true); setMessage('');
    try {
      const { data, error } = await supabase.auth.updateUser({ email: next }, { emailRedirectTo: AUTH_REDIRECT });
      if (error) throw error;
      go('data');
      Alert.alert(data.user?.email === next ? 'E-mail alterado' : 'Confirme a alteração', data.user?.email === next ? 'Seu e-mail foi atualizado.' : 'Confira as mensagens enviadas ao endereço atual e ao novo e-mail. Siga as instruções para concluir a alteração.');
    } catch (e) { setMessage(authMessage(e)); } finally { setBusy(false); }
  }
  function row(title, detail, onPress, danger = false, icon = null) {
    return <Pressable accessibilityRole="button" disabled={busy} onPress={onPress} style={({ pressed }) => [c.row, pressed && { backgroundColor: '#2b3034' }]}>{icon && <View style={c.menuIcon}>{icon}</View>}<View style={{ flex: 1, gap: 6 }}><Text style={[c.rowTitle, danger && { color: '#f57878' }]}>{title}</Text>{!!detail && <Text style={c.detail}>{detail}</Text>}</View><Text style={c.chevron}>›</Text></Pressable>;
  }
  const title = page === 'menu' ? 'Minha conta' : page === 'data' ? 'Meus dados' : page === 'email' ? 'Alterar e-mail' : 'Alterar senha';
  return <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}><View style={s.header}><View><Text style={s.logo}>AUTO<Text style={{ color: '#fa4145' }}>LOG</Text></Text><Text style={{ color: '#8f9da5', fontSize: 10, marginTop: 3 }}>Combustível e gastos</Text></View></View><View style={c.header}><Pressable disabled={busy} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={12} style={c.back} onPress={() => page === 'menu' ? router.navigate('/') : go(page === 'data' ? 'menu' : 'data')}><Text style={c.backText}>‹</Text></Pressable><Text style={c.headerTitle}>{title}</Text></View><ScrollView contentContainerStyle={c.content} keyboardShouldPersistTaps="handled">
    {page === 'menu' ? <><View style={c.profile}><View style={c.avatar}><TabIcon name="account" color="#dbe5ec" size={36} /></View><View style={{ flex: 1 }}><Text style={c.profileTitle}>{session?.user.user_metadata?.full_name || 'Sua conta AutoLog'}</Text><Text style={c.profileEmail}>{session?.user.email}</Text></View></View><Text style={c.section}>CONTA E PREFERÊNCIAS</Text><View style={c.menuCards}>{row('Meus dados', 'E-mail e segurança da conta', () => go('data'), false, <TabIcon name="account" color="#c5d2dc" size={22} />)}{row('Meus veículos', 'Consumo e capacidade do tanque', () => router.navigate('/vehicles'), false, <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke="#c5d2dc" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><Path d="m5 8 2-5h10l2 5M3 8h18v10H3zM5 18v3m14-3v3M3 13h18" /><Circle cx="7" cy="11" r=".7" /><Circle cx="17" cy="11" r=".7" /></Svg>)}{row('Postos favoritos', 'Locais e preços salvos', () => router.navigate('/stations'), false, <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke="#c5d2dc" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><Path d="M4 21V3h10v18M2 21h14M6 6h6v5H6zM14 11h2v6a2 2 0 0 0 4 0V8l-3-3M18 6v4h2" /></Svg>)}</View></> : page === 'data' ? <><Text style={c.section}>INFORMAÇÕES DA CONTA</Text><View style={c.card}>{row('E-mail', session?.user.email, () => go('email'))}{row('Alterar senha', 'Atualize sua senha de acesso', () => go('password'))}</View><Text style={c.note}>Toque no e-mail para alterar o endereço.</Text><Text style={[c.section, { marginTop: 32 }]}>GERENCIAR CONTA</Text><View style={c.card}>{row(busy ? 'Encerrando…' : 'Encerrar a conta', 'Excluir permanentemente sua conta', () => Alert.alert('Encerrar sua conta?', 'Sua conta será excluída permanentemente e os registros desta conta serão removidos deste dispositivo. Esta ação não pode ser desfeita.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Encerrar conta', style: 'destructive', onPress: removeAccount }]), true)}</View></> : page === 'email' ? <View style={{ gap: 16 }}><Text style={c.intro}>Informe o novo endereço para receber a confirmação.</Text><View style={c.current}><Text style={c.section}>E-MAIL ATUAL</Text><Text selectable style={c.rowTitle}>{session?.user.email}</Text></View><Text style={c.section}>NOVO E-MAIL</Text><TextInput style={c.input} accessibilityLabel="Novo e-mail" value={email} onChangeText={setEmail} placeholder="seu@email.com" placeholderTextColor="#71808a" autoCapitalize="none" autoCorrect={false} autoComplete="email" keyboardType="email-address" editable={!busy} onSubmitEditing={changeEmail} /><Button disabled={busy} title={busy ? 'Enviando…' : 'Confirmar novo e-mail'} onPress={changeEmail} /></View> : <View style={{ gap: 16 }}><Text style={c.intro}>Escolha uma senha com pelo menos 8 caracteres.</Text><Text style={c.section}>NOVA SENHA</Text><PasswordField label="Nova senha" placeholder="Digite a nova senha" value={password} onChangeText={setPassword} autoComplete="new-password" disabled={busy} /><Text style={c.section}>CONFIRMAR SENHA</Text><PasswordField label="Repetir senha" placeholder="Repita a nova senha" value={repeat} onChangeText={setRepeat} autoComplete="new-password" disabled={busy} /><Button title={busy ? 'Salvando…' : 'Salvar nova senha'} disabled={busy} onPress={changePassword} /></View>}
    {!!message && <Text accessibilityRole="alert" style={[s.error, { marginTop: 20 }]}>{message}</Text>}
  </ScrollView>{page === 'menu' && <View style={c.signOutFooter}><Pressable accessibilityRole="button" disabled={busy} style={({ pressed }) => [c.signOutButton, pressed && { backgroundColor: '#49292c' }]} onPress={async () => { try { await signOut(); } catch (e) { Alert.alert('Acesso', authMessage(e)); } }}><Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#ff8287" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M9 4H4v16h5m5-12 4 4-4 4M8 12h13" /></Svg><Text style={c.signOutText}>Sair</Text></Pressable></View>}</SafeAreaView>;
}
const c = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14, marginBottom: 28 },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#303f4b', borderWidth: 1, borderColor: '#475b6b', alignItems: 'center', justifyContent: 'center' },
  profileTitle: { color: '#f2f4f5', fontSize: 19, fontWeight: '700', marginBottom: 7 },
  profileEmail: { color: '#9faeb9', fontSize: 13, lineHeight: 20 },
  menuCards: { borderWidth: 1, borderColor: '#323a40', borderRadius: 12, backgroundColor: '#20262a', overflow: 'hidden' },
  menuIcon: { width: 32, alignItems: 'center', justifyContent: 'center' },
  signOutFooter: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18, borderTopWidth: 1, borderTopColor: '#292f33' },
  signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 50, borderRadius: 12, borderWidth: 1, borderColor: '#67363b', backgroundColor: '#2d1f22' },
  signOutText: { color: '#ff8287', fontSize: 15, fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#292f33' },
  back: { width: 40, minHeight: 40, justifyContent: 'center' }, backText: { color: '#f4f5f6', fontSize: 36, lineHeight: 38 },
  headerTitle: { color: '#f4f5f6', fontSize: 20, fontWeight: '700', flex: 1 },
  content: { padding: 20, paddingBottom: 40 }, intro: { color: '#98a4ad', fontSize: 15, lineHeight: 23, marginBottom: 24 },
  section: { color: '#96a2ab', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  card: { borderRadius: 16, borderWidth: 1, borderColor: '#323a40', backgroundColor: '#20262a', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, minHeight: 72, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#343d43' },
  rowTitle: { color: '#f2f4f5', fontSize: 16, fontWeight: '600' }, detail: { color: '#99a6af', fontSize: 13, lineHeight: 20 }, chevron: { fontSize: 26, color: '#94a0aa' },
  note: { fontSize: 12, color: '#85939d', lineHeight: 19, marginTop: 12 }, current: { padding: 16, borderRadius: 12, backgroundColor: '#1b2024' },
  input: { paddingHorizontal: 16, paddingVertical: 16, minHeight: 54, fontSize: 16, color: '#f2f4f5', backgroundColor: '#242a2e', borderWidth: 1, borderColor: '#3b454d', borderRadius: 12 },
});
