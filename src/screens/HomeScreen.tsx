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
  useWindowDimensions,
  TouchableOpacity as RNTouchableOpacity, 
  Modal,
} from "react-native";
import { styled } from "nativewind";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase modular RNFirebase
import { getApp } from "@react-native-firebase/app";
import { getMessaging, getToken, onTokenRefresh } from "@react-native-firebase/messaging";

// Imports de tu proyecto
import type { RootStackParamList } from "../navigation/StackNavigator";
import { useAuth } from "../presentation/context/AuthContext";
import { useBusinessesPaged, ApiBusiness } from "../presentation/hooks/useBusinessPaged";
import { BusinessService } from "../application/services/BusinessService";
import { BusinessRepository } from "../infrastructure/repositories/BusinessRepository";
import { IBusinessService } from "../application/interfaces/IBusinessService";
import { TokenRepository } from "../infrastructure/repositories/TokenRepository";
import { InsertTokenPayload } from "../domain/repositories/ITokenRepository";

// Styled Components
const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const Pressable = styled(RNPressable);
const Image = styled(RNImage);
const Safe = styled(SafeAreaView);
const TouchableOpacity = styled(RNTouchableOpacity);

// --- TIPOS ---
interface ProductoProgreso {
  idProductoCustom: number;
  nombreProducto: string;
  acumulado: number;
  meta: number;
  porcentaje: number;
  estado: string;
}

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
  promocionesCustom?: ProductoProgreso[];
};

type TabKey = "all" | "mine";
type Nav = NativeStackNavigationProp<RootStackParamList>;

// --- UTILIDADES ---
const currency = (n?: number | null) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(typeof n === "number" ? n : 0);

const tokenKey = (tel: string) => `fcmToken:${tel}`;
const onlyDigits = (s: string) => (s || "").replace(/\D+/g, "");

// --- HOOKS ---
function useDeviceTokenSync(telefono?: string) {
  const repo = useMemo(() => new TokenRepository(), []);

  useEffect(() => {
    const numeroTelefono = onlyDigits(telefono ?? "");
    if (!numeroTelefono) return;

    let unsub: undefined | (() => void);

    (async () => {
      try {
        const app = getApp();
        const msg = getMessaging(app);

        const token = await getToken(msg);
        const prev = await AsyncStorage.getItem(tokenKey(numeroTelefono));

        if (token && token !== prev) {
          const payload: InsertTokenPayload = { numeroTelefono, token };
          const r = await repo.insertOrUpdateToken(payload);
          if (r.status >= 200 && r.status < 300) {
            await AsyncStorage.setItem(tokenKey(numeroTelefono), token);
          }
        }

        unsub = onTokenRefresh(msg, async (newToken) => {
          try {
            const payload: InsertTokenPayload = { numeroTelefono, token: newToken };
            const r = await repo.insertOrUpdateToken(payload);
            if (r.status >= 200 && r.status < 300) {
              await AsyncStorage.setItem(tokenKey(numeroTelefono), newToken);
            }
          } catch {}
        });
      } catch {}
    })();

    return () => {
      if (unsub) unsub();
    };
  }, [telefono, repo]);
}

