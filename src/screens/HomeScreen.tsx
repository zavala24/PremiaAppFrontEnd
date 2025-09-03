// src/screens/HomeScreen.tsx
import React from "react";
import { styled } from "nativewind";
import { View as RNView, Text as RNText, Pressable as RNPressable } from "react-native";

// Styled components
const View = styled(RNView);
const Text = styled(RNText);
const Pressable = styled(RNPressable);

export default function HomeScreen({ navigation }: any) {
  return (
    <View className="flex-1 justify-center items-center bg-white px-6">
      <Text className="text-3xl font-bold mb-6 text-blue-700">Bienvenido a Home</Text>
      <Text className="text-lg text-gray-700 mb-6 text-center">
        Esta es la pantalla principal de la aplicación.
      </Text>

      <Pressable
        className="bg-blue-700 py-3 px-6 rounded-lg"
        onPress={() => navigation.goBack()}
      >
        <Text className="text-white font-semibold text-lg">Volver</Text>
      </Pressable>
    </View>
  );
}
