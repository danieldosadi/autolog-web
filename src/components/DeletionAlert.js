import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { destructiveAlerts } from '../lib/destructive-alerts';

export default function DeletionAlert() {
  const alert = useSyncExternalStore(destructiveAlerts.subscribe, destructiveAlerts.snapshot, () => null);
  return alert ? <Confirmation key={alert.title + alert.message} alert={alert} /> : null;
}
function Confirmation({ alert }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const running = useRef(false), cancelRef = useRef(null);
  const cancelButton = alert.buttons.find(button => button.style === 'cancel');
  const destructive = alert.buttons.find(button => button.style === 'destructive');
  function cancel() { if (running.current) return; destructiveAlerts.close(); cancelButton?.onPress?.(); }
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const previous = document.activeElement;
    const frame = requestAnimationFrame(() => cancelRef.current?.focus?.());
    return () => { cancelAnimationFrame(frame); previous?.focus?.(); };
  }, []);
  async function confirm() {
    if (running.current) return;
    running.current = true; setBusy(true); setError('');
    try {
      const result = await destructive?.onPress?.();
      if (result === false) { setError('Não foi possível excluir. Tente novamente.'); return; }
      destructiveAlerts.close();
    } catch { setError('Não foi possível excluir. Verifique a conexão e tente novamente.'); }
    finally { running.current = false; setBusy(false); }
  }
  return <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={cancel}><View style={s.overlay}><View accessibilityViewIsModal style={s.card}><View style={s.icon}><Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#ff8c90" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><Path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" /></Svg></View><Text accessibilityRole="header" style={s.title}>{alert.title}</Text><Text style={s.message}>{alert.message}</Text>{!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}<View style={s.actions}><Pressable ref={cancelRef} accessibilityRole="button" disabled={busy} onPress={cancel} style={({ pressed }) => [s.button, s.cancel, pressed && s.pressed, busy && s.disabled]}><Text style={s.cancelText}>{cancelButton?.text || 'Cancelar'}</Text></Pressable><Pressable accessibilityRole="button" disabled={busy} onPress={confirm} style={({ pressed }) => [s.button, s.delete, pressed && s.pressed, busy && s.disabled]}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={s.deleteText}>{destructive?.text || 'Excluir'}</Text>}</Pressable></View></View></View></Modal>;
}
const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.74)' },
  card: { width: '100%', maxWidth: 420, backgroundColor: '#20262a', borderWidth: 1, borderColor: '#3b444b', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
  icon: { height: 56, width: 56, borderRadius: 18, backgroundColor: '#492a30', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { color: '#f4f6f7', fontSize: 22, lineHeight: 29, fontWeight: '700' },
  message: { color: '#a9b5be', fontSize: 14, lineHeight: 22, marginTop: 12 },
  error: { color: '#ff9ca0', fontSize: 13, lineHeight: 20, marginTop: 14 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 28 },
  button: { flex: 1, minHeight: 48, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: '#30383e', borderWidth: 1, borderColor: '#47515a' },
  delete: { backgroundColor: '#dc4048' },
  cancelText: { color: '#e3e9ed', fontSize: 14, fontWeight: '600' },
  deleteText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.8 }, disabled: { opacity: 0.6 },
});
