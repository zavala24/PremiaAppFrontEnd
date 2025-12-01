import React from "react";
import { ActivityIndicator, 
  View as RNView,
  Text as RNText,
  Image as RNImage 
} 
  from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { styled } from "nativewind";

const View = styled(RNView);
const Text = styled(RNText);
const Image = styled(RNImage);

interface Props {
  loading: boolean;
  error: string | null;
  business: any; // Tipar con tu entidad Business real si es posible
}

export const BusinessHeader = ({ loading, error, business }: Props) => {
  if (loading) {
    return (
      <View className="items-center py-6">
        <ActivityIndicator color="#1D4ED8" />
        <Text className="text-blue-800/70 mt-2">Cargando negocio…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="items-center py-4">
        <MaterialCommunityIcons name="store-alert-outline" size={28} color="#EF4444" />
        <Text className="text-red-600 mt-2 text-center">{error}</Text>
      </View>
    );
  }

  return (
    <View className="items-center mb-4">
      <View className="h-24 w-24 rounded-full bg-blue-50 border border-blue-100 overflow-hidden items-center justify-center mb-3">
        {business?.configuracion?.urlLogo ? (
          <Image
            source={{ uri: business.configuracion.urlLogo }}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <MaterialCommunityIcons name="storefront-outline" size={38} color="#2563EB" />
        )}
      </View>
      <Text className="text-lg font-extrabold text-blue-700">
        {business?.name ?? "Mi negocio"}
      </Text>
    </View>
  );
};