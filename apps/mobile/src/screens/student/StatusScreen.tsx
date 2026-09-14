import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card, Screen, StatusBadge, colors } from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import type { LeaveRequest, PaginatedResult } from '@/types';
import type { StudentStackParamList } from '@/navigation/StudentNavigator';

type Nav = NativeStackNavigationProp<StudentStackParamList>;

export function StatusScreen() {
  const navigation = useNavigation<Nav>();
  const { data, loading, refetch } = useApi<PaginatedResult<LeaveRequest>>(
    '/students/leave-requests?pageSize=50',
  );

  return (
    <Screen>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        ListHeaderComponent={<Text style={styles.title}>My Leave Requests</Text>}
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '600' }}>{item.destination}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{item.reason}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              {new Date(item.leaveDate).toDateString()}
            </Text>
            {item.status === 'APPROVED' && (
              <Button
                title="View QR pass"
                variant="outline"
                onPress={() => navigation.navigate('QRCode', { leaveRequestId: item.id })}
              />
            )}
          </Card>
        )}
        ListEmptyComponent={
          !loading ? <Text style={{ color: colors.muted }}>No requests found.</Text> : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
});
