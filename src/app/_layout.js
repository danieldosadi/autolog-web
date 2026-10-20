import React from 'react';
import { Tabs } from 'expo-router';
import { View, ActivityIndicator, Platform } from 'react-native';
import { AuthProvider, useAuth } from '../lib/auth';
import Login, { ResetPassword } from '../components/Login';
import TabIcon from '../components/TabIcon';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from '../lib/store';
function AuthenticatedApp() {
  const { session, loading, recovering } = useAuth();
  if (loading) return <View style={{ flex: 1, backgroundColor: '#111314', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#fa4145" /></View>;
  if (session && recovering) return <ResetPassword />;
  if (!session) return <Login />;
  return <StoreProvider key={session.user.id} userId={session.user.id}><StatusBar style="light" /><Tabs screenOptions={{ headerShown: false, tabBarLabelStyle: { fontSize: 10 }, tabBarActiveTintColor: '#fa4145', tabBarInactiveTintColor: '#89969e', tabBarStyle: { backgroundColor: '#1b1e20', borderTopColor: '#303538' }, sceneStyle: { backgroundColor: '#111314' } }}><Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <TabIcon name="dashboard" color={color} size={size} /> }} /><Tabs.Screen name="history" options={{ title: 'Histórico', tabBarIcon: ({ color, size }) => <TabIcon name="history" color={color} size={size} /> }} /><Tabs.Screen name="calculate" options={{ title: 'Calcular', tabBarIcon: ({ color, size }) => <TabIcon name="calculate" color={color} size={size} /> }} /><Tabs.Screen name="vehicles" options={{ href: null }} /><Tabs.Screen name="stations" options={{ href: null }} /><Tabs.Screen name="account" options={{ title: 'Minha conta', tabBarIcon: ({ color, size }) => <TabIcon name="account" color={color} size={size} /> }} /><Tabs.Screen name="auth/callback" options={{ href: null }} /></Tabs></StoreProvider>;
}

export default function Layout() { return <AuthProvider><View style={{ flex: 1, backgroundColor: '#0c0f11' }}><View style={{ flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 1100 : undefined, alignSelf: 'center' }}><StatusBar style="light" /><AuthenticatedApp /></View></View></AuthProvider>; }
