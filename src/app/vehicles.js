import React, { useState, useCallback } from 'react';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Alert } from '../lib/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, uiStyles as s } from '../components/Dashboard';
import { useStore } from '../lib/store';
import { useFormBack } from '../lib/useFormBack';
import { num, parse } from '../lib/model';
import { validateVehicle } from '../lib/vehicles';

function VehicleForm({ entry, close, initialType, onSaved }) {
  useFormBack(close);
  const { vehicles, persistVehicles } = useStore();
  const [values, setValues] = useState({ type: entry?.type || initialType || 'motorcycle', brand: entry?.brand || '', model: entry?.model || '', capacity: entry ? num(entry.capacity, 2) : '', city: entry ? num(entry.city, 2) : '', highway: entry ? num(entry.highway, 2) : '' });
  const [error, setError] = useState(''), [saving, setSaving] = useState(false);
  const change = (field, value) => { setValues(old => ({ ...old, [field]: value })); setError(''); };
  async function save() {
    if (saving) return;
    const v = { id: entry?.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`, ...values, brand: values.brand.trim().slice(0, 80), model: values.model.trim().slice(0, 100), capacity: parse(values.capacity), city: parse(values.city), highway: parse(values.highway) };
    const message = validateVehicle(v); if (message) { setError(message); return; }
    setSaving(true);
    if (await persistVehicles([...vehicles.filter(item => item.id !== v.id), v])) { if (onSaved) onSaved(v); else close(); }
    setSaving(false);
  }
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><View style={[s.modalHead, { padding: 22 }]}><Text style={s.modalTitle}>{entry ? 'EDITAR VEÍCULO' : 'NOVO VEÍCULO'}</Text><Pressable accessibilityLabel="Fechar cadastro" hitSlop={15} onPress={close}><Text style={s.cross}>×</Text></Pressable></View><ScrollView contentContainerStyle={[s.form, { paddingHorizontal: 22 }]} keyboardShouldPersistTaps="handled"><View style={[s.row, { marginBottom: 24 }]}><Button equal title="Moto" selected={values.type === 'motorcycle'} secondary={values.type !== 'motorcycle'} onPress={() => change('type', 'motorcycle')} /><Button equal title="Carro" selected={values.type === 'car'} secondary={values.type !== 'car'} onPress={() => change('type', 'car')} /></View><Field label="MARCA" value={values.brand} placeholder="Ex.: Honda" onChangeText={v => change('brand', v)} /><Field label="MODELO" value={values.model} placeholder="Ex.: CG 160" onChangeText={v => change('model', v)} /><Field label="CAPACIDADE DO TANQUE (L)" numeric value={values.capacity} placeholder="Ex.: 14" onChangeText={v => change('capacity', v)} /><Field label="CONSUMO URBANO (km/l)" numeric value={values.city} placeholder="Ex.: 30" onChangeText={v => change('city', v)} /><Field label="CONSUMO ESTRADA (km/l)" numeric value={values.highway} placeholder="Ex.: 35" onChangeText={v => change('highway', v)} />{!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}<Text style={s.hint}>Informe os consumos do seu veículo com o combustível que você utiliza.</Text></ScrollView><View style={[s.saveBar, { padding: 22 }]}><Button disabled={saving} title={saving ? 'Salvando…' : 'Salvar veículo'} onPress={save} /></View></KeyboardAvoidingView>;
}
export default function Vehicles() {
  const { newVehicle, returnTo, vehicleType } = useLocalSearchParams();
  const { vehicles, ready, loadError, persistVehicles, vehicleSyncStatus } = useStore();
  const [form, setForm] = useState(null);
  useFocusEffect(useCallback(() => { if (newVehicle === '1') { setForm({ returnTo, initialType: vehicleType === 'car' ? 'car' : 'motorcycle' }); router.setParams({ newVehicle: undefined, returnTo: undefined, vehicleType: undefined }); } }, [newVehicle, returnTo, vehicleType]));
  if (!ready) return <SafeAreaView style={[s.screen, s.empty]}>{loadError ? <Text style={s.error}>Não foi possível carregar os dados. Reabra o app.</Text> : <ActivityIndicator color="#fa4145" />}</SafeAreaView>;
  return <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}><View style={s.header}><View><Text style={s.logo}>AUTO<Text style={{ color: '#fa4145' }}>LOG</Text></Text><Text style={{ color: '#8f9da5', fontSize: 10, marginTop: 3 }}>Combustível e gastos</Text></View></View>{!form && <ScrollView contentContainerStyle={s.content}><Text style={s.eyebrow}>SUA GARAGEM</Text><Text style={s.heading}>Meus veículos</Text><Text style={s.subtitle}>Cadastre sua moto ou carro para calcular sem preencher tudo novamente.</Text><View style={{ marginBottom: 18 }}><Text style={[s.hint, { marginBottom: 10 }]}>{vehicleSyncStatus === 'synced' ? 'Veículos sincronizados com sua conta.' : vehicleSyncStatus === 'syncing' ? 'Sincronizando veículos…' : vehicleSyncStatus === 'pending' ? 'Alterações salvas. Aguardando sincronização.' : 'Sem sincronização no momento. Seus veículos estão salvos neste dispositivo; tentaremos novamente.'}</Text></View><Button title="+ Cadastrar veículo" onPress={() => setForm({})} /><View style={{ marginTop: 24 }}>{vehicles.map(v => <View style={s.record} key={v.id}><Text style={s.eyebrow}>{v.type === 'motorcycle' ? 'MOTO' : 'CARRO'}</Text><Text style={s.sectionTitle}>{v.brand} {v.model}</Text><Text style={s.recordSub}>Tanque: {num(v.capacity)} L</Text><Text style={s.recordSub}>Urbano: {num(v.city)} km/l · Estrada: {num(v.highway)} km/l</Text><View style={{ marginTop: 20 }}><Button title="Calcular combustível" onPress={() => router.navigate({ pathname: '/calculate', params: { vehicleId: v.id } })} /></View><View style={[s.row, { marginTop: 20 }]}><Button equal secondary title="Editar" onPress={() => setForm(v)} /><Button equal secondary title="Excluir" onPress={() => Alert.alert('Excluir veículo?', `O veículo ${v.brand} ${v.model} será removido da sua conta. Os abastecimentos existentes serão mantidos.`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: () => persistVehicles(vehicles.filter(item => item.id !== v.id)) }])} /></View></View>)}{!vehicles.length && <View style={s.empty}><Text style={s.emptyIcon}>▣</Text><Text style={s.muted}>Sua garagem está vazia. Adicione o primeiro veículo para começar.</Text></View>}</View></ScrollView>}{form && <VehicleForm entry={form.id ? form : null} initialType={form.initialType} close={() => { setForm(null); if (form.returnTo === 'calculate') router.navigate('/calculate'); }} onSaved={v => { setForm(null); if (form.returnTo === 'calculate') router.navigate({ pathname: '/calculate', params: { vehicleId: v.id } }); }} />}</SafeAreaView>;
}
