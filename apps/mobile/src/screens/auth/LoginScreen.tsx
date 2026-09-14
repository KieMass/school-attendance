import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Field, Screen, colors } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';

export function LoginScreen() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await login(identifier, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>PC</Text>
        </View>
        <Text style={styles.title}>President&apos;s College</Text>
        <Text style={styles.subtitle}>Student Leave Permission System</Text>

        <View style={{ width: '100%', gap: 16, marginTop: 32 }}>
          <Field
            label="Email or phone"
            autoCapitalize="none"
            keyboardType="email-address"
            value={identifier}
            onChangeText={setIdentifier}
          />
          <Field label="Password" secureTextEntry value={password} onChangeText={setPassword} />
          {error && <Text style={styles.error}>{error}</Text>}
          <Button title={submitting ? 'Signing in…' : 'Sign in'} onPress={handleSubmit} loading={submitting} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: { color: colors.primaryForeground, fontSize: 24, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 4 },
  error: { color: colors.destructive, fontSize: 13 },
});
