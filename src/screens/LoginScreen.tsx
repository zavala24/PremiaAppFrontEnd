// src/screens/LoginScreen.tsx
import React, { useState } from "react";
import {
  View as RNView,
  Text as RNText,
  TextInput as RNTextInput,
  Pressable as RNPressable,
  Alert,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  Platform,
} from "react-native";
import { styled } from "nativewind";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "../presentation/context/AuthContext";
import { AuthService } from "../application/services/AuthServices";
import { AuthRepository } from "../infrastructure/repositories/AuthRepository";
import { RootStackParamList } from "../navigation/StackNavigator";

const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const Pressable = styled(RNPressable);
const KeyboardAvoidingView = styled(RNKeyboardAvoidingView);

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  // 👇 soporte UI para contraseña (solo Admin/Superadmin)
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const authService = new AuthService(new AuthRepository());

  const handleLogin = async () => {
    const digits = phoneNumber.replace(/[^0-9]/g, "");
    if (!digits) {
      Toast.show({
        type: "error",
        text1: "Falta tu número",
        text2: "Ingresa tu número de teléfono",
        position: "top",
        visibilityTime: 2000,
      });
      return;
    }

    if (usePassword && !password.trim()) {
      Toast.show({
        type: "error",
        text1: "Falta tu contraseña",
        text2: "Requerida para Admin/Superadmin",
        position: "top",
        visibilityTime: 2000,
      });
      return;
    }

    try {
      setLoading(true);
            
      const result = await authService.login(digits, usePassword ? password : undefined);
      setLoading(false);

      if (result.success) {
        await login(result.user, result.token);
        navigation.replace("Tabs");
      } else {
        Toast.show({
          type: "error",
          text1: result.message || "Error al iniciar sesión",
          position: "top",
          visibilityTime: 2000,
        });
      }
    } catch (error: any) {
      setLoading(false);
      Toast.show({
        type: "error",
        text1: "Error de conexión",
        text2: error?.message || "No se pudo conectar con el servidor",
        position: "top",
        visibilityTime: 2000,
      });
    }
  };

  return (
    <View className="flex-1 bg-blue-600">
      <StatusBar barStyle="light-content" />
      {/* Fondo decorativo sutil */}
      <View className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-400/25" />
      <View className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-blue-800/25" />

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        className="flex-1 justify-center px-6"
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        {/* Tarjeta más blanca y limpia */}
        <View className="w-full rounded-3xl bg-white shadow-2xl p-7">
          {/* Encabezado limpio */}
          <View className="items-center mb-6">
            <Text className="text-3xl font-extrabold text-blue-700">Bienvenido</Text>
            <Text className="text-gray-500 mt-1 text-center">
              Ingresa tu número para continuar
            </Text>
          </View>

          {/* Teléfono */}
          <View className="mb-4">
            <View className="flex-row items-center rounded-2xl border border-gray-200 bg-[#F9FAFB] px-4 py-3 shadow-sm">
              <Text className="text-gray-500 mr-2">📱</Text>
              <TextInput
                placeholder="Ej. 5512345678"
                keyboardType="phone-pad"
                maxLength={10}
                value={phoneNumber}
                onChangeText={(t) => setPhoneNumber(t.replace(/[^0-9]/g, ""))}
                className="flex-1 text-base text-gray-800"
                placeholderTextColor="#9CA3AF"
                accessible
                accessibilityLabel="Número de teléfono"
                returnKeyType={usePassword ? "next" : "done"}
              />
            </View>
            <Text className="text-gray-400 text-xs mt-2">
              Solo números (10 dígitos).
            </Text>
          </View>

          {/* Toggle: Usar contraseña (solo Admin/Superadmin) */}
          <Pressable
            onPress={() => setUsePassword((v) => !v)}
            className={`flex-row items-center justify-center rounded-2xl border ${
              usePassword ? "border-blue-600 bg-blue-50" : "border-blue-100 bg-white"
            } px-4 py-3 active:opacity-90`}
          >
            <MaterialCommunityIcons
              name={usePassword ? "lock" : "lock-open-variant-outline"}
              size={18}
              color={usePassword ? "#1D4ED8" : "#1F2937"}
            />
            <Text className={`ml-2 font-semibold ${usePassword ? "text-blue-700" : "text-gray-700"}`}>
              Usar contraseña
            </Text>
            <Text className="ml-2 text-[12px] text-gray-500">(solo Admin/Superadmin)</Text>
          </Pressable>

          {/* Campo contraseña (visible solo si toggle activo) */}
          {usePassword && (
            <View className="mt-4 mb-1">
              <View className="flex-row items-center rounded-2xl border border-gray-200 bg-[#F9FAFB] px-4 py-3 shadow-sm">
                <MaterialCommunityIcons name="lock-outline" size={18} color="#6B7280" />
                <TextInput
                  placeholder="Contraseña"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={setPassword}
                  className="flex-1 ml-2 text-base text-gray-800"
                  returnKeyType="done"
                />
                <Pressable onPress={() => setShowPass((s) => !s)} hitSlop={10} className="pl-2">
                  <MaterialCommunityIcons
                    name={showPass ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#6B7280"
                  />
                </Pressable>
              </View>
              <Text className="text-gray-400 text-xs mt-2">
                Los usuarios normales no necesitan contraseña.
              </Text>
            </View>
          )}

          {/* Botón principal */}
          <Pressable
            disabled={loading}
            onPress={handleLogin}
            className={`active:opacity-90 rounded-2xl py-4 items-center mt-5 mb-5 ${
              loading ? "bg-blue-400" : "bg-blue-700"
            } shadow-lg shadow-blue-500/30`}
          >
            {loading ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#fff" />
                <Text className="text-white font-semibold text-base ml-3">
                  Iniciando…
                </Text>
              </View>
            ) : (
              <Text className="text-white font-semibold text-lg">Iniciar sesión</Text>
            )}
          </Pressable>

          {/* Divider */}
          <View className="flex-row items-center my-2">
            <View className="flex-1 h-[1px] bg-gray-200" />
            <Text className="mx-3 text-gray-400 text-sm">o</Text>
            <View className="flex-1 h-[1px] bg-gray-200" />
          </View>

          {/* CTA registro */}
          <Pressable
            className="rounded-2xl border border-blue-700 py-3 items-center bg-white"
            onPress={() => navigation.navigate("Register")}
          >
            <Text className="text-blue-700 font-semibold text-base">Regístrate</Text>
          </Pressable>

          {/* Footer */}
          <View className="mt-6 items-center">
            <Text className="text-gray-400 text-xs text-center">
              Al continuar aceptas nuestros{" "}
              <Text
                className="text-blue-700 underline"
                onPress={() => Alert.alert("Términos", "Abrir términos")}
              >
                Términos
              </Text>{" "}
              y{" "}
              <Text
                className="text-blue-700 underline"
                onPress={() => Alert.alert("Privacidad", "Abrir aviso")}
              >
                Privacidad
              </Text>
              .
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
