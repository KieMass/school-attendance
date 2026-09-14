import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card, Screen, colors } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import type { SecurityStackParamList } from '@/navigation/SecurityNavigator';

type Nav = NativeStackNavigationProp<SecurityStackParamList>;

interface ScanResult {
  qrTokenId: string;
  leaveRequest: { destination: string; expectedReturnTime: string };
  student: { firstName: string; lastName: string; studentIdCode: string; dormitory?: string | null };
  expiresAt: string;
}

export function ValidationScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<SecurityStackParamList, 'Validation'>>();
  const { content } = route.params;

  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.post<ScanResult>('/security/scan', { content });
        setResult(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Unable to validate QR code.');
      } finally {
        setLoading(false);
      }
    })();
  }, [content]);

  async function confirmSignOut() {
    setConfirming(true);
    try {
      await api.post('/security/sign-out', { content, gateLocation: 'Main Gate' });
      navigation.navigate('SecurityTabs');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to sign out student.');
    } finally {
      setConfirming(false);
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        {loading && <Text style={{ color: colors.muted }}>Validating…</Text>}
        {error && (
          <Card style={{ borderColor: colors.destructive }}>
            <Text style={{ color: colors.destructive, fontWeight: '600' }}>{error}</Text>
          </Card>
        )}
        {result && (
          <Card style={{ gap: 10, borderColor: colors.success }}>
            <Text style={styles.heading}>✅ Valid gate pass</Text>
            <Text>
              <Text style={styles.label}>Student: </Text>
              {result.student.firstName} {result.student.lastName} ({result.student.studentIdCode})
            </Text>
            {result.student.dormitory && (
              <Text>
                <Text style={styles.label}>Dormitory: </Text>
                {result.student.dormitory}
              </Text>
            )}
            <Text>
              <Text style={styles.label}>Destination: </Text>
              {result.leaveRequest.destination}
            </Text>
            <Text>
              <Text style={styles.label}>Expected return: </Text>
              {new Date(result.leaveRequest.expectedReturnTime).toLocaleString()}
            </Text>
            <Button
              title={confirming ? 'Signing out…' : 'Confirm sign-out'}
              loading={confirming}
              onPress={confirmSignOut}
            />
          </Card>
        )}
        <Button title="Back to scanner" variant="outline" onPress={() => navigation.goBack()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  heading: { fontSize: 16, fontWeight: '700', color: colors.success },
  label: { fontWeight: '600', color: colors.text },
});
