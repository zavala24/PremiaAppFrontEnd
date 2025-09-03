import React from "react";
import { styled } from "nativewind";
import { View as RNView, Text as RNText, TextInput as RNTextInput, Pressable as RNPressable } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/StackNavigator"; // importa tu tipo de stack

// Styled components
const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const Pressable = styled(RNPressable);

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Login">;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  return (
    <View className="flex-1 justify-center items-center bg-blue-600 px-6">
      <View className="w-full bg-white/90 rounded-3xl p-8">
        <Text className="text-4xl font-bold text-blue-700 mb-8 text-center">Bienvenido</Text>

        <TextInput
          placeholder="Número de teléfono"
          keyboardType="phone-pad"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-6 text-base"
        />

        {/* Botón Iniciar sesión */}
        <Pressable
          className="w-full bg-blue-700 rounded-xl py-3 items-center shadow-lg mb-6"
          onPress={() => navigation.navigate("Home")} // <-- Aquí hacemos la navegación
        >
          <Text className="text-white font-semibold text-lg">Iniciar sesión</Text>
        </Pressable>

        <View className="mt-4 items-center">
          <Text className="text-gray-700 mb-2">¿No tienes cuenta?</Text>
          <Pressable className="w-full bg-white border border-blue-700 rounded-xl py-3 items-center shadow">
            <Text className="text-blue-700 font-semibold text-lg">Regístrate</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
