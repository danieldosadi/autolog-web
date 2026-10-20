import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, authMessage } from '../lib/auth';
import Svg, { Path, Circle, Line } from 'react-native-svg';

export function PasswordField({ label, value, onChangeText, placeholder, autoComplete, disabled }) {
  const [visible, setVisible] = useState(false);
  return <View style={s.passwordContainer}><TextInput style={[s.input, { paddingRight: 58 }]} accessibilityLabel={label} value={value} onChangeText={onChangeText} secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false} autoComplete={autoComplete} placeholder={placeholder} placeholderTextColor="#63717b" editable={!disabled} /><Pressable disabled={disabled} accessibilityRole="button" accessibilityLabel={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`} accessibilityState={{ selected: visible, disabled }} onPress={() => setVisible(v => !v)} style={s.eyeButton}><Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke="#91a0aa" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><Circle cx="12" cy="12" r="3" />{visible && <Line x1="3" y1="3" x2="21" y2="21" />}</Svg></Pressable></View>;
}

export default function Login() {
  const { requestPasswordReset, checkEmail, emailLogin, signUp, socialLogin, configured, initialError } = useAuth();
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [confirmation, setConfirmation] = useState('');
  const [step, setStep] = useState('email'), [busy, setBusy] = useState(false), [message, setMessage] = useState(initialError);
  const running = useRef(false);
  function editEmail() { setStep('email'); setPassword(''); setConfirmation(''); setMessage(''); }
  async function run(action) { if (running.current) return; running.current = true; setBusy(true); setMessage(''); try { await action(); } catch (e) { setMessage(authMessage(e)); } finally { running.current = false; setBusy(false); } }
  async function submit() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.trim().length > 254) { setMessage('Informe um e-mail válido.'); return; }
    if (step === 'forgot') {
      await run(async () => { await requestPasswordReset(email); setStep('resetSent'); setMessage('Se houver uma conta para este e-mail, você receberá um link. Abra-o neste celular para definir uma nova senha. Confira também o spam.'); });
      return;
    }
    if (step === 'resetSent') { editEmail(); return; }
    if (step === 'email') {
      await run(async () => { const exists = await checkEmail(email); setEmail(email.trim().toLowerCase()); setPassword(''); setConfirmation(''); setStep(exists ? 'login' : 'register'); });
      return;
    }
    if (step === 'confirmation') { setStep('login'); setMessage(''); return; }
    if (!password || (step === 'register' && password.length < 8)) { setMessage(step === 'register' ? 'Use uma senha com pelo menos 8 caracteres.' : 'Informe sua senha.'); return; }
    if (step === 'register' && password !== confirmation) { setMessage('As senhas não coincidem.'); return; }
    await run(async () => {
      if (step === 'register') {
        const active = await signUp(email, password);
        if (!active) { setPassword(''); setConfirmation(''); setStep('confirmation'); setMessage('Confira sua caixa de entrada e confirme o e-mail para ativar a conta.'); }
      } else await emailLogin(email, password);
    });
  }
  const title = step === 'forgot' ? 'Recuperar senha.' : step === 'resetSent' ? 'Confira seu e-mail.' : step === 'login' ? 'Bem-vindo de volta.' : step === 'register' ? 'Crie sua senha.' : step === 'confirmation' ? 'Confirme seu e-mail.' : 'Entre ou crie sua conta.';
  const description = step === 'forgot' ? 'Informe seu e-mail para receber o link de recuperação.' : step === 'resetSent' ? 'Siga as instruções do e-mail para criar uma nova senha.' : step === 'login' ? 'Sua conta foi encontrada. Digite a senha para continuar.' : step === 'register' ? 'Este e-mail ainda não tem cadastro. Escolha sua senha para criar a conta.' : step === 'confirmation' ? 'Enviamos um link de confirmação para o seu e-mail.' : 'Digite seu e-mail para continuar.';
  return <SafeAreaView style={s.screen}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
    <Text style={s.logo}>AUTO<Text style={{ color: '#fa4145' }}>LOG</Text></Text><Text style={s.tag}>COMBUSTÍVEL E GASTOS</Text><Text style={s.title}>{title}</Text><Text style={s.description}>{description}</Text>
    {!configured && <Text style={s.notice}>O login está em preparação. A conexão com o serviço de autenticação ainda precisa ser configurada.</Text>}
    <Text style={s.label}>E-MAIL</Text><TextInput style={s.input} accessibilityLabel="E-mail" value={email} onChangeText={value => { setEmail(value); setMessage(''); }} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" placeholder="voce@exemplo.com" placeholderTextColor="#63717b" editable={!busy && (step === 'email' || step === 'forgot')} onSubmitEditing={step === 'email' ? submit : undefined} />
    {step !== 'email' && <Pressable disabled={busy} onPress={editEmail} accessibilityRole="button" style={{ alignSelf: 'flex-end', paddingVertical: 12 }}><Text style={s.link}>Alterar e-mail</Text></Pressable>}
    {(step === 'login' || step === 'register') && <>
      <Text style={s.label}>SENHA</Text><PasswordField key={step} label="Senha" value={password} onChangeText={setPassword} autoComplete={step === 'register' ? 'new-password' : 'current-password'} placeholder={step === 'register' ? 'Mínimo de 8 caracteres' : 'Sua senha'} disabled={busy} />
      {step === 'register' && <><Text style={s.label}>REPETIR SENHA</Text><PasswordField label="Repetir senha" value={confirmation} onChangeText={setConfirmation} autoComplete="new-password" placeholder="Digite a senha novamente" disabled={busy} /></>}
    </>}
    <Pressable disabled={busy || !configured} onPress={submit} style={[s.primary, (busy || !configured) && s.disabled]} accessibilityRole="button"><Text style={s.buttonText}>{busy ? 'Aguarde…' : step === 'forgot' ? 'Enviar link por e-mail' : step === 'resetSent' ? 'Voltar ao login' : step === 'email' ? 'Continuar' : step === 'register' ? 'Criar conta' : step === 'confirmation' ? 'Já confirmei, entrar' : 'Entrar'}</Text></Pressable>
    {step === 'login' && <Pressable disabled={busy || !configured} accessibilityRole="button" style={{ alignSelf: 'center', padding: 16 }} onPress={() => { setStep('forgot'); setPassword(''); setConfirmation(''); setMessage(''); }}><Text style={s.link}>Esqueci minha senha</Text></Pressable>}
    {!!message && <Text accessibilityLiveRegion="polite" style={s.notice}>{message}</Text>}
    <View style={s.separator}><View style={s.line} /><Text style={s.or}>ou acesse com</Text><View style={s.line} /></View>
    {[['google', 'Google'], ['azure', 'Microsoft']].map(([provider, label]) => <Pressable key={provider} accessibilityRole="button" disabled={busy || !configured} onPress={() => run(() => socialLogin(provider))} style={[s.social, (busy || !configured) && s.disabled]}><Text style={s.buttonText}>Acessar com {label}</Text></Pressable>)}
    <Text style={s.foot}>Seu acesso é autenticado pelo Supabase. Seus registros continuam salvos neste dispositivo.</Text>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
export function ResetPassword() {
  const { finishPasswordReset, signOut } = useAuth();
  const [password, setPassword] = useState(''), [repeat, setRepeat] = useState(''), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const running = useRef(false);
  async function save() {
    if (running.current) return;
    if (password.length < 8 || password !== repeat) { setMessage('Use pelo menos 8 caracteres e repita a mesma senha.'); return; }
    running.current = true; setBusy(true); setMessage('');
    try { await finishPasswordReset(password); } catch (e) { setMessage(authMessage(e)); } finally { running.current = false; setBusy(false); }
  }
  return <SafeAreaView style={s.screen}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><Text style={s.logo}>AUTO<Text style={{ color: '#fa4145' }}>LOG</Text></Text><Text style={s.title}>Defina sua nova senha.</Text><Text style={s.description}>Use pelo menos 8 caracteres.</Text><Text style={s.label}>NOVA SENHA</Text><PasswordField label="Nova senha" value={password} onChangeText={setPassword} autoComplete="new-password" placeholder="Nova senha" disabled={busy} /><Text style={s.label}>REPETIR SENHA</Text><PasswordField label="Repetir senha" value={repeat} onChangeText={setRepeat} autoComplete="new-password" placeholder="Repita a nova senha" disabled={busy} /><Pressable accessibilityRole="button" disabled={busy} style={[s.primary, busy && s.disabled]} onPress={save}><Text style={s.buttonText}>{busy ? 'Salvando…' : 'Salvar nova senha'}</Text></Pressable>{!!message && <Text accessibilityRole="alert" style={s.notice}>{message}</Text>}<Pressable accessibilityRole="button" disabled={busy} style={{ padding: 20, alignItems: 'center' }} onPress={async () => { try { await signOut(); } catch (e) { setMessage(authMessage(e)); } }}><Text style={s.link}>Cancelar e voltar ao login</Text></Pressable></ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
const s = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#111314' }, content: { padding: 26, paddingTop: 34, maxWidth: 520, width: '100%', alignSelf: 'center' }, logo: { color: '#fff', fontWeight: '900', fontSize: 28, letterSpacing: 5, marginBottom: 38 }, tag: { color: '#fa4145', fontSize: 10, letterSpacing: 2, fontWeight: '700' }, title: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 14 }, description: { color: '#91a0aa', fontSize: 14, lineHeight: 22, marginTop: 12, marginBottom: 25 }, label: { color: '#91a0aa', fontSize: 11, fontWeight: '700', marginTop: 16, marginBottom: 9 }, passwordContainer: { position: 'relative', marginBottom: 12 }, eyeButton: { position: 'absolute', right: 6, top: 0, bottom: 0, width: 44, alignItems: 'center', justifyContent: 'center' }, input: { backgroundColor: '#252b2f', borderWidth: 1, borderColor: '#343c41', borderRadius: 10, padding: 16, color: '#fff', fontSize: 17 }, primary: { backgroundColor: '#fa4145', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 8 }, buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 }, disabled: { opacity: .5 }, notice: { color: '#eeb4a5', backgroundColor: '#342521', padding: 14, borderRadius: 9, fontSize: 12, lineHeight: 20, marginTop: 15 }, link: { color: '#fa4145', fontSize: 13 }, separator: { flexDirection: 'row', gap: 12, alignItems: 'center', marginVertical: 25 }, line: { height: 1, backgroundColor: '#343c41', flex: 1 }, or: { color: '#7c8b95', fontSize: 11 }, social: { backgroundColor: '#202629', borderWidth: 1, borderColor: '#343c41', alignItems: 'center', padding: 16, borderRadius: 10, marginBottom: 12 }, foot: { color: '#697c86', fontSize: 11, lineHeight: 18, textAlign: 'center', marginBottom: 20 } });

