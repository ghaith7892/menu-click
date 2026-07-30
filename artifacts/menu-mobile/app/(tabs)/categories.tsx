import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { getCategories, createCategory, deleteCategory } from '@/lib/api';
import type { CategoryRow } from '@/lib/types';

export default function CategoriesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const restaurantId = user?.restaurantId ?? '';

  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 84 + 34 : 90;

  const { data: categories = [], isLoading, refetch } = useQuery({
    queryKey: ['categories', restaurantId],
    queryFn: () => getCategories(restaurantId),
    enabled: !!restaurantId,
  });

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { error } = await createCategory(restaurantId, newName.trim());
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['categories', restaurantId] });
      setNewName('');
      setShowInput(false);
    } else {
      Alert.alert('خطأ', 'فشل إضافة التصنيف، حاول مرة أخرى');
    }
    setAdding(false);
  };

  const handleDelete = (cat: CategoryRow) => {
    Alert.alert(
      'حذف التصنيف',
      `هل تريد حذف "${cat.name}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const { error } = await deleteCategory(cat.id);
            if (!error) {
              queryClient.invalidateQueries({ queryKey: ['categories', restaurantId] });
              queryClient.invalidateQueries({ queryKey: ['menu-items', restaurantId] });
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>التصنيفات</Text>
        <Pressable
          onPress={() => { setShowInput(!showInput); setNewName(''); }}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: showInput ? colors.muted : colors.primary, borderRadius: colors.radius - 2, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Ionicons
            name={showInput ? 'close' : 'add'}
            size={22}
            color={showInput ? colors.foreground : colors.primaryForeground}
          />
        </Pressable>
      </View>

      {/* Add input */}
      {showInput && (
        <View style={[styles.addBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View
            style={[
              styles.inputWrap,
              { backgroundColor: colors.muted, borderColor: colors.border, borderRadius: colors.radius - 4 },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="اسم التصنيف الجديد"
              placeholderTextColor={colors.mutedForeground}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
          </View>
          <Pressable
            onPress={handleAdd}
            disabled={adding || !newName.trim()}
            style={({ pressed }) => [
              styles.saveBtn,
              {
                backgroundColor: colors.primary,
                borderRadius: colors.radius - 4,
                opacity: pressed || adding || !newName.trim() ? 0.6 : 1,
              },
            ]}
          >
            {adding ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>إضافة</Text>
            )}
          </Pressable>
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : categories.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="folder-open-outline" size={56} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد تصنيفات</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            اضغط + لإضافة تصنيف جديد
          </Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={categories.length > 0}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.row,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                  marginHorizontal: 16,
                  marginVertical: 5,
                },
              ]}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
                <Text style={styles.icon}>{item.icon ?? '🍽️'}</Text>
              </View>
              <Text style={[styles.catName, { color: colors.foreground }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Pressable
                onPress={() => handleDelete(item)}
                style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Feather name="trash-2" size={18} color={colors.destructive} />
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontFamily: 'Cairo_700Bold' },
  addBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  addBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
  },
  inputWrap: {
    flex: 1,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
  },
  input: { fontSize: 15, fontFamily: 'Cairo_400Regular' },
  saveBtn: { paddingHorizontal: 18, height: 44, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 14, fontFamily: 'Cairo_600SemiBold' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 18, fontFamily: 'Cairo_700Bold', marginTop: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Cairo_400Regular' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20 },
  catName: { flex: 1, fontSize: 16, fontFamily: 'Cairo_600SemiBold' },
  deleteBtn: { padding: 8 },
});
