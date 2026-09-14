import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card, Field, Screen, StatusBadge, colors } from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import { api, ApiError } from '@/lib/api';
import type { LeaveRequest } from '@/types';
import type { ParentStackParamList } from '@/navigation/ParentNavigator';

type Nav = NativeStackNavigationProp<ParentStackParamList>;

export function ApprovalScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<ParentStackParamList, 'Approval'>>();
  const { leaveRequestId } = route.params;
  const { data, loading } = useApi<LeaveRequest>(`/parents/leave-requests/${leaveRequestId}`);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null);

  async function decide(decision: 'approve' | 'reject') {
    setSubmitting(decision);
    try {
      await api.post(`/parents/leave-requests/${leaveRequestId}/${decision}`, { comments });
      Alert.alert('Done', `Request ${decision === 'approve' ? 'approved' : 'rejected'}.`);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to submit decision.');
    } finally {
      setSubmitting(null);
    }
  }

  if (loading || !data) {
    return (
      <Screen>
        <Text style={{ padding: 16, color: colors.muted }}>Loading…</Text>
      </Screen>
    );
  }

  const isPending = data.status === 'PENDING';

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.name}>
              {data.student.firstName} {data.student.lastName}
            </Text>
            <StatusBadge status={data.status} />
          </View>
          <DetailRow label="Student ID" value={data.student.studentIdCode} />
          <DetailRow label="Leave type" value={data.leaveType.replace(/_/g, ' ')} />
          <DetailRow label="Destination" value={data.destination} />
          <DetailRow label="Reason" value={data.reason} />
          <DetailRow label="Departure" value={new Date(data.departureTime).toLocaleString()} />
          <DetailRow label="Expected return" value={new Date(data.expectedReturnTime).toLocaleString()} />
          {data.additionalNotes && <DetailRow label="Notes" value={data.additionalNotes} />}
        </Card>

        {isPending && (
          <Card style={{ gap: 12 }}>
            <Field
              label="Comments (optional)"
              value={comments}
              onChangeText={setComments}
              multiline
              numberOfLines={3}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title={submitting === 'approve' ? 'Approving…' : 'Approve'}
                  variant="success"
                  loading={submitting === 'approve'}
                  disabled={!!submitting}
                  onPress={() => decide('approve')}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title={submitting === 'reject' ? 'Rejecting…' : 'Reject'}
                  variant="destructive"
                  loading={submitting === 'reject'}
                  disabled={!!submitting}
                  onPress={() => decide('reject')}
                />
              </View>
            </View>
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={{ fontSize: 12, color: colors.muted }}>{label}</Text>
      <Text style={{ fontSize: 14, color: colors.text }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
});
