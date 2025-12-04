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
import { INotificationsService } from "../application/interfaces/INotificationsService";

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

  // Tarjeta expandida
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
        new Date(b.creadoCuando).getTime() - new Date(a.creadoCuando).getTime()
    );

    const map = new Map<string, SectionByDate>();

    for (const it of sorted) {
      const dk = ymd(it.creadoCuando);
      if (!map.has(dk)) {
        map.set(dk, {
          dateKey: dk,
          dateLabel: fmtDateLabel(it.creadoCuando),
          groups: [],
        });
      }
      const sec = map.get(dk)!;

      let group = sec.groups.find((g) => g.negocioNombre === it.businessName);
      if (!group) {
        group = {
          negocioNombre: it.businessName || "Negocio",
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
  type BusinessHeaderProps = {
    name: string;
    url?: string | null;
    onPress?: () => void;
  };

  const BusinessHeader = ({ name, url, onPress }: BusinessHeaderProps) => (
    <Pressable
      className="flex-row items-center mt-4 mb-2"
      onPress={onPress}
    >
      {url ? (
        <Image source={{ uri: url }} className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200" resizeMode="cover" />
      ) : (
        <View className="h-9 w-9 rounded-xl bg-blue-50 items-center justify-center border border-blue-100">
          <MaterialCommunityIcons
            name="storefront-outline"
            size={18}
            color="#2563EB"
          />
        </View>
      )}
      <Text
        className="ml-3 text-sm font-bold text-slate-800 flex-1"
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {name || "Negocio"}
      </Text>
    </Pressable>
  );

  type NotificationItemProps = {
    it: AppNotification;
    expanded: boolean;
    onToggle: () => void;
  };

  const NotificationItem = ({ it, expanded, onToggle }: NotificationItemProps) => (
    <Pressable
      onPress={onToggle}
      className={`mb-3 rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden transition-all ${
        expanded ? "border-blue-200 shadow-md" : ""
      }`}
    >
      <View className="p-4">
        {/* Header de la notificación */}
        <View className="flex-row justify-between items-start mb-2">
            <Text
                className={`font-bold flex-1 mr-2 ${
                expanded ? "text-blue-700 text-base" : "text-slate-800 text-sm"
                }`}
            >
                {it.title}
            </Text>
            {/* Indicador de estado o nuevo opcional */}
            {!expanded && (
                <View className="bg-blue-50 p-1 rounded-full">
                    <MaterialCommunityIcons name="chevron-down" size={16} color="#3B82F6" />
                </View>
            )}
        </View>

        {/* Imagen Expandida */}
        {it.logoUrl && expanded && (
            <View className="my-3 rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                <Image
                source={{ uri: it.logoUrl }}
                className="w-full h-48"
                resizeMode="cover"
                />
            </View>
        )}

        {/* Cuerpo del texto */}
        <Text
            className={`text-slate-500 leading-5 ${expanded ? "text-sm" : "text-xs"}`}
            numberOfLines={expanded ? undefined : 2}
        >
            {it.body}
        </Text>

        {/* Footer Expandido */}
        {expanded && (
            <View className="mt-4 pt-3 border-t border-slate-100 flex-row justify-end items-center">
                <Text className="text-xs text-slate-400 mr-1">Toca para colapsar</Text>
                <MaterialCommunityIcons name="chevron-up" size={16} color="#94A3B8" />
            </View>
        )}
      </View>
    </Pressable>
  );

  type DateSectionCardProps = {
    section: SectionByDate;
  };

  const DateSectionCard = ({ section }: DateSectionCardProps) => (
    <View className="mb-6">
      {/* Etiqueta de Fecha Stickie-like */}
      <View className="flex-row items-center mb-3 ml-1">
        <View className="bg-blue-100/50 p-1.5 rounded-lg mr-2">
            <MaterialCommunityIcons
            name="calendar-month-outline"
            size={16}
            color="#2563EB"
            />
        </View>
        <Text className="text-sm font-bold text-slate-500 uppercase tracking-wide">
          {section.dateLabel}
        </Text>
      </View>

      {/* Grupos de Negocios */}
      <View className="pl-2 border-l-2 border-slate-100 ml-3">
        {section.groups.map((g, idx) => {
            const firstNotification = g.items[0];
            return (
            <View key={`${section.dateKey}-${g.negocioNombre}-${idx}`} className="mb-4 pl-3">
                
                <BusinessHeader
                    name={g.negocioNombre}
                    url={g.urlLogo}
                    onPress={() => {
                        if (!firstNotification) return;
                        setExpandedId((prev) =>
                        prev === firstNotification.id ? null : firstNotification.id
                        );
                    }}
                />

                {g.items.map((n) => (
                <NotificationItem
                    key={n.id}
                    it={n}
                    expanded={expandedId === n.id}
                    onToggle={() =>
                    setExpandedId((prev) => (prev === n.id ? null : n.id))
                    }
                />
                ))}
            </View>
            );
        })}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-blue-600">
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      {/* Decoración de Fondo */}
      <View
        pointerEvents="none"
        className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-400/25"
      />
      <View
        pointerEvents="none"
        className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-blue-800/25"
      />

      <Safe className="flex-1" edges={["top", "left", "right"]}>
        
        {/* HEADER "PREMIUM" */}
        <View className="h-28 justify-center items-center mt-4 px-4 z-10 mb-6">
            <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center mb-3">
                <MaterialCommunityIcons name="bell-ring-outline" size={24} color="white" />
            </View>
            <Text className="text-white text-2xl font-extrabold tracking-wide text-center">
                Promociones
            </Text>
            <Text className="text-blue-100 text-sm mt-1 text-center font-medium">
                Ofertas y anuncios de tus negocios favoritos
            </Text>
        </View>

        {/* CONTENEDOR PRINCIPAL */}
        <View className="flex-1 bg-slate-50 rounded-t-[32px] pt-6 px-4 shadow-2xl overflow-hidden border-t border-white/20">
            
            {/* Buscador */}
            <View className="flex-row items-center bg-white rounded-2xl border border-slate-200 px-4 py-3 mb-4 shadow-sm">
                <MaterialCommunityIcons name="magnify" size={22} color="#94A3B8" />
                <TextInput
                    value={localQuery}
                    onChangeText={setLocalQuery}
                    placeholder="Buscar en notificaciones..."
                    placeholderTextColor="#94A3B8"
                    className="flex-1 ml-3 text-base text-slate-800 font-medium"
                    style={{
                        paddingVertical: 0,
                        ...(Platform.OS === "android" ? { textAlignVertical: "center" as const } : null),
                    }}
                    returnKeyType="search"
                />
                {!!localQuery && (
                    <Pressable onPress={() => setLocalQuery("")} className="bg-slate-100 rounded-full p-1">
                        <MaterialCommunityIcons name="close" size={16} color="#64748B" />
                    </Pressable>
                )}
            </View>

            {/* Lista de Contenido */}
            <View className="flex-1">
                {initialLoading ? (
                    <View className="flex-1 items-center justify-center pb-20">
                        <ActivityIndicator size="large" color="#2563EB" />
                        <Text className="text-slate-400 mt-4 font-medium">Cargando promociones...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={sections}
                        keyExtractor={(s) => s.dateKey}
                        renderItem={({ item }) => <DateSectionCard section={item} />}
                        contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }} // Espacio para scroll y footer
                        showsVerticalScrollIndicator={false}
                        onEndReached={hasNext ? onEndReached : undefined}
                        onEndReachedThreshold={0.35}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor="#2563EB"
                                colors={["#2563EB"]}
                            />
                        }
                        ListEmptyComponent={
                            <View className="items-center justify-center py-20 opacity-60">
                                <View className="bg-slate-200 p-6 rounded-full mb-4">
                                    <MaterialCommunityIcons name="bell-off-outline" size={48} color="#94A3B8" />
                                </View>
                                <Text className="text-slate-400 font-bold text-lg">Sin notificaciones</Text>
                                <Text className="text-slate-400 text-center text-sm px-10 mt-1">
                                    Aquí aparecerán las ofertas de los negocios que sigues.
                                </Text>
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