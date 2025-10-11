// src/screens/NotificationsScreen.tsx
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
} from "react-native";
import { styled } from "nativewind";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "../presentation/context/AuthContext";

// Dominio/servicio
import { AppNotification } from "../domain/entities/AppNotification";
import { NotificationsService } from "../application/services/NotificationsService";
import { NotificationsRepository } from "../infrastructure/repositories/NotificationsRepository";
import { INotificationsService } from "../application/interfaces/InotificationsService";

const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const Pressable = styled(RNPressable);
const Image = styled(RNImage);
const Safe = styled(SafeAreaView);

const PAGE_SIZE = 20;

type GroupByBusiness = {
  negocioNombre: string;
  urlLogo?: string | null;
  items: AppNotification[];
};

type SectionByDate = {
  dateKey: string;   // YYYY-MM-DD
  dateLabel: string; // ej. 10 oct 2025
  groups: GroupByBusiness[];
};

const fmtDateLabel = (iso: string) => {
  const d = new Date(iso);
  // “10 oct 2025”
  return d.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};
const ymd = (iso: string) => {
  const d = new Date(iso);
  const mm = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const serviceRef = useRef<INotificationsService>(
    new NotificationsService(new NotificationsRepository())
  ).current;

  // Estado
  const [items, setItems] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Buscador
  const [localQuery, setLocalQuery] = useState("");
  const [query, setQuery] = useState<string | undefined>(undefined);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => {
      const q = localQuery.trim();
      setQuery(q.length ? q : undefined);
      setPage(1);
      setHasNext(true);
    }, 220);
    return () => clearTimeout(t);
  }, [localQuery]);

  // Cargar página
  const pendingRef = useRef(false);
  const loadPage = async (nextPage: number, isRefresh = false) => {
    if (pendingRef.current || !hasNext) return;
    if (!user?.telefono?.trim()) return;

    pendingRef.current = true;
    isRefresh ? setRefreshing(true) : setLoading(true);
    if (nextPage === 1) setInitialLoading(true);

    try {
      const resp = await serviceRef.GetNotificacionesByUsuarioPaged({
        numeroTelefono: user.telefono.trim(),
        page: nextPage,
        pageSize: PAGE_SIZE,
        search: query,
      });

      const paged = resp.data;
      const newItems: AppNotification[] = paged?.items ?? [];

      setItems((prev) => (nextPage === 1 ? newItems : [...prev, ...newItems]));
      setHasNext(!!paged?.hasNext);
      setPage(nextPage);
    } finally {
      pendingRef.current = false;
      isRefresh ? setRefreshing(false) : setLoading(false);
      setInitialLoading(false);
    }
  };

  // Inicial + cambios de query/teléfono
  useEffect(() => {
    setHasNext(true);
    loadPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, user?.telefono]);

  const onRefresh = async () => {
    await loadPage(1, true);
  };
  const onEndReached = () => {
    if (hasNext && !loading && !initialLoading) loadPage(page + 1);
  };

  // Agrupar: fecha → negocio
  const sections: SectionByDate[] = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const map = new Map<string, SectionByDate>();

    for (const it of sorted) {
      const dk = ymd(it.createdAt);
      if (!map.has(dk)) {
        map.set(dk, {
          dateKey: dk,
          dateLabel: fmtDateLabel(it.createdAt),
          groups: [],
        });
      }
      const sec = map.get(dk)!;

      let group = sec.groups.find((g) => g.negocioNombre === it.businessName);
      if (!group) {
        group = {
          negocioNombre: it.businessName,
          urlLogo: it.logoUrl ?? null,
          items: [],
        };
        sec.groups.push(group);
      }
      group.items.push(it);
    }

    const arr = Array.from(map.values());
    for (const s of arr) {
      s.groups.sort((a, b) =>
        a.negocioNombre.localeCompare(b.negocioNombre, "es-MX")
      );
    }
    arr.sort((a, b) => (a.dateKey > b.dateKey ? -1 : 1));
    return arr;
  }, [items]);

  // UI helpers
  const BusinessHeader = ({
    name,
    url,
  }: {
    name: string;
    url?: string | null;
  }) => (
    <View className="flex-row items-center mt-3 mb-1">
      {url ? (
        <Image source={{ uri: url }} className="h-8 w-8 rounded-full bg-blue-50" />
      ) : (
        <View className="h-8 w-8 rounded-full bg-blue-50 items-center justify-center">
          <MaterialCommunityIcons name="storefront-outline" size={18} color="#2563EB" />
        </View>
      )}
      <Text className="ml-2 text-[13px] font-extrabold text-slate-900">
        {name}
      </Text>
    </View>
  );

  const NotificationItem = ({ it }: { it: AppNotification }) => (
    <View className="p-3 rounded-xl bg-white border border-blue-100 mt-2">
      <Text className="text-[12.5px] font-bold text-blue-800">{it.title}</Text>
      <Text className="text-[12px] text-slate-600 mt-1">{it.body}</Text>
    </View>
  );

  // Tarjeta por fecha
  const DateSectionCard = ({ section }: { section: SectionByDate }) => (
    <View className="mt-4">
      <View className="rounded-2xl border border-blue-100 bg-blue-50/40 shadow-sm">
        {/* Encabezado del card (fecha) */}
        <View className="px-4 py-3 border-b border-blue-100 flex-row items-center">
          <MaterialCommunityIcons name="calendar-blank-outline" size={18} color="#1D4ED8" />
          <Text className="ml-2 text-[15px] font-extrabold text-blue-900">
            {section.dateLabel}
          </Text>
        </View>

        {/* Contenido del día */}
        <View className="px-4 pb-4 pt-1">
          {section.groups.map((g, idx) => (
            <View key={`${section.dateKey}-${g.negocioNombre}-${idx}`}>
              <BusinessHeader name={g.negocioNombre} url={g.urlLogo} />
              {g.items.map((n) => (
                <NotificationItem key={n.id} it={n} />
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-blue-600">
      <StatusBar barStyle="light-content" />

      {/* Burbujas decorativas */}
      <View pointerEvents="none" className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-400/25" />
      <View pointerEvents="none" className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-blue-800/25" />

      <Safe className="flex-1 px-4 pb-2" edges={["top", "left", "right"]}>
        <View className="flex-1 bg-white rounded-3xl p-6 border border-blue-100 shadow-2xl mt-16">
          {/* Header */}
          <View className="items-center mb-1">
            <MaterialCommunityIcons name="tag-outline" size={24} color="#1D4ED8" />
            <Text className="text-3xl font-black text-blue-700 mt-1">Promociones</Text>
            <Text className="text-slate-500 text-center mt-1">
              Ofertas y anuncios de los negocios que sigues
            </Text>
          </View>

          {/* Search */}
          <View className="rounded-full border border-blue-100 bg-white px-4 py-3 shadow-sm flex-row items-center mt-2">
            <MaterialCommunityIcons name="magnify" size={20} color="#6B7280" />
            <TextInput
              value={localQuery}
              onChangeText={setLocalQuery}
              placeholder="Buscar negocio"
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-2 text-base text-slate-800 py-0"
              style={{
                paddingVertical: 0,
                ...(Platform.OS === "android" ? { textAlignVertical: "center" as const } : null),
              }}
              returnKeyType="search"
            />
            {!!localQuery && (
              <Pressable onPress={() => setLocalQuery("")} className="pl-2">
                <MaterialCommunityIcons name="close-circle-outline" size={18} color="#9CA3AF" />
              </Pressable>
            )}
          </View>

          {/* Lista por días (cada día = card) */}
          <View className="flex-1 mt-4">
            {initialLoading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color="#1D4ED8" />
                <Text className="text-blue-800/70 mt-2">Cargando…</Text>
              </View>
            ) : (
              <FlatList
                data={sections}
                keyExtractor={(s) => s.dateKey}
                renderItem={({ item }) => <DateSectionCard section={item} />}
                contentContainerStyle={{ paddingBottom: 8 + insets.bottom }}
                showsVerticalScrollIndicator={false}
                onEndReached={hasNext ? onEndReached : undefined}
                onEndReachedThreshold={0.35}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1D4ED8" />
                }
                ListEmptyComponent={
                  <View className="items-center mt-16">
                    <MaterialCommunityIcons name="tag-off-outline" size={36} color="#93C5FD" />
                    <Text className="text-blue-800/70 mt-2">No hay promociones por ahora</Text>
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
      </Safe>
    </View>
  );
}
