import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Field, Screen, colors } from '@/components/ui';
import type { SecurityStackParamList } from '@/navigation/SecurityNavigator';

type Nav = NativeStackNavigationProp<SecurityStackParamList>;

export function QRScannerScreen() {
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualContent, setManualContent] = useState('');

  // Reset the "already scanned" lock every time this screen regains focus
  // (e.g. after the officer backs out of the Validation screen).
  useFocusEffect(
    React.useCallback(() => {
      setScanned(false);
    }, []),
  );

  function handleBarcodeScanned({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);
    navigation.navigate('Validation', { content: data });
  }

  if (!permission) {
    return (
      <Screen>
        <Text style={{ padding: 16 }}>Requesting camera permission…</Text>
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={{ marginBottom: 12, textAlign: 'center', color: colors.text }}>
            Camera access is needed to scan gate-pass QR codes.
          </Text>
          <Button title="Grant camera permission" onPress={requestPermission} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        />
        <View style={styles.frame} />
      </View>
      <View style={styles.manualEntry}>
        <Field
          label="Or enter QR content manually"
          value={manualContent}
          onChangeText={setManualContent}
          autoCapitalize="none"
        />
        <Button
          title="Validate"
          onPress={() => manualContent && navigation.navigate('Validation', { content: manualContent })}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  cameraWrap: { flex: 1, backgroundColor: '#000' },
  frame: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    width: '70%',
    height: '35%',
    borderWidth: 3,
    borderColor: colors.primary,
    borderRadius: 16,
  },
  manualEntry: { padding: 16, gap: 10, backgroundColor: colors.background },
});
