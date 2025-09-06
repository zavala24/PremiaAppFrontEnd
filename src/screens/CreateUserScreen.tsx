// src/screens/CreateUserScreen.tsx
import React, { useState } from "react";
import { View as RNView, Text as RNText, TextInput as RNTextInput, Pressable as RNPressable } from "react-native";
import { styled } from "nativewind";

const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const Pressable = styled(RNPressable);

export default function CreateUserScreen() {
  const [telefono, setTelefono] = useState("");
  const [touched, setTouched] = useState(false); // para mostrar error solo después de tocar el input

  // Valida si tiene exactamente 10 dígitos
  const isValid = /^\d{10}$/.test(telefono);

  const handleChange = (text: string) => {
    // Solo permite números
    const numericText = text.replace(/\D/g, "");
    setTelefono(numericText);
    setTouched(true);
  };

  const handleCrearUsuario = () => {
    if (!isValid) return;
  };

  return (
    <View className="flex-1 bg-white justify-center items-center p-6">
      {/* Input */}
      <TextInput
        className={`w-72 p-4 rounded-2xl text-lg font-bold border-2 mb-2 bg-white shadow-sm ${
          telefono === ""
            ? "border-gray-300"
            : isValid
            ? "border-green-500"
            : "border-red-500"
        }`}
        placeholder="Ingresa tu número"
        placeholderTextColor="#999"
        keyboardType="phone-pad"
        value={telefono}
        onChangeText={handleChange}
      />

      {/* Mensaje de error solo si el input no está vacío */}
      {telefono !== "" && !isValid && (
        <Text className="text-red-500 font-semibold mb-6">
          Formato incorrecto: debe tener 10 dígitos
        </Text>
      )}

      {/* Botón Crear Usuario siempre visible */}
      <Pressable
        className="w-72 p-4 rounded-2xl bg-blue-700 shadow-lg active:scale-95 mt-6"
        onPress={handleCrearUsuario}
      >
        <Text className="text-center text-white font-bold text-lg tracking-wide">
          Crear Usuario
        </Text>
      </Pressable>
    </View>
  );
}
