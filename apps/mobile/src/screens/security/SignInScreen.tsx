import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, Field, Screen, colors } from '@/components/ui';
import { api, ApiError } from '@/lib/api';

interface ActiveExit {
  id: string;
  exitAt: string;
  student: { firstName: string; lastName: string; studentIdCode: string };
  leaveRequest: { destination: string; expectedReturnTime: string };
}

export function SignInScreen() {
  const [studentIdCode, setStudentIdCode] = useState('');
  const [exitLog, setExitLog] = useState<ActiveExit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function lookup() {
    setError(null);
    setSuccess(null);
    setExitLog(null);
    try {
      const data = await api.get<ActiveExit>(`/security/active-exit/${studentIdCode}`);
      setExitLog(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No active off-campus record found.');
    }
  }

  async function confirmSignIn() {
    if (!exitLog) return;
    setConfirming(true);
    try {
      await api.post('/security/sign-in', { exitLogId: exitLog.id, gateLocation: 'Main Gate' });
      setSuccess(`${exitLog.student.firstName} ${exitLog.student.lastName} signed in successfully.`);
      setExitLog(null);
      setStudentIdCode('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to sign in student.');
    } finally {
      setConfirming(false);
    }
  }

  const isOverdue =
    exitLog && new Date() > new Date(exitLog.leaveRequest.expectedReturnTime);

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Sign Student In</Text>
        <Field
          label="Student ID"
          value={studentIdCode}
          onChangeText={setStudentIdCode}
          placeholder="e.g. PC-2026-0001"
          autoCapitalize="characters"
        />
        <Button title="Look up" onPress={lookup} />

        {error && (
          <Card style={{ borderColor: colors.destructive }}>
            <Text style={{ color: colors.destructive }}>{error}</Text>
          </Card>
        )}
        {success && (
          <Card style={{ borderColor: colors.success }}>
            <Text style={{ color: colors.success }}>{success}</Text>
          </Card>
        )}
        {exitLog && (
          <Card style={{ gap: 10, borderColor: isOverdue ? colors.destructive : colors.success }}>
            <Text style={{ fontWeight: '700' }}>
              {exitLog.student.firstName} {exitLog.student.lastName} ({exitLog.student.studentIdCode})
            </Text>
            <Text>Exited: {new Date(exitLog.exitAt).toLocaleString()}</Text>
            <Text>Destination: {exitLog.leaveRequest.destination}</Text>
            <Text style={{ color: isOverdue ? colors.destructive : colors.text }}>
              Expected return: {new Date(exitLog.leaveRequest.expectedReturnTime).toLocaleString()}
              {isOverdue ? ' (overdue)' : ''}
            </Text>
            <Button
              title={confirming ? 'Signing in…' : 'Confirm sign-in'}
              loading={confirming}
              onPress={confirmSignIn}
            />
          </Card>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
});
