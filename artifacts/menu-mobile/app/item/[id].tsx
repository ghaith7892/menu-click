import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import {
  getCategories,
  getMenuItemsNoImage,
  getMenuItemImage,
  updateMenuItem,
  deleteMenuItem,
  uploadMenuImage,
} from '@/lib/api';

export default function EditItemScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const restaurantId = user?.restaurantId ?? '';

  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom + 12;

  const { data: items = [] } = useQuery({
    queryKey: ['menu-items', restaurantId],
    queryFn: () => getMenuItemsNoImage(restaurantId),
    enabled: !!restaurantId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', restaurantId],
    queryFn: () => getCategories(restaurantId),
    enabled: !!restaurantId,
  });

  const { data: existingImage } = useQuery({
    queryKey: ['item-image', id],
    queryFn: () => getMenuItemImage(id!),
    enabled: !!id,
    staleTime: 60_000,
  });

  const item = items.find((i) => i.id === id);

  // Initialize form when item is loaded
  useEffect(() => {
    if (item && !initialized) {
      setName(item.name);
      setNameEn(item.name_en ?? '');
      setDescription(item.description ?? '');
      setPrice(item.price.toString());
      setCategoryId(item.category_id ?? null);
      setIsAvailable(item.is_available);
      setIsPopular(item.is_popular);
      setInitialized(true);
    }
  }, [item, initialized]);

  // Set image from server when loaded
  useEffect(() => {
    if (existingImage && !imageUri) {
      setImageUri(existingImage);
    }
  }, [existingImage]);

  const pickImage = async (useCamera: boolean) => {
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePickImage = () => {
    if (Platform.OS === 'web') { pickImage(false); return; }
    Alert.alert('تغيير الصورة', 'اختر مصدر الصورة', [
      { text: 'الكاميرا', onPress: () => pickImage(true) },
      { text: 'المعرض', onPress: () => pickImage(false) },
      { text: 'إلغاء', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('تنبيه', 'يرجى إدخال اسم الصنف'); return; }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) { Alert.alert('تنبيه', 'يرجى إدخال سعر صحيح'); return; }

    setSaving(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Upload image only if it's a local URI (changed by user)
    let finalImage: string | null = imageUri;
    if (imageUri && !imageUri.startsWith('http')) {
      finalImage = await uploadMenuImage(imageUri, restaurantId);
    }

    const { error } = await updateMenuItem(id!, {
      name: name.trim(),
      name_en: nameEn.trim() || null,
      description: description.trim() || null,
      price: priceNum,
      category_id: categoryId,
      image: finalImage,
      is_available: isAvailable,
      is_popular: isPopular,
    });

    setSaving(false);

    if (error) { Alert.alert('خطأ', 'فشل حفظ التعديلات'); return; }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    queryClient.invalidateQueries({ queryKey: ['menu-items', restaurantId] });
    queryClient.invalidateQueries({ queryKey: ['menu-images', restaurantId] });
    queryClient.invalidateQueries({ queryKey: ['item-image', id] });
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('حذف الصنف', `هل تريد حذف "${name}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          const { error } = await deleteMenuItem(id!);
          if (!error) {
            queryClient.invalidateQueries({ queryKey: ['menu-items', restaurantId] });
            router.back();
          }
        },
      },
    ]);
  };

  if (!initialized && !item) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 16 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Image */}
      <Pressable onPress={handlePickImage} style={styles.imageSection}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={[styles.imagePreview, { borderRadius: colors.radius }]}
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.muted, borderColor: colors.border, borderRadius: colors.radius }]}>
            <Ionicons name="camera-outline" size={36} color={colors.mutedForeground} />
            <Text style={[styles.imageHint, { color: colors.mutedForeground }]}>إضافة صورة</Text>
          </View>
        )}
        {imageUri && (
          <View style={[styles.imageOverlay, { borderRadius: colors.radius }]}>
            <Ionicons name="camera" size={24} color="#fff" />
          </View>
        )}
      </Pressable>

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>الاسم بالعربية *</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border, borderRadius: colors.radius - 4 }]}
            value={name}
            onChangeText={setName}
            placeholder="اسم الصنف"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>الاسم بالإنجليزية</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border, borderRadius: colors.radius - 4 }]}
            value={nameEn}
            onChangeText={setNameEn}
            placeholder="Item name in English"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>الوصف</Text>
          <TextInput
            style={[styles.inputMulti, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border, borderRadius: colors.radius - 4 }]}
            value={description}
            onChangeText={setDescription}
            placeholder="وصف مختصر..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>السعر *</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border, borderRadius: colors.radius - 4 }]}
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Category */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>التصنيف</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Pressable
              onPress={() => setCategoryId(null)}
              style={[styles.catPill, { backgroundColor: !categoryId ? colors.primary : colors.muted, borderRadius: 20 }]}
            >
              <Text style={[styles.catPillText, { color: !categoryId ? colors.primaryForeground : colors.mutedForeground }]}>
                بلا تصنيف
              </Text>
            </Pressable>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setCategoryId(cat.id)}
                style={[styles.catPill, { backgroundColor: categoryId === cat.id ? colors.primary : colors.muted, borderRadius: 20 }]}
              >
                <Text style={[styles.catPillText, { color: categoryId === cat.id ? colors.primaryForeground : colors.mutedForeground }]}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Toggles */}
        <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.toggleLabel, { color: colors.foreground }]}>متاح للطلب</Text>
          <Switch value={isAvailable} onValueChange={setIsAvailable} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.primaryForeground} />
        </View>
        <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.toggleLabel, { color: colors.foreground }]}>شائع / مميز</Text>
          <Switch value={isPopular} onValueChange={setIsPopular} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.primaryForeground} />
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: pressed || saving ? 0.8 : 1 }]}
        >
          {saving ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>حفظ التعديلات</Text>}
        </Pressable>
        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [styles.deleteBtn, { backgroundColor: colors.destructive + '15', borderColor: colors.destructive + '40', borderRadius: colors.radius, opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="trash-2" size={18} color={colors.destructive} />
          <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>حذف الصنف</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  imageSection: { alignItems: 'center', marginBottom: 8, position: 'relative' },
  imagePreview: { width: 160, height: 160, alignSelf: 'center' },
  imagePlaceholder: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderStyle: 'dashed', alignSelf: 'center' },
  imageHint: { fontSize: 14, fontFamily: 'Cairo_400Regular' },
  imageOverlay: { position: 'absolute', bottom: 0, right: '50%', transform: [{ translateX: 80 - 32 }], backgroundColor: 'rgba(0,0,0,0.5)', width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  form: { gap: 12 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontFamily: 'Cairo_600SemiBold' },
  input: { height: 46, borderWidth: 1, paddingHorizontal: 12, fontSize: 15, fontFamily: 'Cairo_400Regular' },
  inputMulti: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, fontFamily: 'Cairo_400Regular', minHeight: 80, textAlignVertical: 'top' },
  catPill: { paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  catPillText: { fontSize: 13, fontFamily: 'Cairo_600SemiBold' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1 },
  toggleLabel: { fontSize: 15, fontFamily: 'Cairo_400Regular' },
  actions: { gap: 10 },
  saveBtn: { height: 52, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 16, fontFamily: 'Cairo_700Bold' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderWidth: 1 },
  deleteBtnText: { fontSize: 15, fontFamily: 'Cairo_600SemiBold' },
});
