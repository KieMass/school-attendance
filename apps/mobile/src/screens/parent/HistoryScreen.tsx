import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Card, Screen, StatusBadge, colors } from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import type { LeaveRequest, PaginatedResult } from '@/types';

export function HistoryScreen() {
  const { data, loading, refetch } = useApi<PaginatedResult<LeaveRequest>>(
    '/parents/leave-requests/history?pageSize=50',
  );

  return (
    <Screen>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        ListHeaderComponent={<Text style={styles.title}>Leave History</Text>}
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '600' }}>
                {item.student.firstName} {item.student.lastName}
              </Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={{ color: colors.muted, fontSize: 13 }}>{item.destination}</Text>
            <Text style={{ color: colors.muted, fontSize: 11 }}>
              {new Date(item.leaveDate).toDateString()}
            </Text>
          </Card>
        )}
        ListEmptyComponent={
          !loading ? <Text style={{ color: colors.muted }}>No history yet.</Text> : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
});
