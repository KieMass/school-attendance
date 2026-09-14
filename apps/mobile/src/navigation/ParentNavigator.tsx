import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { NotificationsScreen } from '@/screens/parent/NotificationsScreen';
import { PendingRequestsScreen } from '@/screens/parent/PendingRequestsScreen';
import { HistoryScreen } from '@/screens/parent/HistoryScreen';
import { ApprovalScreen } from '@/screens/parent/ApprovalScreen';

export type ParentStackParamList = {
  ParentTabs: undefined;
  Approval: { leaveRequestId: string };
};

export type ParentTabParamList = {
  Notifications: undefined;
  Pending: undefined;
  History: undefined;
};

const Tab = createBottomTabNavigator<ParentTabParamList>();
const Stack = createNativeStackNavigator<ParentStackParamList>();

function ParentTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="notifications" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Pending"
        component={PendingRequestsScreen}
        options={{
          title: 'Pending Requests',
          tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-circle" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="time" color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}

export function ParentNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ParentTabs" component={ParentTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Approval" component={ApprovalScreen} options={{ title: 'Review Request' }} />
    </Stack.Navigator>
  );
}
