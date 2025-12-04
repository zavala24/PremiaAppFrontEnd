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
  Image as RNImage,
  Dimensions,
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

import Logo from "../../assets/Logo.png";

const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const Pressable = styled(RNPressable);
const KeyboardAvoidingView = styled(RNKeyboardAvoidingView);
const Image = styled(RNImage);

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login } = useAuth();
  const { width } = Dimensions.get("window");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  // Estado para rol (solo consultamos cuando hay 10 dígitos)
  const [checkingRole, setCheckingRole] = useState(false);
  const [roleMsg, setRoleMsg] = useState<string | null>(null);

  // Contraseña (solo visible si ADMIN/SUPERADMIN)
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const authService = new AuthService(new AuthRepository());
  const userService = new UserService(new UserRepository());

  // Evita llamadas repetidas para el mismo número completo
  const lastCheckedRef = useRef<string | null>(null);

  // Solo llama al endpoint cuando hay exactamente 10 dígitos
  useEffect(() => {
    const digits = phoneNumber;
    if (digits.length !== 10) {
      setRoleMsg(null);
      setPassword("");
      setShowPass(false);
      lastCheckedRef.current = null;
      setCheckingRole(false);
      return;
    }

    if (lastCheckedRef.current === digits) return;

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
      } catch {
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
      });
      return;
    }

    if (digits.length !== 10) {
      Toast.show({
        type: "error",
        text1: "Número incompleto",
        text2: "Debes ingresar 10 dígitos.",
        position: "top",
      });
      return;
    }

    const isPrivileged = roleMsg === "ADMIN" || roleMsg === "SUPERADMIN";

    if (isPrivileged && !password.trim()) {
      Toast.show({
        type: "error",
        text1: "Falta tu contraseña",
        text2: "Requerida para Admin/Superadmin",
        position: "top",
      });
      return;
    }

    try {
      setLoading(true);
      const result = await authService.login(
        digits,
        isPrivileged ? password : undefined
      );
      setLoading(false);

      if (result.success) {
        await login(result.user, result.token);
        navigation.replace("Tabs");
      } else {
        Toast.show({
          type: "error",
          text1: "Error al iniciar sesión",
          text2: result.message,
          position: "top",
        });
      }
    } catch (error: any) {
      setLoading(false);
      Toast.show({
        type: "error",
        text1: "Error de conexión",
        text2: error?.message || "No se pudo conectar con el servidor",
        position: "top",
      });
    }
  };

  const showPasswordField = roleMsg === "ADMIN" || roleMsg === "SUPERADMIN";

  return (
    <View className="flex-1 bg-blue-600">
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      {/* Decoración de fondo (Círculos sutiles) */}
      <View className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10" />
      <View className="absolute top-40 -left-10 h-32 w-32 rounded-full bg-white/5" />
      <View className="absolute -bottom-10 -left-10 h-72 w-72 rounded-full bg-blue-800/30" />

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        className="flex-1 justify-center"
      >
        <View className="px-6">
          
          {/* CARD PRINCIPAL BLANCA */}
          <View className="bg-white rounded-[32px] px-6 py-8 shadow-2xl shadow-blue-900/25">
            
            {/* LOGO E INTRO (Dentro de la tarjeta para fusión perfecta) */}
            <View className="items-center mb-6">
              <Image
                source={Logo}
                // Tamaño grande y centrado. Al estar sobre blanco, el borde de la imagen desaparece.
                className="w-40 h-40" 
                resizeMode="contain"
              />
              <Text className="text-2xl font-bold text-slate-800 text-center mt-2">
                ¡Bienvenido de nuevo!
              </Text>
              <Text className="text-slate-400 text-sm mt-1 text-center">
                Ingresa tus datos para acceder a PyMe Fiel
              </Text>
            </View>

            {/* --- FORMULARIO --- */}
            
            {/* Input Teléfono */}
            <View className="mb-4">
              <Text className="text-slate-600 font-semibold mb-2 ml-1">
                Teléfono
              </Text>
              <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-14 focus:border-blue-500 transition-all">
                <MaterialCommunityIcons name="phone" size={22} color="#64748B" />
                <TextInput
                  placeholder="55 1234 5678"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={(t) => setPhoneNumber(t.replace(/[^0-9]/g, ""))}
                  className="flex-1 ml-3 text-lg text-slate-900"
                  placeholderTextColor="#94A3B8"
                  returnKeyType={showPasswordField ? "next" : "done"}
                />
                {checkingRole && (
                  <ActivityIndicator size="small" color="#2563EB" />
                )}
              </View>
            </View>

            {/* Input Contraseña (Condicional) */}
            {showPasswordField && (
              <View className="mb-6">
                <Text className="text-slate-600 font-semibold mb-2 ml-1">
                  Contraseña
                </Text>
                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 h-14">
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={22}
                    color="#64748B"
                  />
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPass}
                    value={password}
                    onChangeText={setPassword}
                    className="flex-1 ml-3 text-lg text-slate-900"
                    returnKeyType="done"
                  />
                  <Pressable
                    onPress={() => setShowPass((s) => !s)}
                    className="p-2"
                  >
                    <MaterialCommunityIcons
                      name={showPass ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color="#64748B"
                    />
                  </Pressable>
                </View>
                <View className="flex-row items-center mt-2 ml-1 bg-blue-50 self-start px-2 py-1 rounded-lg">
                  <MaterialCommunityIcons name="shield-check" size={14} color="#2563EB" />
                  <Text className="text-blue-700 text-xs ml-1 font-medium">
                    Acceso Administrativo
                  </Text>
                </View>
              </View>
            )}

            {/* Botón Login */}
            <Pressable
              onPress={handleLogin}
              disabled={loading}
              className={`h-14 rounded-2xl items-center justify-center mt-2 shadow-lg shadow-blue-200 ${
                loading ? "bg-blue-400" : "bg-blue-600"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg tracking-wide">
                  Iniciar sesión
                </Text>
              )}
            </Pressable>

            {/* Separador */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-[1px] bg-slate-200" />
              <Text className="mx-4 text-slate-400 font-medium text-sm">o continúa con</Text>
              <View className="flex-1 h-[1px] bg-slate-200" />
            </View>

            {/* Botón Registro */}
            <Pressable
              onPress={() => navigation.navigate("Register")}
              className="h-14 rounded-2xl items-center justify-center border-2 border-blue-100 bg-blue-50/50 active:bg-blue-100"
            >
              <Text className="text-blue-700 font-bold text-lg">
                Crear cuenta nueva
              </Text>
            </Pressable>
          </View>

          {/* Footer discreto fuera de la tarjeta */}
          <Text className="text-blue-200 text-center text-xs mt-8">
            PyMe Fiel v1.0.0 • Seguridad y Confianza
          </Text>

        </View>
      </KeyboardAvoidingView>
    </View>
  );
}