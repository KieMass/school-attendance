import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card, Screen, colors } from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import type { LeaveRequest } from '@/types';
import type { ParentStackParamList } from '@/navigation/ParentNavigator';

type Nav = NativeStackNavigationProp<ParentStackParamList>;

export function PendingRequestsScreen() {
  const navigation = useNavigation<Nav>();
  const { data, loading, refetch } = useApi<LeaveRequest[]>('/parents/leave-requests/pending');

  return (
    <Screen>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        ListHeaderComponent={<Text style={styles.title}>Pending Requests</Text>}
        data={data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={{ gap: 8 }}>
            <Text style={{ fontWeight: '600' }}>
              {item.student.firstName} {item.student.lastName}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>{item.destination}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              {new Date(item.departureTime).toLocaleString()} →{' '}
              {new Date(item.expectedReturnTime).toLocaleString()}
            </Text>
            <Button
              title="Review & respond"
              onPress={() => navigation.navigate('Approval', { leaveRequestId: item.id })}
            />
          </Card>
        )}
        ListEmptyComponent={
          !loading ? (
            <View>
              <Text style={{ color: colors.muted }}>Nothing waiting on you right now.</Text>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
});
