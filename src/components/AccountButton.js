import React from 'react';
import { Pressable, Text } from 'react-native';
import { router } from 'expo-router';
export default function AccountButton() {
  return <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.navigate('/account')}><Text style={{ color: '#91a0aa', fontWeight: '600', fontSize: 12 }}>Minha conta</Text></Pressable>;
}
