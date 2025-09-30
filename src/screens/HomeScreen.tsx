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
  Platform,
  RefreshControl,
  Alert,
} from "react-native";
import { styled } from "nativewind";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/StackNavigator";
import { useAuth } from "../presentation/context/AuthContext";

import { useBusinessesPaged, ApiBusiness } from "../presentation/hooks/useBusinessPaged";
import { BusinessService } from "../application/services/BusinessService";
import { BusinessRepository } from "../infrastructure/repositories/BusinessRepository";
import { IBusinessService } from "../application/interfaces/IBusinessService";
import { UserService } from "../application/services/UserServices";
import { UserRepository } from "../infrastructure/repositories/UserRepository";

const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const Pressable = styled(RNPressable);
const Image = styled(RNImage);
const Safe = styled(SafeAreaView);

type UiBusiness = {
  id: number;
  name: string;
  category?: string | null;
  logoUrl?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  sitioWeb?: string | null;
  direccion?: string | null;
  descripcion?: string | null;
  activo?: boolean | null;
};

type TabKey = "all" | "mine";
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth(); // { nombre, role, telefono }
  const role = user?.role ?? null;
  const canFollow = role === "User";

  const businessService: IBusinessService = new BusinessService(new BusinessRepository());
  const {
    items, loading, refreshing, initialLoading, hasNext,
    onEndReached, onRefresh, query, setQuery,
  } = useBusinessesPaged(10);

  const [tab, setTab] = useState<TabKey>("all");
  const [followMap, setFollowMap] = useState<Record<number, boolean>>({});
  const [pending, setPending] = useState<Record<number, boolean>>({});
  const [localQuery, setLocalQuery] = useState(query ?? "");

  useEffect(() => {
    const t = setTimeout(() => setQuery(localQuery.trim()), 200);
    return () => clearTimeout(t);
  }, [localQuery, setQuery]);

  const uiItems: UiBusiness[] = useMemo(
    () =>
      (items as ApiBusiness[]).map((b) => ({
        id: b.idNegocio,
        name: b.nombre,
        category: b.categoria ?? null,
        logoUrl: b.configuracion?.urlLogo ?? b.urlLogo ?? null,
        facebook: b.facebook ?? null,
        instagram: b.instagram ?? null,
        sitioWeb: b.sitioWeb ?? null,
        direccion: b.direccion ?? null,
        descripcion: b.descripcion ?? null,
        activo: (b as any)?.activo ?? (b as any)?.seguido ?? null,
      })),
    [items]
  );

  // hidratar followMap si viene “activo”
  useEffect(() => {
    const next = { ...followMap };
    let changed = false;
    for (const it of uiItems) {
      if (typeof it.activo === "boolean" && next[it.id] !== it.activo) {
        next[it.id] = it.activo;
        changed = true;
      }
    }
    if (changed) setFollowMap(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiItems]);

  // “Mis negocios” = solo activos
  const data = useMemo(() => {
    if (tab === "all") return uiItems;
    return uiItems.filter((b) => !!followMap[b.id]);
  }, [uiItems, tab, followMap]);

  const listRef = useRef<FlatList<UiBusiness>>(null);
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [tab, localQuery]);

  const notAllowed = () =>
    Alert.alert("Acción no permitida", "Solo usuarios de tipo User pueden seguir negocios.");

  const toggleFollow = async (businessId: number) => {
    if (!canFollow) return notAllowed();
    if (pending[businessId]) return;

    const telefono = user?.telefono?.trim();
    if (!telefono) {
      Alert.alert("Usuario sin teléfono", "No fue posible obtener tu número de teléfono.");
      return;
    }

    const nextActivo = !followMap[businessId];
    setFollowMap((m) => ({ ...m, [businessId]: nextActivo })); // optimista
    setPending((p) => ({ ...p, [businessId]: true }));

    try {
      const resp = await businessService.actualizarSeguirNegocioByTelefono(
        businessId,
        telefono,
        nextActivo
      );
      if (resp.status < 200 || resp.status >= 300) {
        throw new Error(resp.message || "No se pudo actualizar el seguimiento.");
      }
    } catch (err: any) {
      // rollback
      setFollowMap((m) => ({ ...m, [businessId]: !nextActivo }));
      Alert.alert("Ups", err?.message || "No se pudo actualizar el seguimiento.");
    } finally {
      setPending((p) => ({ ...p, [businessId]: false }));
    }
  };

  const gotoDetail = (b: UiBusiness) => {
    navigation.navigate("BusinessDetail", {
      business: {
        id: b.id, name: b.name, category: b.category ?? null, logoUrl: b.logoUrl ?? null,
        facebook: b.facebook ?? null, instagram: b.instagram ?? null, sitioWeb: b.sitioWeb ?? null,
        direccion: b.direccion ?? null, descripcion: b.descripcion ?? null,
      },
    });
  };

  const renderCard = ({ item }: { item: UiBusiness }) => {
    const isFollowing = !!followMap[item.id];
    const isBusy = !!pending[item.id];

    return (
      <View
        className="w-[48%] rounded-2xl mb-4 overflow-hidden border border-blue-100 bg-[#F9FAFB]"
        style={{ marginHorizontal: "1%" }}
      >
        {/* Media */}
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
              <Text className="text-[11px] text-blue-800" numberOfLines={1}>{item.category}</Text>
            </View>
          )}

          <Pressable
            onPress={() => (canFollow ? toggleFollow(item.id) : notAllowed())}
            disabled={isBusy || !canFollow}
            className={`absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-white/95 border border-blue-100 ${
              isBusy || !canFollow ? "opacity-50" : "active:opacity-90"
            }`}
          >
            <MaterialCommunityIcons
              name={isFollowing ? "heart" : "heart-outline"}
              size={20}
              color={isFollowing ? "#EF4444" : "#1F2937"}
            />
          </Pressable>
        </View>

        {/* Info */}
        <View className="p-3">
          <Text className="font-semibold text-gray-900" numberOfLines={1}>{item.name}</Text>
          <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>
            {canFollow
              ? (isFollowing ? "Siguiendo" : "Toca el corazón para seguir")
              : "Tu rol no permite seguir"}
          </Text>

          <Pressable
            onPress={() => gotoDetail(item)}
            className="self-start mt-3 px-4 py-2 rounded-xl border border-blue-600 bg-white active:opacity-90"
          >
            <Text className="text-blue-700 font-semibold">Ver</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-blue-600">
      <StatusBar barStyle="light-content" />
      <View pointerEvents="none" className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-400/25" />
      <View pointerEvents="none" className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-blue-800/25" />

      <Safe
        className="flex-1 px-4 pb-2"
        edges={["top","left","right"]}
        style={{ paddingTop: insets.top + (Platform.OS === "android" ? 2 : 0) }}
      >
        <View className="flex-1 bg-white rounded-3xl p-6 border border-blue-100 shadow-2xl">
          {/* Header */}
          <Text className="text-3xl font-extrabold text-blue-700 text-center">Negocios</Text>
          <Text className="text-gray-500 text-center mt-1 mb-5">
            Descubre negocios y promociones cerca de ti
          </Text>

          {/* Tabs */}
          <View className="mt-4 flex-row items-end">
            {([
              { key: "all" as const, label: "Negocios" },
              { key: "mine" as const, label: "Mis negocios" },
            ] as const).map((t, idx) => {
              const active = tab === t.key;
              const disabled = t.key === "mine" && !canFollow;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => (disabled ? notAllowed() : setTab(t.key))}
                  disabled={disabled}
                  className={idx === 0 ? "mr-6" : ""}
                >
                  <Text
                    className={`text-base font-semibold ${
                      active ? "text-blue-700" : "text-blue-700/50"
                    } ${disabled ? "opacity-40" : ""}`}
                  >
                    {t.label}
                  </Text>
                  <View className={`h-0.5 mt-1 rounded-full ${active ? "bg-blue-700" : "bg-transparent"}`} />
                </Pressable>
              );
            })}
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
                data={data}
                keyExtractor={(it) => String(it.id)}
                numColumns={2}
                renderItem={renderCard}
                contentContainerStyle={{ paddingBottom: 8 }}
                showsVerticalScrollIndicator={false}
                onEndReached={hasNext ? onEndReached : undefined}
                onEndReachedThreshold={0.35}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1D4ED8" />}
                ListEmptyComponent={
                  <View className="items-center mt-16">
                    <MaterialCommunityIcons name="text-search" size={36} color="#93C5FD" />
                    <Text className="text-blue-800/70 mt-2">
                      {tab === "mine" && !canFollow
                        ? "Tu rol no permite ver Mis negocios"
                        : "Sin resultados"}
                    </Text>
                  </View>
                }
                ListFooterComponent={
                  loading && hasNext ? (
                    <View className="py-4"><ActivityIndicator color="#2563EB" /></View>
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
