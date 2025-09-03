import React from "react";
import { styled } from "nativewind";
import { View as RNView, Text as RNText } from "react-native";

const View = styled(RNView);
const Text = styled(RNText);

export default function ConfiguracionScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-gray-50">
      <Text className="text-2xl font-bold text-gray-700">Configuración</Text>
    </View>
  );
}
