import React, { useState } from "react";
import { styled } from "nativewind";
import { View as RNView, Text as RNText, TextInput as RNTextInput, Pressable as RNPressable, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";


import { AuthRepository } from "../infrastructure/repositories/AuthRepository";
import Toast from "react-native-toast-message";
import { useAuth } from "../presentation/context/AuthContext"; // <-- AuthContext
import { AuthService } from "../application/services/AuthServices";

// Styled components
const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const Pressable = styled(RNPressable);

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const { login: setAuth } = useAuth(); // <-- hook de AuthContext

  // Instanciamos el servicio con el repositorio
  const authService = new AuthService(new AuthRepository());

  const handleLogin = async () => {
    if (!phoneNumber) {
      Alert.alert("Error", "Ingresa tu número de teléfono");
      return;
    }

    try {
      setLoading(true);
      const response = await authService.login(phoneNumber);

      setLoading(false);

      if (response.success && response.data) {
        // Guardamos usuario y token en el AuthContext
        setAuth(response.data.user, response.data.token);

        // Navegamos a la pantalla principal
        navigation.navigate("Tabs");
      } else {
        Toast.show({
          type: "error",
          text1: response.message,
          position: "bottom",
          visibilityTime: 2000,
        });
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert("Error", error.message || "Algo salió mal");
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-blue-600 px-6">
      <View className="w-full bg-white/90 rounded-3xl p-8">
        <Text className="text-4xl font-bold text-blue-700 mb-8 text-center">Bienvenido!</Text>

        <TextInput
          placeholder="Número de teléfono"
          keyboardType="phone-pad"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-6 text-base"
          value={phoneNumber}
          onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ""))}
        />

        <Pressable
          className={`w-full rounded-xl py-3 items-center shadow-lg mb-6 ${
            loading ? "bg-blue-400" : "bg-blue-700"
          }`}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text className="text-white font-semibold text-lg">
            {loading ? "Cargando..." : "Iniciar sesión"}
          </Text>
        </Pressable>

        <View className="mt-4 items-center">
          <Text className="text-gray-700 mb-2">¿No tienes cuenta?</Text>
          <Pressable
            className="w-full bg-white border border-blue-700 rounded-xl py-3 items-center shadow"
            onPress={() => Alert.alert("Registro", "Aquí podrías navegar a un registro")}
          >
            <Text className="text-blue-700 font-semibold text-lg">Regístrate</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
