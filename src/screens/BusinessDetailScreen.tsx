// src/screens/BusinessDetailScreen.tsx
import React, { useState } from "react";
import {
  View as RNView,
  Text as RNText,
  Image as RNImage,
  Pressable as RNPressable,
  StatusBar,
  Platform,
  Linking,
  ScrollView as RNScrollView,
} from "react-native";
import { styled } from "nativewind";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RootStackParamList } from "../navigation/StackNavigator";

const View = styled(RNView);
const Text = styled(RNText);
const Image = styled(RNImage);
const Pressable = styled(RNPressable);
const Safe = styled(SafeAreaView);
const ScrollView = styled(RNScrollView);

type Nav = NativeStackNavigationProp<RootStackParamList, "BusinessDetail">;
type Route = RouteProp<RootStackParamList, "BusinessDetail">;

export default function BusinessDetailScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<Route>();
  const b = params.business; 

  // Estado para las Tabs: 0 = Progreso, 1 = Información
  const [activeTab, setActiveTab] = useState(0);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.reset({
      index: 0,
      routes: [{ name: "Tabs" as never }],
    });
  };

  const openUrl = (url?: string | null) => {
    if (!url) return;
    let u = url.trim();
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    Linking.openURL(u).catch(() => {});
  };

  const openMaps = (direccion?: string | null) => {
    if (!direccion) return;
    const q = encodeURIComponent(direccion);
    const url = Platform.OS === "ios" ? `http://maps.apple.com/?q=${q}` : `geo:0,0?q=${q}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`).catch(() => {});
    });
  };

  // Helper para formatear moneda
  const currency = (n: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

  return (
    <View className="flex-1 bg-blue-600">
      <StatusBar barStyle="light-content" />

      {/* Burbujas de fondo */}
      <View pointerEvents="none" className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-400/25" />
      <View pointerEvents="none" className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-blue-800/25" />

      <Safe
        className="flex-1 px-4 pb-2"
        style={{ paddingTop: insets.top + (Platform.OS === "android" ? 2 : 0) }}
      >
        <View className="flex-1 bg-white rounded-3xl p-6 border border-blue-100 shadow-2xl mt-14">
          
          {/* Header con botón volver */}
          <View className="relative mb-3 h-10 justify-center" collapsable={false}>
            <Pressable
              onPress={handleBack}
              className="absolute left-0 top-0 h-10 w-10 items-center justify-center rounded-full bg-blue-50 active:bg-blue-100 z-50"
              hitSlop={12}
            >
              <MaterialCommunityIcons name="chevron-left" size={26} color="#1D4ED8" />
            </Pressable>
            <Text
              pointerEvents="none"
              className="absolute inset-x-0 text-center text-2xl font-extrabold text-blue-700"
              numberOfLines={1}
            >
              {b.name}
            </Text>
          </View>

          {/* Logo Central */}
          <View className="items-center mb-4">
            <View className="h-20 w-20 rounded-full bg-blue-50 border border-blue-100 overflow-hidden">
              {/* --- CORRECCIÓN AQUÍ: Usar b.configuracion?.urlLogo --- */}
              {b.configuracion?.urlLogo ? (
                <Image source={{ uri: b.configuracion.urlLogo }} className="h-full w-full" resizeMode="cover" />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <MaterialCommunityIcons name="storefront-outline" size={30} color="#2563EB" />
                </View>
              )}
            </View>
          </View>

          {/* --- TABS --- */}
          <View className="flex-row mb-4 bg-gray-100 p-1 rounded-xl">
            <Pressable
              onPress={() => setActiveTab(0)}
              className={`flex-1 py-2 rounded-lg items-center ${activeTab === 0 ? "bg-white shadow-sm" : ""}`}
            >
              <Text className={`font-semibold ${activeTab === 0 ? "text-blue-600" : "text-gray-500"}`}>
                Mi Progreso
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab(1)}
              className={`flex-1 py-2 rounded-lg items-center ${activeTab === 1 ? "bg-white shadow-sm" : ""}`}
            >
              <Text className={`font-semibold ${activeTab === 1 ? "text-blue-600" : "text-gray-500"}`}>
                Información
              </Text>
            </Pressable>
          </View>

          <View className="h-[1px] bg-gray-100 mb-4" />

          {/* --- CONTENIDO --- */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 0 ? (
              // TAB 1: MI PROGRESO
              <View>
                {/* Tarjeta Cashback */}
                <View className="bg-blue-600 rounded-2xl p-4 mb-5 shadow-lg shadow-blue-200">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-blue-100 font-medium">Cashback acumulado</Text>
                    <MaterialCommunityIcons name="wallet-giftcard" size={24} color="#BFDBFE" />
                  </View>
                  <Text className="text-3xl font-extrabold text-white">
                    {currency(b.puntosAcumulados ?? 0)}
                  </Text>
                  <Text className="text-blue-200 text-xs mt-1">
                    Disponible para usar en tu próxima compra
                  </Text>
                </View>

                {/* Lista de Promociones Custom */}
                {b.promocionesCustom && b.promocionesCustom.length > 0 ? (
                  <>
                    <Text className="text-gray-700 font-bold mb-3 text-lg">Promociones Activas</Text>
                    {b.promocionesCustom.map((promo: any) => (
                      <View key={promo.idProductoCustom} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
                        <View className="flex-row justify-between items-center mb-2">
                          <Text className="font-bold text-gray-800 text-base">{promo.nombreProducto}</Text>
                          <View className={`px-2 py-1 rounded-md ${promo.porcentaje >= 100 ? "bg-green-100" : "bg-blue-50"}`}>
                            <Text className={`text-xs font-bold ${promo.porcentaje >= 100 ? "text-green-700" : "text-blue-700"}`}>
                              {promo.estado}
                            </Text>
                          </View>
                        </View>
                        
                        <View className="flex-row items-center justify-between mb-2">
                          <Text className="text-gray-500 text-xs">
                            {/* Esto mostrará "5 / 5" aunque tengas 60 */}
                            Avance: {Math.min(promo.acumulado, promo.meta)} / {promo.meta}
                          </Text>
                          <Text className="text-gray-700 font-bold text-xs">{promo.porcentaje}%</Text>
                        </View>

                        {/* Barra de Progreso */}
                        <View className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                          <View 
                            className={`h-full rounded-full ${promo.porcentaje >= 100 ? "bg-green-500" : "bg-blue-500"}`} 
                            style={{ width: `${Math.min(100, promo.porcentaje)}%` }} 
                          />
                        </View>
                      </View>
                    ))}
                  </>
                ) : (
                  <View className="items-center py-6">
                    <Text className="text-gray-400">Este negocio no tiene promociones activas actualmente.</Text>
                  </View>
                )}
              </View>
            ) : (
              // TAB 2: INFORMACIÓN DEL NEGOCIO
              <View>
                {/* Categoría */}
                {!!b.category && (
                  <View className="self-start mb-4 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    <Text className="text-xs text-blue-700 font-medium">{b.category}</Text>
                  </View>
                )}

                {/* Ítems de Info */}
                {!!b.direccion && (
                  <InfoRow
                    icon="map-marker-outline"
                    label="Dirección"
                    value={b.direccion}
                    pressable
                    onPress={() => openMaps(b.direccion)}
                    rightIcon="map"
                  />
                )}
                {!!b.sitioWeb && (
                  <InfoRow
                    icon="web"
                    label="Sitio web"
                    value={b.sitioWeb}
                    pressable
                    onPress={() => openUrl(b.sitioWeb)}
                    rightIcon="open-in-new"
                  />
                )}
                {!!b.facebook && (
                  <InfoRow
                    icon="facebook"
                    label="Facebook"
                    value={b.facebook}
                    pressable
                    onPress={() => openUrl(b.facebook)}
                    rightIcon="open-in-new"
                  />
                )}
                {!!b.instagram && (
                  <InfoRow
                    icon="instagram"
                    label="Instagram"
                    value={b.instagram}
                    pressable
                    onPress={() => openUrl(b.instagram)}
                    rightIcon="open-in-new"
                  />
                )}
                {!!b.descripcion && (
                  <InfoRow
                    icon="text-box-outline"
                    label="Descripción"
                    value={b.descripcion}
                  />
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </Safe>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  pressable,
  onPress,
  rightIcon,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value?: string | null;
  pressable?: boolean;
  onPress?: () => void;
  rightIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  const Container = pressable ? Pressable : View;
  return (
    <Container
      onPress={onPress}
      className={`mb-3 rounded-2xl border border-gray-200 bg-[#F9FAFB] px-4 py-3 ${pressable ? "active:opacity-90" : ""}`}
    >
      <View className="flex-row items-center">
        <MaterialCommunityIcons name={icon} size={18} color="#6B7280" />
        <Text className="ml-2 text-gray-700 font-semibold">{label}</Text>
        {rightIcon ? (
          <View className="ml-auto">
            <MaterialCommunityIcons name={rightIcon} size={18} color="#1F2937" />
          </View>
        ) : null}
      </View>
      {!!value && <Text className="text-gray-800 mt-1">{value}</Text>}
    </Container>
  );
}