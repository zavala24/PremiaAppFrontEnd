import React from "react";
import { styled } from "nativewind";
import { View as RNView, Text as RNText } from "react-native";
import { useAuth } from "../presentation/context/AuthContext";
import HeaderMenu from "../components/HeaderMenu";

const View = styled(RNView);
const Text = styled(RNText);

export default function HomeScreen() {
  const { user, token } = useAuth();

  return (
    <View className="flex-1 bg-blue-50">
      {/* Header arriba */}
      <HeaderMenu title="Home" />

      {/* Contenido centrado */}
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-2xl font-bold text-blue-700">Home</Text>

        {user ? (
          <>
            <Text className="mt-4 text-blue-900">Nombre: {user.nombre}</Text>
            <Text className="text-blue-900">Rol: {user.role}</Text>
            <Text className="text-blue-900 mt-2">
              Token: {token?.substring(0, 20)}...
            </Text>
          </>
        ) : (
          <Text className="mt-4 text-red-500">No hay usuario logueado</Text>
        )}
      </View>
    </View>
  );
}