// =================== PANTALLA PRINCIPAL ===================
export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { width } = useWindowDimensions();
  
  // Lógica de columnas (para Tablets usa grid, para móvil lista)
  const isTablet = width >= 768;
  const columns = isTablet ? 2 : 1; 

  const { user } = useAuth();
  const telefono = user?.telefono?.trim() ?? "";
  const canFollow = !!telefono;

  useDeviceTokenSync(telefono);

  // Estado para el visor de imágenes (Lightbox)
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
        promocionesCustom: [],
      })),
    [items]
  );

  // ======= Mis negocios (seguidos) =======
  // CAMBIO 1: "mine" es el valor por defecto ahora
  const [tab, setTab] = useState<TabKey>("mine");
  const [myLoading, setMyLoading] = useState(false);
  const [myRefreshing, setMyRefreshing] = useState(false);
  const [myItems, setMyItems] = useState<UiBusiness[]>([]);
  const [followSet, setFollowSet] = useState<Set<number>>(new Set());
  const [pointsByBiz, setPointsByBiz] = useState<Record<number, number>>({});
  
  const [activeNav, setActiveNav] = useState('home');

  const fetchMyBusinesses = async () => {
    if (!canFollow) return;
    setMyLoading(true);
    try {
      const { status, data, message } = await businessService.getNegociosSeguidosByTelefono(telefono);
      if (status < 200 || status >= 300) throw new Error(message || "No se pudieron obtener tus negocios.");
      
      const ui = (data ?? []).map((b) => ({
        id: b.idNegocio,
        name: b.name,
        category: b.category,
        logoUrl: b.configuracion?.urlLogo ?? null,
        facebook: b.facebook,
        instagram: b.instagram,
        sitioWeb: b.sitioWeb,
        direccion: b.direccion,
        descripcion: b.descripcion,
        puntosAcumulados: b.puntosAcumulados,
        promocionesCustom: b.promocionesCustom,
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
    try {
      await fetchMyBusinesses();
    } finally {
      setMyRefreshing(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([onRefresh(), fetchMyBusinesses()]);
  };

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
    setPending((p) => ({ ...p, [businessId]: true }));
    setFollowSet((s) => {
      const next = new Set(s);
      willFollow ? next.add(businessId) : next.delete(businessId);
      return next;
    });
    
    // Optimistic Update
    if (willFollow) setPointsByBiz((m) => ({ ...m, [businessId]: m[businessId] ?? 0 }));
    else
      setPointsByBiz((m) => {
        const { [businessId]: _, ...rest } = m;
        return rest;
      });

    try {
      const resp = await businessService.actualizarSeguirNegocioByTelefono(businessId, telefono, willFollow);
      if (resp.status < 200 || resp.status >= 300) throw new Error(resp.message || "No se pudo actualizar.");
      
      if (willFollow) {
        const found = uiAll.find((x) => x.id === businessId);
        if (found && !myItems.some((x) => x.id === businessId)) setMyItems((arr) => [{ ...found, puntosAcumulados: 0 }, ...arr]);
      } else {
        setMyItems((arr) => arr.filter((x) => x.id !== businessId));
      }
    } catch (e: any) {
      // Revertir
      setFollowSet((s) => {
        const next = new Set(s);
        willFollow ? next.delete(businessId) : next.add(businessId);
        return next;
      });
      Alert.alert("Ups", e?.message || "No se pudo actualizar el seguimiento.");
    } finally {
      setPending((p) => ({ ...p, [businessId]: false }));
    }
  };

  const listRef = useRef<FlatList<UiBusiness>>(null);
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [tab, localQuery]);

  const gotoDetail = (b: UiBusiness) => {
    const richData = myItems.find((item) => item.id === b.id) ?? b;
    navigation.navigate("BusinessDetail", {
      business: {
        idNegocio: richData.id,
        name: richData.name,
        category: richData.category ?? null,
        configuracion: { id: 0, porcentajeVentas: 0, activo: true, urlLogo: richData.logoUrl ?? null, permitirConfiguracionPersonalizada: false },
        facebook: richData.facebook ?? null,
        instagram: richData.instagram ?? null,
        sitioWeb: richData.sitioWeb ?? null,
        direccion: richData.direccion ?? null,
        descripcion: richData.descripcion ?? null,
        puntosAcumulados: richData.puntosAcumulados,
        promocionesCustom: richData.promocionesCustom,
      },
    });
  };

  // --- COMPONENTES VISUALES MEJORADOS ---

  const BusinessCard = ({ item }: { item: UiBusiness }) => {
    const isFollowing = followSet.has(item.id);
    const isBusy = !!pending[item.id];
    const puntos = isFollowing ? pointsByBiz[item.id] ?? item.puntosAcumulados ?? 0 : undefined;

    return (
      <View 
        className={`bg-white rounded-[24px] mb-4 p-4 flex-row gap-4 ${isTablet ? "flex-1 m-2" : ""}`}
        // Sombra más difusa y elegante
        style={{ 
            shadowColor: '#64748B', 
            shadowOffset: { width: 0, height: 8 }, 
            shadowOpacity: 0.1, 
            shadowRadius: 16,
            elevation: 4,
            borderLeftWidth: 4,
            borderLeftColor: '#3B82F6' // SIEMPRE AZUL, no cambia a verde
        }}
      >
        {/* Imagen Izquierda (Clickeable para Zoom) */}
        <Pressable 
            onPress={() => item.logoUrl && setSelectedImage(item.logoUrl)}
            className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 relative shrink-0 border border-slate-100"
            style={{ elevation: 2 }}
        >
          {item.logoUrl ? (
            <Image source={{ uri: item.logoUrl }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="flex-1 items-center justify-center bg-slate-50">
              <MaterialCommunityIcons name="storefront-outline" size={32} color="#94A3B8" />
            </View>
          )}
          {/* Icono de lupa pequeño para indicar que se puede ver */}
          <View className="absolute bottom-1 right-1 bg-black/30 rounded-full p-1">
             <MaterialCommunityIcons name="magnify-plus-outline" size={12} color="white" />
          </View>
        </Pressable>

        {/* Contenido Derecha */}
        <Pressable 
            className="flex-1 justify-between py-1"
            onPress={() => gotoDetail(item)} // Click en el cuerpo lleva al detalle
        >
          <View>
             <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-2">
                    {!!item.category && (
                    <View className="self-start px-2.5 py-1 rounded-lg bg-slate-100 mb-1.5">
                        <Text className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                        {item.category}
                        </Text>
                    </View>
                    )}
                    <Text className="font-bold text-slate-800 text-[17px] leading-tight" numberOfLines={1}>
                        {item.name}
                    </Text>
                </View>

                {/* Botón Corazón */}
                <TouchableOpacity 
                    onPress={(e) => {
                        e.stopPropagation(); // Evitar que dispare la navegación
                        toggleFollow(item.id);
                    }}
                    disabled={isBusy || !canFollow}
                    hitSlop={12}
                    className="bg-slate-50 p-1.5 rounded-full"
                >
                    <MaterialCommunityIcons 
                        name={isFollowing ? "heart" : "heart-outline"} 
                        size={20} 
                        color={isFollowing ? "#EF4444" : "#94A3B8"} 
                    />
                </TouchableOpacity>
             </View>
             
             <Text className="text-slate-400 text-xs mt-1.5 leading-5 font-medium" numberOfLines={2}>
               {item.descripcion || (isFollowing ? "¡Tienes puntos acumulados aquí! Toca para ver detalles." : "Visita este negocio y descubre sus promociones.")}
             </Text>
          </View>

          {/* Footer de la tarjeta */}
          <View className="flex-row items-center justify-between mt-3">
             {isFollowing ? (
                 // CAMBIO AQUÍ: Ahora usa estilos azules en lugar de verdes
                 <View className="flex-row items-center bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                    <MaterialCommunityIcons name="wallet" size={14} color="#2563EB" />
                    <Text className="ml-1.5 text-xs font-bold text-blue-700">
                      {currency(puntos)}
                    </Text>
                 </View>
             ) : (
                <View className="flex-row items-center">
                    <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                    <Text className="text-xs text-slate-500 ml-1 font-semibold">4.8</Text>
                </View>
             )}

            <TouchableOpacity 
                onPress={() => gotoDetail(item)}
                className="bg-blue-600 rounded-xl px-4 py-1.5 shadow-sm shadow-blue-200"
            >
                <Text className="text-white text-xs font-bold">Ver</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </View>
    );
  };

  const isMine = tab === "mine";
  const data = isMine ? myItems : uiAll;

  // --- RENDER PRINCIPAL ---
  return (
    <View className="flex-1 bg-slate-100"> 
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
      
      {/* Lightbox Modal (Visor de Imágenes) */}
      <Modal 
        visible={!!selectedImage} 
        transparent={true} 
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View className="flex-1 bg-black/95 justify-center items-center relative">
            <TouchableOpacity 
                onPress={() => setSelectedImage(null)}
                className="absolute top-12 right-6 z-50 bg-white/20 p-2 rounded-full"
            >
                <MaterialCommunityIcons name="close" size={28} color="white" />
            </TouchableOpacity>
            
            {selectedImage && (
                <Image 
                    source={{ uri: selectedImage }} 
                    className="w-full h-full" 
                    resizeMode="contain" 
                />
            )}
            
            <Text className="absolute bottom-10 text-white/70 text-sm">Toca para cerrar</Text>
            
            {/* Overlay invisible para cerrar al tocar fuera (opcional) */}
            <Pressable className="absolute inset-0 -z-10" onPress={() => setSelectedImage(null)} />
        </View>
      </Modal>

      {/* Header Fijo Superior */}
      <View className="bg-blue-600 pb-8 pt-2 rounded-b-[40px] shadow-xl shadow-blue-900/20 z-10 relative overflow-hidden">
         {/* Decoración de fondo */}
         <View className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
         <View className="absolute top-10 -left-10 w-40 h-40 bg-indigo-500/30 rounded-full blur-2xl" />

         <Safe edges={["top"]} className="px-6">
            <View className="items-center mb-8 mt-4">
                <Text className="text-3xl font-extrabold text-white tracking-tight">Negocios</Text>
                <Text className="text-blue-100 font-medium text-sm mt-1">Descubre promociones cerca de ti</Text>
            </View>
         </Safe>
      </View>

      {/* Contenedor Principal */}
      <View className="flex-1 -mt-6">
        <View className="px-6 z-20 mb-2">
            {/* Input Flotante */}
            <View 
                className="bg-white rounded-2xl flex-row items-center px-4 h-14 shadow-lg shadow-slate-200"
                style={{ elevation: 8 }}
            >
                <MaterialCommunityIcons name="magnify" size={22} color="#94A3B8" />
                <TextInput 
                    className="flex-1 ml-3 text-slate-700 text-[15px] h-full"
                    placeholder="Buscar negocios..."
                    placeholderTextColor="#94A3B8"
                    value={localQuery}
                    onChangeText={setLocalQuery}
                />
                {!!localQuery && (
                    <TouchableOpacity onPress={() => setLocalQuery("")}>
                        <MaterialCommunityIcons name="close-circle" size={20} color="#CBD5E1" />
                    </TouchableOpacity>
                )}
            </View>
        </View>

        {/* Lista de Contenido */}
        <FlatList
            ref={listRef}
            data={data}
            keyExtractor={(it) => String(it.id)}
            numColumns={columns}
            key={columns} 
            contentContainerStyle={{ 
                paddingHorizontal: 20, 
                paddingTop: 16, 
                paddingBottom: 30 
            }}
            showsVerticalScrollIndicator={false}
            
            // Header interno de la lista (Tabs)
            ListHeaderComponent={
                <View className="mb-6 mt-2 px-2">
                    {/* Tabs Segmentados */}
                    <View className="flex-row bg-slate-200/80 p-1.5 rounded-full w-full max-w-xs self-center border border-white/50">
                        {/* CAMBIO 2: Invertí el orden, primero Mis Negocios */}
                        <Pressable 
                            onPress={() => !canFollow ? Alert.alert("Inicia sesión", "Necesitas registrar tu teléfono.") : setTab("mine")}
                            className={`flex-1 py-2.5 items-center rounded-full transition-all ${tab === "mine" ? "bg-white shadow-sm" : ""}`}
                        >
                            <Text className={`text-sm font-bold ${tab === "mine" ? "text-indigo-600" : "text-slate-500"}`}>Mis negocios</Text>
                        </Pressable>
                        <Pressable 
                            onPress={() => setTab("all")}
                            className={`flex-1 py-2.5 items-center rounded-full transition-all ${tab === "all" ? "bg-white shadow-sm" : ""}`}
                        >
                            <Text className={`text-sm font-bold ${tab === "all" ? "text-indigo-600" : "text-slate-500"}`}>Negocios</Text>
                        </Pressable>
                    </View>
                </View>
            }

            renderItem={({ item }) => <BusinessCard item={item} />}
            
            // Estados de Carga y Vacío
            ListEmptyComponent={
                <View className="items-center justify-center py-20 opacity-60">
                     <View className="bg-slate-200 p-6 rounded-full mb-4">
                        <MaterialCommunityIcons name="store-search-outline" size={48} color="#94A3B8" />
                     </View>
                     <Text className="text-slate-400 mt-2 text-center font-bold text-lg">
                        {isMine ? "Sin negocios seguidos" : "No encontramos resultados"}
                     </Text>
                     <Text className="text-slate-400 text-center text-sm px-10">
                        {isMine ? "Dale corazón a los negocios que te gusten para verlos aquí." : "Intenta buscar con otro nombre."}
                     </Text>
                </View>
            }
            refreshControl={
                <RefreshControl
                  refreshing={isMine ? myRefreshing : refreshing}
                  onRefresh={isMine ? refreshMine : refreshAll}
                  tintColor="#2563EB"
                  colors={["#2563EB"]}
                />
            }
        />

        {/* Loading Overlay */}
        {(isMine ? myLoading : initialLoading) && !refreshing && !myRefreshing && (
            <View className="absolute inset-0 bg-white/80 items-center justify-center z-30 pt-20">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        )}
      </View>
    </View>
  );
}