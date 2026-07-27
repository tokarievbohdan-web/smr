import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, space, fonts } from '../../theme';
import { Button } from '../../ui';
import { useAuth } from '../../AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function BlockedScreen() {
  const { signOut, user } = useAuth();
  return (
    <View style={s.wrap}>
      <View style={s.icon}><Ionicons name="lock-closed-outline" size={30} color="#B42318" /></View>
      <Text style={s.title}>Доступ обмежено</Text>
      <Text style={s.text}>Ваш акаунт {user?.email ? `(${user.email}) ` : ''}призупинено. Якщо це помилка — звʼяжіться з підтримкою Sport Market Review.</Text>
      <View style={{ height: space(6) }} />
      <Button label="Написати в підтримку" variant="secondary" onPress={() => {}} />
      <View style={{ height: 10 }} />
      <Button label="Вийти" variant="ghost" onPress={signOut} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: space(8) },
  icon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FBE9E7', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontFamily: fonts.extra, color: colors.ink, fontSize: 22, letterSpacing: -0.4 },
  text: { fontFamily: fonts.med, color: colors.dim, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10 },
});
