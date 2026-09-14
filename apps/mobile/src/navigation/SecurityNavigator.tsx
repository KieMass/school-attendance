import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { QRScannerScreen } from '@/screens/security/QRScannerScreen';
import { ValidationScreen } from '@/screens/security/ValidationScreen';
import { SignInScreen } from '@/screens/security/SignInScreen';

export type SecurityStackParamList = {
  SecurityTabs: undefined;
  Validation: { content: string };
};

export type SecurityTabParamList = {
  Scan: undefined;
  SignIn: undefined;
};

const Tab = createBottomTabNavigator<SecurityTabParamList>();
const Stack = createNativeStackNavigator<SecurityStackParamList>();

function SecurityTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Scan"
        component={QRScannerScreen}
        options={{
          title: 'Scan & Sign Out',
          tabBarIcon: ({ color, size }) => <Ionicons name="scan" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="SignIn"
        component={SignInScreen}
        options={{
          title: 'Sign In',
          tabBarIcon: ({ color, size }) => <Ionicons name="log-in" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function SecurityNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SecurityTabs" component={SecurityTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Validation" component={ValidationScreen} options={{ title: 'Verify Gate Pass' }} />
    </Stack.Navigator>
  );
}
