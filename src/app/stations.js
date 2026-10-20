import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import { Alert } from '../lib/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Path } from 'react-native-svg';
import { Button, Field, uiStyles as s } from '../components/Dashboard';
import { useStore } from '../lib/store';
import { useFormBack } from '../lib/useFormBack';
import { num, parse } from '../lib/model';
import { validateStation } from '../lib/stations';

function formatPriceDate(value) {
  const date = new Date(value);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}
function PriceDate({ value }) {
  return <View style={c.dateBadge} accessibilityLabel={`Data do preço: ${formatPriceDate(value)}`}><Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#9baab4" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="5" width="18" height="16" rx="2" /><Path d="M7 3v4m10-4v4M3 11h18" /></Svg><Text style={c.dateValue}>{formatPriceDate(value)}</Text></View>;
}

function StationForm({ entry, close }) {
  useFormBack(close);
  const { stations, persistStations } = useStore();
  const [values, setValues] = useState({ name: entry?.name || '', address: entry?.address || '', gasoline: entry?.gasoline ? num(entry.gasoline, 3) : '', ethanol: entry?.ethanol ? num(entry.ethanol, 3) : '' });
  const [priceDates, setPriceDates] = useState({ gasoline: entry?.gasolineUpdatedAt || (entry?.gasoline ? entry.updatedAt : null), ethanol: entry?.ethanolUpdatedAt || (entry?.ethanol ? entry.updatedAt : null) });
  const [fuel, setFuel] = useState(entry?.ethanol && !entry?.gasoline ? 'ethanol' : 'gasoline');
  const [saving, setSaving] = useState(false), [error, setError] = useState('');
  const change = (field, value) => { if (['gasoline', 'ethanol'].includes(field)) setPriceDates(old => ({ ...old, [field]: value.trim() ? new Date().toISOString() : null })); setValues(old => ({ ...old, [field]: value })); setError(''); };
  async function save() {
    if (saving) return;
    const station = { id: entry?.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`, name: values.name.trim().slice(0, 100), address: values.address.trim().slice(0, 250), gasoline: values.gasoline.trim() ? parse(values.gasoline) : null, ethanol: values.ethanol.trim() ? parse(values.ethanol) : null, gasolineUpdatedAt: values.gasoline.trim() ? priceDates.gasoline : null, ethanolUpdatedAt: values.ethanol.trim() ? priceDates.ethanol : null, updatedAt: new Date().toISOString() };
    const message = validateStation(station); if (message) { setError(message); return; }
    setSaving(true);
    if (await persistStations([...stations.filter(item => item.id !== station.id), station])) close();
    setSaving(false);
  }
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><View style={[s.modalHead, { padding: 22 }]}><Text style={s.modalTitle}>{entry ? 'EDITAR POSTO' : 'NOVO POSTO'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Fechar cadastro de posto" hitSlop={15} onPress={close}><Text style={s.cross}>×</Text></Pressable></View><ScrollView contentContainerStyle={[s.form, { paddingHorizontal: 22 }]} keyboardShouldPersistTaps="handled"><Text style={[s.hint, { marginBottom: 24 }]}>Guarde o local do posto e os preços que você encontrou.</Text><Field label="NOME DO POSTO" value={values.name} placeholder="Ex.: Posto Avenida" onChangeText={v => change('name', v)} /><Field label="LOCAL / ENDEREÇO" value={values.address} placeholder="Rua, número, bairro e cidade" onChangeText={v => change('address', v)} /><Text style={s.label}>COMBUSTÍVEL</Text><View style={[s.row, { marginBottom: 24 }]}><Button equal secondary={fuel !== 'gasoline'} title="Gasolina" onPress={() => setFuel('gasoline')} /><Button equal secondary={fuel !== 'ethanol'} title="Etanol" onPress={() => setFuel('ethanol')} /></View><Field label={fuel === 'gasoline' ? 'GASOLINA (R$/L)' : 'ETANOL (R$/L)'} numeric value={values[fuel]} placeholder="Ex.: 6,290" onChangeText={v => change(fuel, v)} />{values[fuel].trim() && priceDates[fuel] && <Text style={[s.hint, { marginBottom: 16 }]}>Data do preço: {formatPriceDate(priceDates[fuel])} · automática</Text>}<Text style={s.hint}>Informe pelo menos um preço. Para cadastrar os dois, selecione e preencha cada combustível.</Text>{!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}<Text style={s.hint}>Os preços são informados por você. Atualize quando consultar o posto novamente.</Text></ScrollView><View style={[s.saveBar, { padding: 22 }]}><Button disabled={saving} title={saving ? 'Salvando…' : 'Salvar posto'} onPress={save} /></View></KeyboardAvoidingView>;
}
export default function Stations() {
  const { stations, ready, loadError, persistStations } = useStore();
  const [form, setForm] = useState(null);
  async function openMaps(station) {
    try { await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${station.name} ${station.address}`)}`); }
    catch { Alert.alert('Não foi possível abrir o Maps', 'Verifique se há um aplicativo de mapas ou navegador disponível.'); }
  }
  if (!ready) return <SafeAreaView style={[s.screen, s.empty]}>{loadError ? <Text style={s.error}>Não foi possível carregar os dados. Reabra o app.</Text> : <ActivityIndicator color="#fa4145" />}</SafeAreaView>;
  return <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}><View style={s.header}><View><Text style={s.logo}>AUTO<Text style={{ color: '#fa4145' }}>LOG</Text></Text><Text style={{ color: '#8f9da5', fontSize: 10, marginTop: 3 }}>Combustível e gastos</Text></View></View>{!form && <ScrollView contentContainerStyle={s.content}><Text style={s.eyebrow}>SEUS PONTOS DE PARADA</Text><Text style={s.heading}>Postos e preços</Text><Text style={s.subtitle}>Consulte os locais e os valores de gasolina e álcool/etanol que você cadastrou.</Text><Button title="+ Adicionar posto" onPress={() => setForm({})} /><View style={{ marginTop: 24 }}>{[...stations].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).map(station => <View key={station.id} style={[s.record, c.station]}><Text style={[s.sectionTitle, { fontSize: 19, lineHeight: 26 }]}>{station.name}</Text><Text style={[s.recordSub, { lineHeight: 20 }]}>{station.address}</Text><View style={c.prices}>{[['gasoline', 'Gasolina'], ['ethanol', 'Etanol']].filter(([key]) => station[key] > 0).map(([key, label]) => <View key={key} style={c.priceCard}><Text style={c.fuel}>{label}</Text><View style={c.priceLine}><Text style={c.currency}>R$</Text><Text style={c.amount}>{num(station[key], 3)}</Text><Text style={c.unit}>/L</Text></View><PriceDate value={station[key + 'UpdatedAt'] || station.updatedAt} /></View>)}</View><Pressable accessibilityRole="button" onPress={() => openMaps(station)} style={c.mapButton}><Text style={c.mapText}>Abrir no Google Maps</Text><Text style={c.mapText}>↗</Text></Pressable><View style={c.actions}><Pressable accessibilityRole="button" style={c.action} onPress={() => setForm(station)}><Text style={c.edit}>Editar posto</Text></Pressable><View style={c.divider} /><Pressable accessibilityRole="button" style={c.action} onPress={() => Alert.alert('Excluir posto?', 'O local e seus preços serão removidos.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: () => persistStations(stations.filter(item => item.id !== station.id)) }])}><Text style={c.remove}>Excluir</Text></Pressable></View></View>)}{!stations.length && <View style={s.empty}><Text style={s.emptyIcon}>▣</Text><Text style={s.muted}>Nenhum posto cadastrado. Adicione o local e os preços para consultar depois.</Text></View>}</View><Text style={s.footer}>● Postos salvos somente neste dispositivo, por conta</Text></ScrollView>}{form && <StationForm entry={form.id ? form : null} close={() => setForm(null)} />}</SafeAreaView>;
}

const c = StyleSheet.create({
  station: { padding: 18, borderRadius: 18, marginBottom: 18 },
  prices: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20, marginBottom: 16 },
  priceCard: { flexGrow: 1, flexBasis: 140, minWidth: 0, backgroundColor: '#252c30', borderRadius: 12, padding: 14 },
  fuel: { color: '#c4cdd2', fontSize: 13, fontWeight: '600' },
  priceLine: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 4, marginVertical: 10 },
  currency: { color: '#c4cdd2', fontSize: 13, fontWeight: '600' },
  amount: { color: '#ffffff', fontSize: 27, fontWeight: '800' },
  unit: { color: '#94a2ab', fontSize: 12 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, backgroundColor: '#1b2226', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 6, marginTop: 2 },
  dateValue: { color: '#b5c1c9', fontSize: 11, fontWeight: '500', fontVariant: ['tabular-nums'] },
  mapButton: { minHeight: 46, borderRadius: 10, backgroundColor: '#30383e', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  mapText: { color: '#e2e7ea', fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  action: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  divider: { width: 1, height: 16, backgroundColor: '#354047' },
  edit: { color: '#aebbc4', fontSize: 12, fontWeight: '600' },
  remove: { color: '#ef8b8d', fontSize: 12, fontWeight: '600' },
});
