import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    setError('');
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? 'حدث خطأ غير متوقع');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <LinearGradient
      colors={[colors.background, colors.muted]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingTop: topInset + 40, paddingBottom: bottomInset + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Brand */}
          <View style={styles.brand}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
              <Ionicons name="restaurant" size={36} color={colors.primaryForeground} />
            </View>
            <Text style={[styles.appName, { color: colors.foreground }]}>MenuClick</Text>
            <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
              إدارة قائمة مطعمك بسهولة
            </Text>
          </View>

          {/* Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Text style={[styles.title, { color: colors.foreground }]}>تسجيل الدخول</Text>

            {/* Email */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                البريد الإلكتروني
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.muted, borderColor: colors.border, borderRadius: colors.radius - 4 },
                ]}
              >
                <Ionicons name="mail-outline" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@example.com"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>كلمة المرور</Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.muted, borderColor: colors.border, borderRadius: colors.radius - 4 },
                ]}
              >
                <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              </View>
            </View>

            {/* Error */}
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.destructive + '15', borderColor: colors.destructive + '40', borderRadius: colors.radius - 4 }]}>
                <Ionicons name="alert-circle" size={16} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              </View>
            ) : null}

            {/* Login Button */}
            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [
                styles.loginBtn,
                { backgroundColor: colors.primary, borderRadius: colors.radius - 2, opacity: pressed || loading ? 0.8 : 1 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.loginBtnText, { color: colors.primaryForeground }]}>
                  دخول
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  container: { paddingHorizontal: 24, gap: 32 },
  brand: { alignItems: 'center', gap: 12 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: { fontSize: 28, fontFamily: 'Cairo_700Bold', letterSpacing: -0.5 },
  tagline: { fontSize: 15, fontFamily: 'Cairo_400Regular' },
  card: {
    padding: 24,
    borderWidth: 1,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  title: { fontSize: 20, fontFamily: 'Cairo_700Bold', textAlign: 'center', marginBottom: 4 },
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: 'Cairo_600SemiBold' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, fontFamily: 'Cairo_400Regular' },
  eyeBtn: { padding: 4 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderWidth: 1,
  },
  errorText: { fontSize: 13, fontFamily: 'Cairo_400Regular', flex: 1 },
  loginBtn: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  loginBtnText: { fontSize: 16, fontFamily: 'Cairo_700Bold' },
});
