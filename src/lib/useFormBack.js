import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
export function useFormBack(close) {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => { close(); return true; });
    return () => listener.remove();
  }, [close]);
}
