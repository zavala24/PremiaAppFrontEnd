// src/screens/BusinessDetailScreen.tsx
import React from "react";
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

  const handleBack = () => {
    console.log("BACK")
    if (navigation.canGoBack()) {
        navigation.goBack();
        return;
    }
    // Forzar ir a Tabs, y que Tabs abra Home como inicial
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
    const url =
      Platform.OS === "ios" ? `http://maps.apple.com/?q=${q}` : `geo:0,0?q=${q}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`).catch(() => {});
    });
  };

  return (
    <View className="flex-1 bg-blue-600">
      <StatusBar barStyle="light-content" />

      {/* Burbujas de fondo */}
      <View pointerEvents="none" className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-400/25" />
      <View pointerEvents="none" className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-blue-800/25" />

      <Safe
        className="flex-1 px-4 pb-2"
        edges={["top", "left", "right"]}
        style={{ paddingTop: insets.top + (Platform.OS === "android" ? 2 : 0) }}
      >
        {/* Tarjeta principal */}
        <View className="flex-1 bg-white rounded-3xl p-6 border border-blue-100 shadow-2xl">
          {/* Header con botón volver */}
        <View className="relative mb-3 h-10 justify-center" collapsable={false}>
        <Pressable
            onPress={handleBack}
            className="absolute left-0 top-0 h-10 w-10 items-center justify-center rounded-full bg-blue-50 active:bg-blue-100 z-50"
            accessibilityRole="button"
            accessibilityLabel="Volver"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
            <MaterialCommunityIcons name="chevron-left" size={26} color="#1D4ED8" />
        </Pressable>

        {/* 👇 Esto es clave para que no bloquee el touch del botón */}
        <Text
            pointerEvents="none"
            className="absolute inset-x-0 text-center text-2xl font-extrabold text-blue-700"
            numberOfLines={1}
        >
            {b.name}
        </Text>
        </View>

          <Text className="text-gray-500 text-center mb-4">Información del negocio</Text>
          <View className="h-[1px] bg-gray-100 mb-5" />

          {/* Contenido scrolleable dentro de la tarjeta */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo + categoría */}
            <View className="items-center mb-5">
              <View className="h-28 w-28 rounded-full bg-blue-50 border border-blue-100 overflow-hidden">
                {b.logoUrl ? (
                  <Image source={{ uri: b.logoUrl }} className="h-full w-full" resizeMode="cover" />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <MaterialCommunityIcons name="storefront-outline" size={38} color="#2563EB" />
                  </View>
                )}
              </View>
              {!!b.category && (
                <View className="mt-3 bg-blue-100/95 px-3 py-1 rounded-full border border-blue-200">
                  <Text className="text-[12px] text-blue-800">{b.category}</Text>
                </View>
              )}
            </View>

            {/* Ítems */}
            <InfoRow icon="storefront-outline" label="Nombre" value={b.name} />
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

            {/* Descripción como tarjeta igual a las demás */}
            {!!b.descripcion && (
              <InfoRow
                icon="text-box-outline"
                label="Descripción"
                value={b.descripcion}
              />
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
      {!!value && (
        <Text className="text-gray-800 mt-1">
          {value}
        </Text>
      )}
    </Container>
  );
}
