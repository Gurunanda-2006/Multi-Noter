import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../services/auth/useAuth';
import { LoadingIndicator } from '../components/LoadingIndicator';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingIndicator message="Initializing..." fullScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)/" />;
}
