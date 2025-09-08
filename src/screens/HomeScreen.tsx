// src/screens/HomeScreen.tsx
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
  RefreshControl,
} from "react-native";
import { styled } from "nativewind";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useBusinessesPaged } from "../presentation/hooks/useBusinessPaged";

const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const Pressable = styled(RNPressable);
const Image = styled(RNImage);

type ApiBusiness = {
  idNegocio: number;
  nombre: string;
  categoria?: string | null;
  urlLogo?: string | null;
};

type UiBusiness = {
  id: number;
  name: string;
  category: string;
  logoUrl?: string | null;
};

type TabKey = "all" | "mine";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  // márgenes adaptativos (compacto y no choca con la cámara)
  const topGap = Math.max(insets.top, 24) + 6;
  const bottomGap = Math.max(insets.bottom, 12);
  const sideGap = 18;

  const {
    items,
    loading,
    refreshing,
    hasNext,
    onEndReached,
    onRefresh,
    query,
    setQuery,
  } = useBusinessesPaged(10);

  const [tab, setTab] = useState<TabKey>("all");
  const [following, setFollowing] = useState<Set<number>>(new Set<number>());
  const [localQuery, setLocalQuery] = useState(query ?? "");

  useEffect(() => {
    const t = setTimeout(() => setQuery(localQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [localQuery, setQuery]);

  const uiItems: UiBusiness[] = useMemo(
    () =>
      (items as ApiBusiness[]).map((b) => ({
        id: b.idNegocio,
        name: b.nombre,
        category: b.categoria ?? "",
        logoUrl: b.urlLogo ?? undefined,
      })),
    [items]
  );

  const data = useMemo(() => {
    if (tab === "all") return uiItems;
    return uiItems.filter((b) => following.has(b.id));
  }, [uiItems, tab, following]);

  const listRef = useRef<FlatList<UiBusiness>>(null);
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [tab, localQuery]);

  const toggleFollow = (id: number) => {
    setFollowing((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const renderCard = ({ item }: { item: UiBusiness }) => {
    const isFollowing = following.has(item.id);
    return (
      <Pressable
        className="w-[48%] rounded-2xl mb-4 overflow-hidden border border-blue-100 bg-[#F9FAFB] active:opacity-95"
        style={{ marginHorizontal: "1%" }}
        accessibilityRole="button"
        accessibilityLabel={`Abrir negocio ${item.name}`}
      >
        <View className="h-36 bg-blue-50">
          {item.logoUrl ? (
            <Image source={{ uri: item.logoUrl }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="flex-1 items-center justify-center">
              <MaterialCommunityIcons name="storefront-outline" size={42} color="#2563EB" />
            </View>
          )}

          {!!item.category && (
            <View className="absolute left-2 top-2 bg-blue-100/95 px-2 py-1 rounded-full border border-blue-200">
              <Text className="text-[11px] text-blue-800" numberOfLines={1}>
                {item.category}
              </Text>
            </View>
          )}

          <Pressable
            onPress={() => toggleFollow(item.id)}
            className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-white/95 border border-blue-100"
            accessibilityRole="button"
            accessibilityLabel={isFollowing ? "Dejar de seguir" : "Seguir"}
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

  const initialLoading = items.length === 0 && (loading || refreshing);

  return (
    <View className="flex-1 bg-blue-600">
      <StatusBar barStyle="light-content" />

      {/* ✅ Burbujas de fondo (exteriores) */}
      <View pointerEvents="none" className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-400/25" />
      <View pointerEvents="none" className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-blue-800/25" />

      <SafeAreaView
        edges={["top", "left", "right"]}
        style={{
          paddingTop: topGap,
          paddingBottom: bottomGap,
          paddingHorizontal: sideGap,
          flex: 1,
        }}
      >
        <View
          className="border border-blue-100 shadow-2xl bg-white rounded-3xl"
          style={{
            alignSelf: "center",
            width: "92%",
            maxWidth: 460,
            padding: 16,
            flex: 1,
          }}
        >
          <Text className="text-3xl font-extrabold text-blue-700 text-center">Negocios</Text>
          <Text className="text-gray-500 text-center mt-1 mb-4">
            Descubre negocios y promociones cerca de ti
          </Text>

          <View className="rounded-2xl border border-gray-300 bg-white px-4 py-2.5 shadow-sm flex-row items-center">
            <MaterialCommunityIcons name="magnify" size={20} color="#6B7280" />
            <TextInput
              value={localQuery}
              onChangeText={setLocalQuery}
              placeholder="Buscar negocios"
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-2 text-base text-gray-800"
              returnKeyType="search"
            />
            {!!localQuery && (
              <Pressable
                onPress={() => setLocalQuery("")}
                className="pl-2"
                accessibilityRole="button"
                accessibilityLabel="Limpiar búsqueda"
              >
                <MaterialCommunityIcons name="close-circle-outline" size={18} color="#9CA3AF" />
              </Pressable>
            )}
          </View>

          <View className="mt-3 flex-row items-end">
            {([ { key: "all" as const, label: "Negocios" }, { key: "mine" as const, label: "Mis negocios" } ] as const).map((t, idx) => {
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
              <Pressable
                className="h-9 px-3 items-center justify-center rounded-xl bg-white border border-blue-100 shadow-sm active:opacity-90"
                accessibilityRole="button"
                accessibilityLabel="Abrir filtros"
              >
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="tune-variant" size={18} color="#1F2937" />
                  <Text className="ml-1 text-gray-700 text-sm">Filtros</Text>
                </View>
              </Pressable>
            </View>
          </View>

          <View className="flex-1 mt-3">
            {initialLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color="#1D4ED8" />
                <Text className="text-blue-800/70 mt-2">Cargando…</Text>
              </View>
            ) : (
              <FlatList
                ref={listRef}
                data={data}
                keyExtractor={(it) => String(it.id)}
                numColumns={2}
                renderItem={renderCard}
                contentContainerStyle={{ paddingBottom: 8 }}
                showsVerticalScrollIndicator={false}
                onEndReached={hasNext ? onEndReached : undefined}
                onEndReachedThreshold={0.35}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1D4ED8" />
                }
                ListEmptyComponent={
                  <View className="items-center mt-16">
                    <MaterialCommunityIcons name="text-search" size={36} color="#93C5FD" />
                    <Text className="text-blue-800/70 mt-2">Sin resultados</Text>
                  </View>
                }
                ListFooterComponent={
                  loading && hasNext ? (
                    <View className="py-4">
                      <ActivityIndicator color="#2563EB" />
                    </View>
                  ) : null
                }
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
