import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { StudentDashboardScreen } from '@/screens/student/DashboardScreen';
import { LeaveRequestFormScreen } from '@/screens/student/LeaveRequestFormScreen';
import { StatusScreen } from '@/screens/student/StatusScreen';
import { QRCodeScreen } from '@/screens/student/QRCodeScreen';

export type StudentStackParamList = {
  StudentTabs: undefined;
  QRCode: { leaveRequestId: string };
};

export type StudentTabParamList = {
  Dashboard: undefined;
  NewRequest: undefined;
  Status: undefined;
};

const Tab = createBottomTabNavigator<StudentTabParamList>();
const Stack = createNativeStackNavigator<StudentStackParamList>();

function StudentTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Dashboard"
        component={StudentDashboardScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="NewRequest"
        component={LeaveRequestFormScreen}
        options={{
          title: 'New Request',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Status"
        component={StatusScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}

export function StudentNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="StudentTabs" component={StudentTabs} options={{ headerShown: false }} />
      <Stack.Screen name="QRCode" component={QRCodeScreen} options={{ title: 'Gate Pass QR Code' }} />
    </Stack.Navigator>
  );
}
