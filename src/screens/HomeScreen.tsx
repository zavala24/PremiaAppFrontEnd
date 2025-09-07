// src/screens/ExploreBusinessesScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View as RNView,
  Text as RNText,
  TextInput as RNTextInput,
  Pressable as RNPressable,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Image as RNImage,
  Platform,
} from "react-native";
import { styled } from "nativewind";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const Pressable = styled(RNPressable);
const Image = styled(RNImage);
const Safe = styled(SafeAreaView);

type Business = { id: number; name: string; category: string; logoUrl?: string };

const MOCK: Business[] = [
  { id: 1, name: "Pizzería Don Luigi", category: "Pizzería", logoUrl: "https://images.unsplash.com/photo-1548365328-9f547fb095f4?q=80&w=800&auto=format&fit=crop" },
  { id: 2, name: "Taquería El Güero", category: "Taquería", logoUrl: "https://images.unsplash.com/photo-1601924582971-b0b3b63d0c10?q=80&w=800&auto=format&fit=crop" },
  { id: 3, name: "Café Nube", category: "Cafetería", logoUrl: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=800&auto=format&fit=crop" },
  { id: 4, name: "Purificadora Blue", category: "Purificadora", logoUrl: "https://images.unsplash.com/photo-1518459031867-a89b944bffe0?q=80&w=800&auto=format&fit=crop" },
  { id: 5, name: "Estética Glam", category: "Estética", logoUrl: "https://images.unsplash.com/photo-1559599101-f09722fb0948?q=80&w=800&auto=format&fit=crop" },
  { id: 6, name: "Sushi Kumo", category: "Sushi", logoUrl: "https://images.unsplash.com/photo-1562158070-8e85a7a7d8d0?q=80&w=800&auto=format&fit=crop" },
  { id: 7, name: "Burger Bros", category: "Hamburguesas", logoUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop" },
  { id: 8, name: "La Parrilla 23", category: "Parrilla", logoUrl: "https://images.unsplash.com/photo-1550547660-36e0b1a57b56?q=80&w=800&auto=format&fit=crop" },
  { id: 9, name: "Té Matcha House", category: "Bebidas", logoUrl: "https://images.unsplash.com/photo-1556679343-c7306c2b5f73?q=80&w=800&auto=format&fit=crop" },
  { id: 10, name: "Pastelería D’Cielo", category: "Pastelería", logoUrl: "https://images.unsplash.com/photo-1541782814455-c6e573b38a47?q=80&w=800&auto=format&fit=crop" },
  { id: 11, name: "Helados Aurora", category: "Heladería", logoUrl: "https://images.unsplash.com/photo-1464347744102-11db6282f854?q=80&w=800&auto=format&fit=crop" },
  { id: 12, name: "Farmacia Central", category: "Farmacia", logoUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop" },
  { id: 13, name: "Verduras Frescas", category: "Abarrotes", logoUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop" },
  { id: 14, name: "Panadería San José", category: "Panadería", logoUrl: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=800&auto=format&fit=crop" },
  { id: 15, name: "Spa Serena", category: "Spa", logoUrl: "https://images.unsplash.com/photo-1588195538052-8b4701b9f3d8?q=80&w=800&auto=format&fit=crop" },
  { id: 16, name: "Clínica Dental Sonríe", category: "Salud", logoUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a2?q=80&w=800&auto=format&fit=crop" },
  { id: 17, name: "Pollo Asado Rey", category: "Parrilla", logoUrl: "https://images.unsplash.com/photo-1550547660-36e0b1a57b56?q=80&w=800&auto=format&fit=crop" },
  { id: 18, name: "Tortas La Esquina", category: "Tortas", logoUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop" },
  { id: 19, name: "Ramen Ichiban", category: "Ramen", logoUrl: "https://images.unsplash.com/photo-1543353071-10c8ba85a904?q=80&w=800&auto=format&fit=crop" },
  { id: 20, name: "Açaí & Smoothies", category: "Bebidas", logoUrl: "https://images.unsplash.com/photo-1542444459-db63c2b0703b?q=80&w=800&auto=format&fit=crop" },
];

const PAGE_SIZE = 10;
type TabKey = "all" | "mine";

export default function ExploreBusinessesScreen() {
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [following, setFollowing] = useState<Set<number>>(new Set([2, 3, 7]));
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const listRef = useRef<FlatList<Business>>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = useMemo(() => {
    const base = tab === "all" ? MOCK : MOCK.filter((b) => following.has(b.id));
    if (!debounced) return base;
    return base.filter(
      (b) =>
        b.name.toLowerCase().includes(debounced) ||
        b.category.toLowerCase().includes(debounced)
    );
  }, [tab, debounced, following]);

  const paged = useMemo(() => {
    const end = Math.min(filtered.length, page * PAGE_SIZE);
    return filtered.slice(0, end);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [tab, debounced]);

  useEffect(() => {
    const t = setTimeout(() => setInitialLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const canLoadMore = paged.length < filtered.length;
  const handleEndReached = () => {
    if (!canLoadMore || loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setPage((p) => p + 1);
      setLoadingMore(false);
    }, 350);
  };

  const toggleFollow = (id: number) => {
    setFollowing((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const renderCard = ({ item }: { item: Business }) => {
    const isFollowing = following.has(item.id);
    return (
      <Pressable
        className="w-[48%] rounded-2xl mb-4 overflow-hidden border border-blue-100 bg-[#F9FAFB] active:opacity-95"
        style={{ marginHorizontal: "1%" }}
      >
        <View className="h-36 bg-blue-50">
          {item.logoUrl ? (
            <Image source={{ uri: item.logoUrl }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="flex-1 items-center justify-center">
              <MaterialCommunityIcons name="storefront-outline" size={42} color="#2563EB" />
            </View>
          )}

          <View className="absolute left-2 top-2 bg-blue-100/95 px-2 py-1 rounded-full border border-blue-200">
            <Text className="text-[11px] text-blue-800" numberOfLines={1}>
              {item.category}
            </Text>
          </View>

          <Pressable
            onPress={() => toggleFollow(item.id)}
            className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-white/95 border border-blue-100"
          >
            <MaterialCommunityIcons
              name={isFollowing ? "heart" : "heart-outline"}
              size={20}
              color={isFollowing ? "#EF4444" : "#1F2937"}
            />
          </Pressable>
        </View>

        <View className="p-3">
          <Text className="font-semibold text-gray-900" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>
            {isFollowing ? "Siguiendo" : "Toca el corazón para seguir"}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-blue-600">
      <StatusBar barStyle="light-content" />

      {/* Burbujas exteriores */}
      <View pointerEvents="none" className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-400/25" />
      <View pointerEvents="none" className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-blue-800/25" />

      {/* 👉 Top igual que Configuración: sin extra grande, solo safe-area */}
      <Safe
        className="flex-1 px-4 pb-2"
        edges={["top", "left", "right"]}
        style={{ paddingTop: insets.top + (Platform.OS === "android" ? 2 : 0) }}
      >
        {/* Contenedor principal blanco (mismo estándar) */}
        <View className="flex-1 bg-white rounded-3xl p-6 border border-blue-100 shadow-2xl">
          {/* Burbujas internas suaves */}
          <View pointerEvents="none" className="absolute -top-6 -right-8 h-24 w-24 rounded-2xl bg-blue-100/40" />
          <View pointerEvents="none" className="absolute bottom-8 left-4 h-20 w-20 rounded-2xl bg-blue-100/30 -rotate-6" />

          {/* Título con el MISMO estilo */}
          <Text className="text-3xl font-extrabold text-blue-700 text-center">Explorar</Text>
          <Text className="text-gray-500 text-center mt-1 mb-5">
            Descubre negocios y promociones cerca de ti
          </Text>

          {/* Buscador estilo inputs del proyecto */}
          <View className="rounded-2xl border border-gray-300 bg-white px-4 py-3 shadow-sm flex-row items-center">
            <MaterialCommunityIcons name="magnify" size={20} color="#6B7280" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar negocios"
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-2 text-base text-gray-800"
              returnKeyType="search"
            />
            {!!query && (
              <Pressable onPress={() => setQuery("")} className="pl-2">
                <MaterialCommunityIcons name="close-circle-outline" size={18} color="#9CA3AF" />
              </Pressable>
            )}
          </View>

          {/* Tabs alineadas como en tus pantallas */}
          <View className="mt-4 flex-row items-end">
            {[
              { key: "all" as const, label: "Negocios" },
              { key: "mine" as const, label: "Mis negocios" },
            ].map((t, idx) => {
              const active = tab === t.key;
              return (
                <Pressable key={t.key} onPress={() => setTab(t.key)} className={idx === 0 ? "mr-6" : ""}>
                  <Text className={`text-base font-semibold ${active ? "text-blue-700" : "text-blue-700/50"}`}>
                    {t.label}
                  </Text>
                  <View className={`h-0.5 mt-1 rounded-full ${active ? "bg-blue-700" : "bg-transparent"}`} />
                </Pressable>
              );
            })}
            <View className="flex-1 items-end">
              <Pressable className="h-9 px-3 items-center justify-center rounded-xl bg-white border border-blue-100 shadow-sm active:opacity-90">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="tune-variant" size={18} color="#1F2937" />
                  <Text className="ml-1 text-gray-700 text-sm">Filtros</Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Grid */}
          <View className="flex-1 mt-3">
            {initialLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color="#1D4ED8" />
                <Text className="text-blue-800/70 mt-2">Cargando…</Text>
              </View>
            ) : (
              <FlatList
                ref={listRef}
                data={paged}
                keyExtractor={(it) => String(it.id)}
                numColumns={2}
                renderItem={renderCard}
                contentContainerStyle={{ paddingBottom: 8 }}
                showsVerticalScrollIndicator={false}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.35}
                ListEmptyComponent={
                  <View className="items-center mt-16">
                    <MaterialCommunityIcons name="text-search" size={36} color="#93C5FD" />
                    <Text className="text-blue-800/70 mt-2">Sin resultados</Text>
                  </View>
                }
                ListFooterComponent={
                  loadingMore ? (
                    <View className="py-4">
                      <ActivityIndicator color="#2563EB" />
                    </View>
                  ) : null
                }
              />
            )}
          </View>
        </View>
      </Safe>
    </View>
  );
}
