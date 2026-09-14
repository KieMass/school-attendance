import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { Button, Card, Screen, colors } from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import type { StudentStackParamList } from '@/navigation/StudentNavigator';

interface QrResponse {
  qrToken: { id: string; expiresAt: string };
  qrImageDataUrl: string;
}

export function QRCodeScreen() {
  const route = useRoute<RouteProp<StudentStackParamList, 'QRCode'>>();
  const { leaveRequestId } = route.params;
  const { data, loading, error } = useApi<QrResponse>(
    `/students/leave-requests/${leaveRequestId}/qr`,
  );
  const [working, setWorking] = useState(false);

  async function handlePrint() {
    if (!data) return;
    setWorking(true);
    try {
      await Print.printAsync({
        html: `<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;">
                 <img src="${data.qrImageDataUrl}" style="width:300px;height:300px;" />
               </body></html>`,
      });
    } finally {
      setWorking(false);
    }
  }

  async function handleShare() {
    if (!data) return;
    setWorking(true);
    try {
      const base64 = data.qrImageDataUrl.split(',')[1];
      const fileUri = `${FileSystem.cacheDirectory}gate-pass-${leaveRequestId}.png`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } finally {
      setWorking(false);
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        {loading && <Text style={{ color: colors.muted }}>Loading…</Text>}
        {error && <Text style={{ color: colors.destructive }}>{error}</Text>}
        {data && (
          <Card style={{ alignItems: 'center', gap: 16, width: '100%' }}>
            <Text style={styles.title}>Gate Pass QR Code</Text>
            <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center' }}>
              Present this to the security officer at the gate.
            </Text>
            <Image source={{ uri: data.qrImageDataUrl }} style={styles.qr} />
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              Valid until {new Date(data.qrToken.expiresAt).toLocaleString()}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <View style={{ flex: 1 }}>
                <Button title="Print" variant="outline" onPress={handlePrint} loading={working} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Share / Save" onPress={handleShare} loading={working} />
              </View>
            </View>
          </Card>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  qr: { width: 240, height: 240, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
});
