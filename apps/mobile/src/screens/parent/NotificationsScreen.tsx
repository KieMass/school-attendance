import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text } from 'react-native';
import { Card, Screen, colors } from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import type { AppNotification, PaginatedResult } from '@/types';

export function NotificationsScreen() {
  const { data, loading, refetch } = useApi<PaginatedResult<AppNotification>>(
    '/notifications/me?pageSize=50',
  );

  return (
    <Screen>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        ListHeaderComponent={<Text style={styles.title}>Notifications</Text>}
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={{ gap: 4 }}>
            <Text style={{ fontWeight: '600' }}>{item.title}</Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>{item.body}</Text>
            <Text style={{ color: colors.muted, fontSize: 11 }}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </Card>
        )}
        ListEmptyComponent={
          !loading ? <Text style={{ color: colors.muted }}>No notifications yet.</Text> : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
});
