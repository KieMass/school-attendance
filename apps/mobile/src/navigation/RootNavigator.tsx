import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { AuthNavigator } from './AuthNavigator';
import { StudentNavigator } from './StudentNavigator';
import { ParentNavigator } from './ParentNavigator';
import { SecurityNavigator } from './SecurityNavigator';

/** Staff and Admin are served by the web admin console per the spec; the
 * mobile app covers Student, Parent and Security, the three roles that act
 * from a phone in the field (submitting requests, approving on the go,
 * scanning at the gate). */
export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user && <AuthNavigator />}
      {user?.role === 'STUDENT' && <StudentNavigator />}
      {user?.role === 'PARENT' && <ParentNavigator />}
      {user?.role === 'SECURITY' && <SecurityNavigator />}
      {(user?.role === 'STAFF' || user?.role === 'ADMIN') && <AuthNavigator />}
    </NavigationContainer>
  );
}
