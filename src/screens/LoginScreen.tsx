// src/screens/LoginScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View as RNView,
  Text as RNText,
  TextInput as RNTextInput,
  Pressable as RNPressable,
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

// ⬇️ IMPORTS para checar el rol por teléfono
import { UserService } from "../application/services/UserServices";
import { UserRepository } from "../infrastructure/repositories/UserRepository";

const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const Pressable = styled(RNPressable);
const KeyboardAvoidingView = styled(RNKeyboardAvoidingView);

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  // Estado para rol (solo consultamos cuando hay 10 dígitos)
  const [checkingRole, setCheckingRole] = useState(false);
  const [roleMsg, setRoleMsg] = useState<string | null>(null); // "USER" | "ADMIN" | "SUPERADMIN" | "NO_USER" | "INCOMPLETO" ...

  // Contraseña (solo visible si ADMIN/SUPERADMIN)
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const authService = new AuthService(new AuthRepository());
  const userService = new UserService(new UserRepository());

  // Evita llamadas repetidas para el mismo número completo
  const lastCheckedRef = useRef<string | null>(null);

  // Solo llama al endpoint cuando hay exactamente 10 dígitos
  useEffect(() => {
    const digits = phoneNumber; // ya guardamos solo números
    if (digits.length !== 10) {
      // Reset cuando no hay 10 dígitos
      setRoleMsg(null);
      setPassword("");
      setShowPass(false);
      lastCheckedRef.current = null;
      setCheckingRole(false);
      return;
    }

    // Si ya consultamos ese mismo número, no vuelvas a llamar
    if (lastCheckedRef.current === digits) return;

    // Marca este número como "en proceso"
    lastCheckedRef.current = digits;
    setCheckingRole(true);

    (async () => {
      try {
        const resp = await userService.getRoleByPhoneForLogin(digits);
        const msg = (resp.message || "").toUpperCase();
        setRoleMsg(msg);
        if (msg !== "ADMIN" && msg !== "SUPERADMIN") {
          setPassword("");
          setShowPass(false);
        }
      } catch (e) {
        setRoleMsg(null);
        setPassword("");
        setShowPass(false);
      } finally {
        setCheckingRole(false);
      }
    })();
  }, [phoneNumber, userService]);

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
    if (digits.length !== 10) {
      Toast.show({
        type: "error",
        text1: "Número incompleto",
        text2: "Debes ingresar 10 dígitos.",
        position: "top",
        visibilityTime: 2000,
      });
      return;
    }

    const isPrivileged = roleMsg === "ADMIN" || roleMsg === "SUPERADMIN";

    // Si es admin/superadmin, la contraseña es requerida
    if (isPrivileged && !password.trim()) {
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
      const result = await authService.login(digits, isPrivileged ? password : undefined);
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

  const showPasswordField = roleMsg === "ADMIN" || roleMsg === "SUPERADMIN";

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
        {/* Tarjeta */}
        <View className="w-full rounded-3xl bg-white shadow-2xl p-7">
          {/* Encabezado */}
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
                returnKeyType={showPasswordField ? "next" : "done"}
              />

              {/* Loader pequeño mientras se valida rol (sólo cuando hay 10 dígitos) */}
              {checkingRole && phoneNumber.length === 10 && (
                <ActivityIndicator size="small" color="#1D4ED8" />
              )}
            </View>
            <Text className="text-gray-400 text-xs mt-2">Solo números (10 dígitos).</Text>
          </View>

          {/* Campo contraseña (visible SOLO si ADMIN/SUPERADMIN) */}
          {showPasswordField && (
            <View className="mt-2 mb-1">
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
              <Text className="text-gray-400 text-xs mt-2">(solo Admin/Superadmin)</Text>
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
                <Text className="text-white font-semibold text-base ml-3">Iniciando…</Text>
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
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
