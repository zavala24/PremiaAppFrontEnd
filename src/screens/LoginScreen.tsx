import React from "react";
import { styled } from "nativewind";
import { View as RNView, Text as RNText, TextInput as RNTextInput, Pressable as RNPressable } from "react-native";

// Convertimos los componentes nativos a "styled" para usar className
const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const Pressable = styled(RNPressable);

export default function App() {
  return (
    <View className="flex-1 justify-center items-center bg-white px-6">
      <Text className="text-3xl font-bold mb-8 text-blue-700">Login</Text>

      <TextInput
        className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6"
        placeholder="Número de teléfono"
      />

      <Pressable className="w-full bg-blue-700 rounded-lg py-3 items-center">
        <Text className="text-white text-lg font-semibold">Ingresar</Text>
      </Pressable>

      <Pressable className="mt-4">
        <Text className="text-blue-700 text-sm">¿Olvidaste tu contraseña?</Text>
      </Pressable>
    </View>
  );
}
