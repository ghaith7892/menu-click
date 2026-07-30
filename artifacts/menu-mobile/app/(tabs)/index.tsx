import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { MenuItemCard } from '@/components/MenuItemCard';
import {
  getCategories,
  getMenuItemsNoImage,
  loadAllImages,
  updateMenuItem,
} from '@/lib/api';
import type { MenuItemRow } from '@/lib/types';

export default function MenuScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const restaurantId = user?.restaurantId ?? '';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 84 : 90;

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', restaurantId],
    queryFn: () => getCategories(restaurantId),
    enabled: !!restaurantId,
  });

  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['menu-items', restaurantId],
    queryFn: () => getMenuItemsNoImage(restaurantId),
    enabled: !!restaurantId,
  });

  const { data: images = {} } = useQuery({
    queryKey: ['menu-images', restaurantId],
    queryFn: () => loadAllImages(restaurantId),
    enabled: !!restaurantId && items.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return items;
    return items.filter((i) => i.category_id === selectedCategory);
  }, [items, selectedCategory]);

  const handleToggleAvailable = useCallback(
    async (item: MenuItemRow, available: boolean) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Optimistic update
      queryClient.setQueryData(
        ['menu-items', restaurantId],
        (old: MenuItemRow[] | undefined) =>
          old?.map((i) => (i.id === item.id ? { ...i, is_available: available } : i)) ?? []
      );
      const { error } = await updateMenuItem(item.id, { is_available: available });
      if (error) {
        // Revert on failure
        queryClient.setQueryData(
          ['menu-items', restaurantId],
          (old: MenuItemRow[] | undefined) =>
            old?.map((i) => (i.id === item.id ? { ...i, is_available: !available } : i)) ?? []
        );
      }
    },
    [queryClient, restaurantId]
  );

  const renderItem = useCallback(
    ({ item }: { item: MenuItemRow }) => (
      <MenuItemCard
        item={item}
        imageUri={images[item.id]}
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
        onToggleAvailable={(val) => handleToggleAvailable(item, val)}
      />
    ),
    [images, handleToggleAvailable]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {user?.restaurantName ?? 'القائمة'}
        </Text>
        <Pressable
          onPress={() => router.push('/item/new')}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: colors.primary, borderRadius: colors.radius - 2, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Ionicons name="add" size={22} color={colors.primaryForeground} />
        </Pressable>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterBar, { borderBottomColor: colors.border }]}
        contentContainerStyle={styles.filterContent}
      >
        <Pressable
          onPress={() => setSelectedCategory('all')}
          style={[
            styles.pill,
            {
              backgroundColor: selectedCategory === 'all' ? colors.primary : colors.muted,
              borderRadius: 20,
            },
          ]}
        >
          <Text
            style={[
              styles.pillText,
              { color: selectedCategory === 'all' ? colors.primaryForeground : colors.mutedForeground },
            ]}
          >
            الكل
          </Text>
        </Pressable>
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => setSelectedCategory(cat.id)}
            style={[
              styles.pill,
              {
                backgroundColor: selectedCategory === cat.id ? colors.primary : colors.muted,
                borderRadius: 20,
              },
            ]}
          >
            <Text
              style={[
                styles.pillText,
                { color: selectedCategory === cat.id ? colors.primaryForeground : colors.mutedForeground },
              ]}
            >
              {cat.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Items List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="restaurant-outline" size={56} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد أصناف</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            اضغط + لإضافة صنف جديد
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={filteredItems.length > 0}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                refetch();
                queryClient.invalidateQueries({ queryKey: ['menu-images', restaurantId] });
              }}
              tintColor={colors.primary}
            />
          }
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
  addBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: { flexGrow: 0, borderBottomWidth: 1 },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 6 },
  pillText: { fontSize: 13, fontFamily: 'Cairo_600SemiBold' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 18, fontFamily: 'Cairo_700Bold', marginTop: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Cairo_400Regular' },
  list: { paddingTop: 8 },
});
