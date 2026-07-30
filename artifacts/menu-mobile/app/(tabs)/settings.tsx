import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const PLAN_LABELS: Record<string, string> = {
  free: 'مجاني',
  pro: 'احترافي',
  enterprise: 'مؤسسي',
};

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 84 + 34 : 90;

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'خروج',
        style: 'destructive',
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
        },
      },
    ]);
  };

  const planLabel = user?.plan ? PLAN_LABELS[user.plan] ?? user.plan : 'غير معروف';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 12, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>الإعدادات</Text>

      {/* Profile Card */}
      <LinearGradient
        colors={[colors.primary, colors.primary + 'BB']}
        style={[styles.profileCard, { borderRadius: colors.radius }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.avatarCircle, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
          <Ionicons name="person" size={32} color={colors.primaryForeground} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.restaurantName, { color: colors.primaryForeground }]}>
            {user?.restaurantName ?? 'مطعمي'}
          </Text>
          <Text style={[styles.ownerName, { color: colors.primaryForeground + 'CC' }]}>
            {user?.name}
          </Text>
          <Text style={[styles.email, { color: colors.primaryForeground + 'AA' }]}>
            {user?.email}
          </Text>
        </View>
      </LinearGradient>

      {/* Subscription */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>الاشتراك</Text>
        <View style={styles.infoRow}>
          <View style={[styles.rowIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name="star" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>الخطة الحالية</Text>
          <View style={[styles.planBadge, { backgroundColor: colors.primary + '22' }]}>
            <Text style={[styles.planBadgeText, { color: colors.primary }]}>{planLabel}</Text>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <View style={[styles.rowIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name="cash-outline" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>العملة</Text>
          <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
            {user?.currency ?? 'SAR'}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>معلومات</Text>
        <View style={styles.infoRow}>
          <View style={[styles.rowIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>الإصدار</Text>
          <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>1.0.0</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <View style={[styles.rowIcon, { backgroundColor: colors.accent }]}>
            <Feather name="globe" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>MenuClick</Text>
          <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>menuclick.app</Text>
        </View>
      </View>

      {/* Logout */}
      <Pressable
        onPress={handleLogout}
        style={({ pressed }) => [
          styles.logoutBtn,
          {
            backgroundColor: colors.destructive + '15',
            borderColor: colors.destructive + '40',
            borderRadius: colors.radius,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>تسجيل الخروج</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },
  pageTitle: { fontSize: 22, fontFamily: 'Cairo_700Bold', marginBottom: 4 },
  profileCard: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1, gap: 2 },
  restaurantName: { fontSize: 18, fontFamily: 'Cairo_700Bold' },
  ownerName: { fontSize: 14, fontFamily: 'Cairo_600SemiBold' },
  email: { fontSize: 12, fontFamily: 'Cairo_400Regular' },
  section: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Cairo_600SemiBold',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: 'Cairo_400Regular' },
  rowValue: { fontSize: 14, fontFamily: 'Cairo_400Regular' },
  planBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  planBadgeText: { fontSize: 12, fontFamily: 'Cairo_600SemiBold' },
  divider: { height: 1, marginHorizontal: 16 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderWidth: 1,
  },
  logoutText: { fontSize: 16, fontFamily: 'Cairo_600SemiBold' },
});
