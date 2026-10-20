import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FuelCalculator } from '../components/Dashboard';
import { useStore } from '../lib/store';
import { cycles } from '../lib/model';

export default function Calculate() {
  const { vehicleId } = useLocalSearchParams();
  const initialVehicleId = Array.isArray(vehicleId) ? vehicleId[0] : vehicleId;
  const { entries, ready, loadError } = useStore();
  const intervals = cycles(entries);
  const average = intervals.length
    ? intervals.reduce((sum, c) => sum + c.distance, 0) / intervals.reduce((sum, c) => sum + c.liters, 0)
    : null;
  if (!ready) return <SafeAreaView style={{ flex: 1, backgroundColor: '#111314', alignItems: 'center', justifyContent: 'center' }}>{loadError ? <Text style={{ color: '#ff8b8f' }}>Não foi possível carregar os dados. Reabra o app.</Text> : <ActivityIndicator color="#fa4145" />}</SafeAreaView>;
  return <FuelCalculator average={average} initialVehicleId={initialVehicleId} />;
}
