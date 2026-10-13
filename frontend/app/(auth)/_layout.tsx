import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../components/design/theme';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
  );
}
