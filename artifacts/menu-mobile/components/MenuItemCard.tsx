import React from 'react';
import { Image, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { MenuItemRow } from '@/lib/types';

interface Props {
  item: MenuItemRow;
  imageUri?: string;
  onPress: () => void;
  onToggleAvailable: (available: boolean) => void;
}

export function MenuItemCard({ item, imageUri, onPress, onToggleAvailable }: Props) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {/* Image */}
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={[styles.image, { borderRadius: colors.radius - 2 }]}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.imagePlaceholder,
            { backgroundColor: colors.muted, borderRadius: colors.radius - 2 },
          ]}
        />
      )}

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text
            style={[styles.name, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {item.is_popular && (
            <View style={[styles.popularBadge, { backgroundColor: colors.accent }]}>
              <Text style={[styles.popularText, { color: colors.accentForeground }]}>
                شائع
              </Text>
            </View>
          )}
        </View>
        {item.description ? (
          <Text
            style={[styles.description, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {item.description}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <Text style={[styles.price, { color: colors.primary }]}>
            {item.price.toFixed(2)}
          </Text>
          <Switch
            value={item.is_available}
            onValueChange={onToggleAvailable}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.primaryForeground}
            style={styles.switch}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
  },
  image: {
    width: 90,
    height: 90,
  },
  imagePlaceholder: {
    width: 90,
    height: 90,
  },
  content: {
    flex: 1,
    padding: 12,
    gap: 4,
    justifyContent: 'space-between',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '600' as const,
    flex: 1,
  },
  popularBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
});
