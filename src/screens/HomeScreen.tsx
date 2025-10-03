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
  puntosAcumulados?: number | null;
};

type TabKey = "all" | "mine";
type Nav = NativeStackNavigationProp<RootStackParamList>;

const currency = (n?: number | null) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    typeof n === "number" ? n : 0
  );

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Ahora cualquiera (sin importar el rol) puede seguir negocios.
  // Usamos el teléfono para asociar el follow.
  const telefono = user?.telefono?.trim() ?? "";
  const canFollow = !!telefono;

  const businessService: IBusinessService = new BusinessService(new BusinessRepository());

  // ======= Paginado (todos) =======
  const {
    items,
    loading,
    refreshing,
    initialLoading,
    hasNext,
    onEndReached,
    onRefresh,
    query,
    setQuery,
  } = useBusinessesPaged(10);

  const uiAll: UiBusiness[] = useMemo(
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
        puntosAcumulados: null,
      })),
    [items]
  );

  // ======= Mis negocios (seguidos) =======
  const [tab, setTab] = useState<TabKey>("all");
  const [myLoading, setMyLoading] = useState(false);
  const [myRefreshing, setMyRefreshing] = useState(false);
  const [myItems, setMyItems] = useState<UiBusiness[]>([]);
  const [followSet, setFollowSet] = useState<Set<number>>(new Set());
  const [pointsByBiz, setPointsByBiz] = useState<Record<number, number>>({});

  const fetchMyBusinesses = async () => {
    if (!canFollow) return; // requiere teléfono para poder consultar
    setMyLoading(true);
    try {
      const { status, data, message } =
        await businessService.getNegociosSeguidosByTelefono(telefono);

      if (status < 200 || status >= 300) throw new Error(message || "No se pudieron obtener tus negocios.");

      const ui = (data ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        category: b.category,
        logoUrl: b.configuracion?.urlLogo ?? null,
        facebook: b.facebook,
        instagram: b.instagram,
        sitioWeb: b.sitioWeb,
        direccion: b.direccion,
        descripcion: b.descripcion,
        puntosAcumulados: b.puntosAcumulados ?? null,
      }));

      setMyItems(ui);
      setFollowSet(new Set(ui.map((x) => x.id)));

      const map: Record<number, number> = {};
      ui.forEach((x) => {
        if (typeof x.puntosAcumulados === "number") map[x.id] = x.puntosAcumulados;
      });
      setPointsByBiz(map);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "No se pudieron obtener tus negocios.");
    } finally {
      setMyLoading(false);
    }
  };

  // Carga inicial seguidos
  const didLoadFollows = useRef(false);
  useEffect(() => {
    if (!canFollow) return;
    if (didLoadFollows.current) return;
    didLoadFollows.current = true;
    fetchMyBusinesses();
  }, [canFollow, telefono]);

  const refreshMine = async () => {
    if (!canFollow) return;
    setMyRefreshing(true);
    try { await fetchMyBusinesses(); } finally { setMyRefreshing(false); }
  };
  const refreshAll = async () => { await Promise.all([onRefresh(), fetchMyBusinesses()]); };

  // ======= Buscador =======
  const [localQuery, setLocalQuery] = useState(query ?? "");
  useEffect(() => {
    const t = setTimeout(() => setQuery(localQuery.trim()), 220);
    return () => clearTimeout(t);
  }, [localQuery, setQuery]);

  // ======= Toggle seguir =======
  const [pending, setPending] = useState<Record<number, boolean>>({});
  const toggleFollow = async (businessId: number) => {
    if (!canFollow) {
      Alert.alert("Acción no permitida", "Inicia sesión y agrega tu teléfono para seguir negocios.");
      return;
    }
    if (pending[businessId]) return;

    const willFollow = !followSet.has(businessId);

    // UI optimista
    setPending((p) => ({ ...p, [businessId]: true }));
    setFollowSet((s) => { const next = new Set(s); willFollow ? next.add(businessId) : next.delete(businessId); return next; });
    if (willFollow) setPointsByBiz((m) => ({ ...m, [businessId]: m[businessId] ?? 0 }));
    else setPointsByBiz((m) => { const { [businessId]: _, ...rest } = m; return rest; });

    try {
      const resp = await businessService.actualizarSeguirNegocioByTelefono(businessId, telefono, willFollow);
      if (resp.status < 200 || resp.status >= 300) throw new Error(resp.message || "No se pudo actualizar el seguimiento.");

      if (willFollow) {
        const found = uiAll.find((x) => x.id === businessId);
        if (found && !myItems.some((x) => x.id === businessId)) setMyItems((arr) => [{ ...found, puntosAcumulados: 0 }, ...arr]);
      } else {
        setMyItems((arr) => arr.filter((x) => x.id !== businessId));
      }
    } catch (e: any) {
      // rollback
      setFollowSet((s) => { const next = new Set(s); willFollow ? next.delete(businessId) : next.add(businessId); return next; });
      if (willFollow) setPointsByBiz((m) => { const { [businessId]: _, ...rest } = m; return rest; });
      Alert.alert("Ups", e?.message || "No se pudo actualizar el seguimiento.");
    } finally {
      setPending((p) => ({ ...p, [businessId]: false }));
    }
  };

  // ======= Helpers UI =======
  const listRef = useRef<FlatList<UiBusiness>>(null);
  useEffect(() => { listRef.current?.scrollToOffset({ offset: 0, animated: false }); }, [tab, localQuery]);

  const gotoDetail = (b: UiBusiness) => {
    navigation.navigate("BusinessDetail", {
      business: {
        id: b.id,
        name: b.name,
        category: b.category ?? null,
        logoUrl: b.logoUrl ?? null,
        facebook: b.facebook ?? null,
        instagram: b.instagram ?? null,
        sitioWeb: b.sitioWeb ?? null,
        direccion: b.direccion ?? null,
        descripcion: b.descripcion ?? null,
      },
    });
  };

  // ======= UI: segmented =======
  const Segmented = () => (
    <View className="mt-4 rounded-2xl bg-blue-50 border border-blue-100 p-1 flex-row">
      {[
        { key: "all" as const, label: "Negocios" },
        { key: "mine" as const, label: "Mis negocios" },
      ].map((t) => {
        const active = tab === t.key;
        const disabled = t.key === "mine" && !canFollow;
        return (
          <Pressable
            key={t.key}
            onPress={() =>
              disabled
                ? Alert.alert("Solo para cuentas con teléfono", "Inicia sesión y agrega tu teléfono para ver tus negocios seguidos.")
                : setTab(t.key)
            }
            className={`flex-1 py-2 rounded-xl items-center ${active ? "bg-white shadow-sm" : ""} ${disabled ? "opacity-40" : ""}`}
          >
            <Text className={`font-semibold ${active ? "text-blue-700" : "text-blue-600/70"}`}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  // ======= UI: card compacta =======
  const BusinessCard = ({ item }: { item: UiBusiness }) => {
    const isFollowing = followSet.has(item.id);
    const isBusy = !!pending[item.id];
    const puntos = isFollowing ? pointsByBiz[item.id] ?? item.puntosAcumulados ?? 0 : undefined;

    return (
      <View className="w-[47%] rounded-2xl mb-3 overflow-hidden border border-blue-100 bg-white">
        {/* Imagen compacta */}
        <View className="h-28 bg-blue-50 relative">
          {item.logoUrl ? (
            <Image source={{ uri: item.logoUrl }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <View className="flex-1 items-center justify-center">
              <MaterialCommunityIcons name="storefront-outline" size={36} color="#2563EB" />
            </View>
          )}

          {/* Chips pequeños */}
          {!!item.category && (
            <View className="absolute left-2 top-2 px-2 py-[3px] rounded-full bg-white/95 border border-blue-100">
              <Text className="text-[10px] font-semibold text-blue-700" numberOfLines={1}>
                {item.category}
              </Text>
            </View>
          )}

          {/* Corazón */}
          <Pressable
            onPress={() => toggleFollow(item.id)}
            disabled={isBusy || !canFollow}
            className={`absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-white border border-blue-100 shadow-sm ${
              isBusy || !canFollow ? "opacity-50" : "active:opacity-90"
            }`}
          >
            <MaterialCommunityIcons
              name={isFollowing ? "heart" : "heart-outline"}
              size={18}
              color={isFollowing ? "#EF4444" : "#1F2937"}
            />
          </Pressable>
        </View>

        {/* Texto compacto */}
        <View className="px-3 pt-2 pb-3">
          <Text className="font-bold text-slate-900 text-[13.5px]" numberOfLines={1}>
            {item.name}
          </Text>

          {/* El subtítulo ahora cabe: 2 líneas, más chico */}
          {isFollowing ? (
            <Text className="text-blue-900/80 text-[11px] mt-1 leading-4" numberOfLines={2}>
              Tus puntos en este negocio
            </Text>
          ) : (
            <Text className="text-slate-500 text-[11px] mt-1 leading-4" numberOfLines={2}>
              Toca el corazón para seguir
            </Text>
          )}

          {/* Footer compacto */}
          <View className="flex-row items-center justify-between mt-2">
            {isFollowing ? (
              <View className="px-2 py-1 rounded-lg bg-blue-50 border border-blue-200 flex-row items-center">
                <MaterialCommunityIcons name="wallet-outline" size={13} color="#1D4ED8" />
                <Text className="ml-1 text-[11px] font-extrabold text-blue-700">
                  {currency(puntos)}
                </Text>
              </View>
            ) : (
              <View className="h-[26px]" />
            )}

            <Pressable
              onPress={() => gotoDetail(item)}
              className="px-3 py-[6px] rounded-lg bg-white border border-blue-600"
            >
              <Text className="text-blue-700 font-semibold text-[12px]">Ver</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  // ======= Render =======
  const isMine = tab === "mine";
  const data = isMine ? myItems : uiAll;

  return (
    <View className="flex-1 bg-blue-600">
      <StatusBar barStyle="light-content" />

      {/* Burbujas */}
      <View pointerEvents="none" className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-400/25" />
      <View pointerEvents="none" className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-blue-800/25" />

      <Safe
        className="flex-1 px-4 pb-2"
        edges={["top", "left", "right"]}
        style={{ paddingTop: insets.top + (Platform.OS === "android" ? 2 : 0) }}
      >
        <View className="flex-1 bg-white rounded-3xl p-6 border border-blue-100 shadow-2xl">
          {/* Header */}
          <Text className="text-3xl font-black text-blue-700 text-center tracking-tight">Negocios</Text>
          <Text className="text-slate-500 text-center mt-1 mb-4">Descubre negocios y promociones cerca de ti</Text>

          {/* Search redondeado */}
          <View className="rounded-full border border-blue-100 bg-white px-4 py-3 shadow-sm flex-row items-center">
            <MaterialCommunityIcons name="magnify" size={20} color="#6B7280" />
            <TextInput
              value={localQuery}
              onChangeText={setLocalQuery}
              placeholder="Buscar negocios"
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-2 text-base text-slate-800"
              returnKeyType="search"
            />
            {!!localQuery && (
              <Pressable onPress={() => setLocalQuery("")} className="pl-2">
                <MaterialCommunityIcons name="close-circle-outline" size={18} color="#9CA3AF" />
              </Pressable>
            )}
          </View>

          {/* Tabs */}
          <Segmented />

          {/* Grid compacto */}
          <View className="flex-1 mt-3">
            {(isMine ? myLoading || initialLoading : initialLoading) ? (
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
                renderItem={({ item }) => <BusinessCard item={item} />}
                contentContainerStyle={{ paddingBottom: 8 }}
                columnWrapperStyle={{ justifyContent: "space-between" }} // ← mejor separación
                showsVerticalScrollIndicator={false}
                onEndReached={isMine ? undefined : hasNext ? onEndReached : undefined}
                onEndReachedThreshold={0.35}
                refreshControl={
                  <RefreshControl
                    refreshing={isMine ? myRefreshing : refreshing}
                    onRefresh={isMine ? refreshMine : refreshAll}
                    tintColor="#1D4ED8"
                  />
                }
                ListEmptyComponent={
                  <View className="items-center mt-16">
                    <MaterialCommunityIcons name="text-search" size={36} color="#93C5FD" />
                    <Text className="text-blue-800/70 mt-2">
                      {isMine ? "Aún no sigues ningún negocio" : "Sin resultados"}
                    </Text>
                  </View>
                }
                ListFooterComponent={
                  !isMine && loading && hasNext ? (
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
