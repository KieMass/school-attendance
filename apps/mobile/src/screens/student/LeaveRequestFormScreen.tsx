import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Button, Field, Screen, colors } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import type { LeaveType } from '@/types';
import type { StudentTabParamList } from '@/navigation/StudentNavigator';

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: 'DAY_PASS', label: 'Day Pass' },
  { value: 'WEEKEND', label: 'Weekend Leave' },
  { value: 'MEDICAL', label: 'Medical' },
  { value: 'FAMILY_EMERGENCY', label: 'Family Emergency' },
  { value: 'OFFICIAL_SCHOOL_ACTIVITY', label: 'School Activity' },
  { value: 'OTHER', label: 'Other' },
];

export function LeaveRequestFormScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<StudentTabParamList>>();
  const [leaveType, setLeaveType] = useState<LeaveType>('DAY_PASS');
  const [reason, setReason] = useState('');
  const [destination, setDestination] = useState('');
  const [leaveDate, setLeaveDate] = useState(''); // YYYY-MM-DD
  const [departureTime, setDepartureTime] = useState(''); // YYYY-MM-DDTHH:mm
  const [expectedReturnTime, setExpectedReturnTime] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!reason || !destination || !leaveDate || !departureTime || !expectedReturnTime) {
      Alert.alert('Missing information', 'Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/students/leave-requests', {
        leaveType,
        reason,
        destination,
        leaveDate: new Date(leaveDate).toISOString(),
        departureTime: new Date(departureTime).toISOString(),
        expectedReturnTime: new Date(expectedReturnTime).toISOString(),
        additionalNotes: additionalNotes || undefined,
      });
      Alert.alert('Request submitted', 'Your guardian has been notified.');
      setReason('');
      setDestination('');
      setAdditionalNotes('');
      navigation.navigate('Status');
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text style={styles.title}>New Leave Request</Text>

        <View style={{ gap: 6 }}>
          <Text style={styles.label}>Leave type</Text>
          <View style={styles.chipRow}>
            {LEAVE_TYPES.map((t) => (
              <Text
                key={t.value}
                onPress={() => setLeaveType(t.value)}
                style={[styles.chip, leaveType === t.value && styles.chipActive]}
              >
                {t.label}
              </Text>
            ))}
          </View>
        </View>

        <Field label="Destination" value={destination} onChangeText={setDestination} placeholder="e.g. Home" />
        <Field
          label="Reason for leave"
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={3}
        />
        <Field
          label="Leave date (YYYY-MM-DD)"
          value={leaveDate}
          onChangeText={setLeaveDate}
          placeholder="2026-09-20"
        />
        <Field
          label="Departure time (YYYY-MM-DDTHH:mm)"
          value={departureTime}
          onChangeText={setDepartureTime}
          placeholder="2026-09-20T09:00"
        />
        <Field
          label="Expected return (YYYY-MM-DDTHH:mm)"
          value={expectedReturnTime}
          onChangeText={setExpectedReturnTime}
          placeholder="2026-09-20T18:00"
        />
        <Field
          label="Additional notes (optional)"
          value={additionalNotes}
          onChangeText={setAdditionalNotes}
          multiline
        />

        <Button title={submitting ? 'Submitting…' : 'Submit request'} onPress={handleSubmit} loading={submitting} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  label: { fontSize: 13, fontWeight: '500', color: colors.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    color: colors.text,
    overflow: 'hidden',
  },
  chipActive: { backgroundColor: colors.primary, color: colors.primaryForeground, borderColor: colors.primary },
});
