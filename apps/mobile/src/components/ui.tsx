import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const colors = {
  primary: '#0b3d91',
  primaryForeground: '#ffffff',
  background: '#f8fafc',
  card: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  muted: '#64748b',
  success: '#15803d',
  warning: '#b45309',
  destructive: '#b91c1c',
};

export function Screen({ children, style }: ViewProps & { children: React.ReactNode }) {
  return (
    <SafeAreaView style={[styles.screen, style]} edges={['top', 'bottom']}>
      {children}
    </SafeAreaView>
  );
}

export function Card({ children, style }: ViewProps & { children: React.ReactNode }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={colors.muted} {...props} />
    </View>
  );
}

export function Button({
  title,
  onPress,
  loading,
  variant = 'primary',
  disabled,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'destructive' | 'success' | 'outline';
  disabled?: boolean;
}) {
  const bg =
    variant === 'destructive'
      ? colors.destructive
      : variant === 'success'
        ? colors.success
        : variant === 'outline'
          ? 'transparent'
          : colors.primary;
  const textColor = variant === 'outline' ? colors.primary : colors.primaryForeground;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: bg, borderWidth: variant === 'outline' ? 1 : 0, borderColor: colors.primary },
        (disabled || loading) && { opacity: 0.6 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: colors.warning,
  APPROVED: colors.success,
  REJECTED: colors.destructive,
  CANCELLED: colors.muted,
  EXPIRED: colors.muted,
};

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? colors.muted;
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
      <Text style={[styles.badgeText, { color }]}>{status.replace(/_/g, ' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  label: { fontSize: 13, fontWeight: '500', color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.card,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 15, fontWeight: '600' },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '600' },
});
