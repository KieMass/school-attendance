import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, StatusBadge, Button, Screen, colors } from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import { useAuth } from '@/lib/auth-context';
import type { LeaveRequest, PaginatedResult } from '@/types';
import type { StudentStackParamList } from '@/navigation/StudentNavigator';

type Nav = NativeStackNavigationProp<StudentStackParamList>;

export function StudentDashboardScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<Nav>();
  const { data, loading, refetch } = useApi<PaginatedResult<LeaveRequest>>(
    '/students/leave-requests?pageSize=10',
  );

  return (
    <Screen>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        ListHeaderComponent={
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>{user?.email ?? user?.phone}</Text>
            <View style={styles.summaryRow}>
              <SummaryTile
                label="Pending"
                value={data?.items.filter((r) => r.status === 'PENDING').length ?? 0}
              />
              <SummaryTile
                label="Approved"
                value={data?.items.filter((r) => r.status === 'APPROVED').length ?? 0}
              />
              <SummaryTile label="Total" value={data?.total ?? 0} />
            </View>
            <Text style={styles.sectionTitle}>Recent requests</Text>
          </View>
        }
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '600' }}>{item.destination}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              {new Date(item.departureTime).toLocaleString()} →{' '}
              {new Date(item.expectedReturnTime).toLocaleString()}
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
          !loading ? <Text style={{ color: colors.muted }}>No leave requests yet.</Text> : null
        }
        ListFooterComponent={
          <Button title="Sign out" variant="outline" onPress={() => logout()} />
        }
      />
    </Screen>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { color: colors.muted, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryTile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  summaryValue: { fontSize: 20, fontWeight: '700', color: colors.text },
  summaryLabel: { fontSize: 12, color: colors.muted },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
});
