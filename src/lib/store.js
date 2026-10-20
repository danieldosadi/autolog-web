import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {  } from 'react-native';
import { Alert } from './alert';
import { KEY, readBackup } from './model';
import { VEHICLES_KEY, readVehicles } from './vehicles';
import { STATIONS_KEY, readStations } from './stations';
const Store = createContext(null);
export function StoreProvider({ children, userId }) {
  const [entries, setEntries] = useState([]), [ready, setReady] = useState(false), [loadError, setLoadError] = useState(false);
  const writing = useRef(false), writingVehicles = useRef(false);
  const [vehicles, setVehicles] = useState([]);
  const [stations, setStations] = useState([]);
  const writingStations = useRef(false);
  const recordsKey = `${KEY}.${userId}`, vehiclesKey = `${VEHICLES_KEY}.${userId}`, stationsKey = `${STATIONS_KEY}.${userId}`;
  useEffect(() => {
    let alive = true;
    async function load() {
      const [raw, savedVehicles, owner, savedStations] = await Promise.all([AsyncStorage.getItem(recordsKey), AsyncStorage.getItem(vehiclesKey), AsyncStorage.getItem('autolog.legacy-owner.v1'), AsyncStorage.getItem(stationsKey)]);
      const loadedStations = readStations(savedStations);
      let loadedEntries = raw ? readBackup({ app: 'AutoLog', version: 1, entries: JSON.parse(raw) }) : [];
      let loadedVehicles = readVehicles(savedVehicles);
      if (raw === null && savedVehicles === null && (!owner || owner === userId)) {
        const [oldEntries, oldVehicles] = await Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(VEHICLES_KEY)]);
        if ((oldEntries && oldEntries !== '[]') || (oldVehicles && oldVehicles !== '[]')) {
          const accept = await new Promise(resolve => Alert.alert('Seus registros anteriores', 'Deseja vincular os veículos e abastecimentos locais anteriores a esta conta?', [{ text: 'Agora não', style: 'cancel', onPress: () => resolve(false) }, { text: 'Vincular', onPress: () => resolve(true) }], { cancelable: false }));
          if (accept && alive) {
            loadedEntries = oldEntries ? readBackup({ app: 'AutoLog', version: 1, entries: JSON.parse(oldEntries) }) : [];
            loadedVehicles = readVehicles(oldVehicles);
            await AsyncStorage.setItem('autolog.legacy-owner.v1', userId);
            await AsyncStorage.multiSet([[recordsKey, JSON.stringify(loadedEntries)], [vehiclesKey, JSON.stringify(loadedVehicles)]]);
          }
        }
      }
      if (alive) { setEntries(loadedEntries); setVehicles(loadedVehicles); setStations(loadedStations); setReady(true); }
    }
    load().catch(() => { if (alive) { setLoadError(true); Alert.alert('Armazenamento indisponível', 'Não foi possível carregar seus registros. Feche e abra o aplicativo novamente.'); } });
    return () => { alive = false; };
  }, [recordsKey, vehiclesKey, stationsKey, userId]);
  async function persist(next) {
    if (!ready || writing.current) return false;
    writing.current = true;
    try { await AsyncStorage.setItem(recordsKey, JSON.stringify(next)); setEntries(next); return true; }
    catch { Alert.alert('Não foi possível salvar', 'Verifique o espaço livre do dispositivo e tente novamente.'); return false; }
    finally { writing.current = false; }
  }
  async function persistVehicles(next) {
    if (!ready || writingVehicles.current) return false;
    writingVehicles.current = true;
    try { const checked = readVehicles(JSON.stringify(next)); await AsyncStorage.setItem(vehiclesKey, JSON.stringify(checked)); setVehicles(checked); return true; }
    catch { Alert.alert('Não foi possível salvar o veículo', 'Verifique os dados e o espaço livre do dispositivo.'); return false; }
    finally { writingVehicles.current = false; }
  }
  async function persistStations(next) {
    if (!ready || writingStations.current) return false;
    writingStations.current = true;
    try { const checked = readStations(JSON.stringify(next)); await AsyncStorage.setItem(stationsKey, JSON.stringify(checked)); setStations(checked); return true; }
    catch { Alert.alert('Não foi possível salvar o posto', 'Verifique os dados e o espaço livre do dispositivo.'); return false; }
    finally { writingStations.current = false; }
  }
  return <Store.Provider value={{ entries, ready, loadError, persist, vehicles, persistVehicles, stations, persistStations }}>{children}</Store.Provider>;
}
export const useStore = () => useContext(Store);
