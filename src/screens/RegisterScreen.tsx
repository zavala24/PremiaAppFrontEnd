// src/screens/RegisterScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View as RNView,
  Text as RNText,
  TextInput as RNTextInput,
  Pressable as RNPressable,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  Platform,
  ScrollView as RNScrollView,
} from "react-native";
import { styled } from "nativewind";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";

import { RootStackParamList } from "../navigation/StackNavigator";
import { UserRepository } from "../infrastructure/repositories/UserRepository";
import { UserService } from "../application/services/UserServices";
import { IUserService } from "../application/interfaces/IUserServices";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const Pressable = styled(RNPressable);
const KeyboardAvoidingView = styled(RNKeyboardAvoidingView);
const ScrollView = styled(RNScrollView);

type Nav = NativeStackNavigationProp<RootStackParamList, "Register">;

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();

  // form
  const [telefono, setTelefono] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [email, setEmail] = useState("");

  const [touched, setTouched] = useState({ tel: false, email: false });
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // services
  const userService: IUserService = new UserService(new UserRepository());

  // validation
  const digits = useMemo(() => telefono.replace(/\D/g, ""), [telefono]);
  const phoneValid = /^\d{10}$/.test(digits);
  const emailValid = email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = phoneValid && emailValid && !loading;

  const resetForm = () => {
    setTelefono("");
    setNombre("");
    setApellidoPaterno("");
    setApellidoMaterno("");
    setEmail("");
    setTouched({ tel: false, email: false });
    setServerError("");
  };

  const handleRegister = async () => {
    if (!canSubmit) return;
    setServerError("");
    setLoading(true);

    try {
      await userService.createUser({
          telefono: digits,
          nombre: nombre.trim(),
          apellidoPaterno: apellidoPaterno.trim(),
          apellidoMaterno: apellidoMaterno.trim(),
          email: email.trim(),
          role: "User"
      });

      setLoading(false);
      resetForm();

      navigation.replace("Login", {
        fromRegister: true,
        registeredPhone: digits,
      });
    } catch (e: any) {
      setLoading(false);
      const msg = e?.message || "No se pudo crear el usuario";
      setServerError(msg);
      Toast.show({
        type: "error",
        text1: "Error al crear",
        text2: msg,
        position: "bottom",
        visibilityTime: 3000,
      });
    }
  };

  return (
    <View className="flex-1 bg-blue-600">
      <StatusBar barStyle="light-content" />

      {/* Fondo sutil */}
      <View pointerEvents="none" className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-400/25" />
      <View pointerEvents="none" className="absolute bottom-10 right-6 h-24 w-24 rounded-3xl bg-white/10 -rotate-6" />

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">
          <View className="flex-1 items-center justify-center py-6">
            {/* Card compacta y centrada */}
            <View
              className="w-full rounded-3xl bg-white shadow-2xl p-6"
              style={{ maxWidth: 420 }}
            >
              {/* Header dentro de la tarjeta */}
            <View className="relative mb-3 h-10 justify-center">
            {/* Botón volver a la izquierda */}
            <Pressable
                onPress={() => navigation.goBack()}
                className="absolute left-0 h-10 w-10 items-center justify-center rounded-full bg-blue-50 active:bg-blue-100"
                accessibilityRole="button"
                accessibilityLabel="Volver"
            >
                {/* Usa tu ícono preferido aquí */}
            <MaterialCommunityIcons name="chevron-left" size={26} color="#1D4ED8" />
                {/* Si usas vector-icons:
                    */}
            </Pressable>

            {/* Título absolutamente centrado */}
            <Text className="absolute left-0 right-0 text-center text-2xl font-extrabold text-blue-700">
                Regístrate
            </Text>
            </View>

              <Text className="text-gray-500 text-center mb-4">
                Completa tus datos para comenzar
              </Text>

              <View className="h-[1px] bg-gray-100 mb-4" />

              {/* Campos (más compactos) */}
              <View className="gap-y-3">
                {/* Teléfono */}
                <View>
                  <Text className="text-gray-700 mb-1 font-semibold">Número de teléfono *</Text>
                  <View
                    className={[
                      "flex-row items-center rounded-2xl border px-4 py-3 bg-[#F9FAFB]",
                      touched.tel ? (phoneValid ? "border-green-500" : "border-red-500") : "border-gray-200",
                    ].join(" ")}
                  >
                    <Text className="text-gray-500 mr-2">📱</Text>
                    <TextInput
                      value={digits}
                      onChangeText={(t) => {
                        setTelefono(t.replace(/\D/g, ""));
                        setTouched((s) => ({ ...s, tel: true }));
                      }}
                      maxLength={10}
                      keyboardType="phone-pad"
                      placeholder="Ej. 5512345678"
                      placeholderTextColor="#9CA3AF"
                      className="flex-1 text-[16px] text-gray-800"
                      returnKeyType="next"
                    />
                    <Text className={["ml-2 text-[11px] font-semibold", phoneValid ? "text-green-600" : "text-gray-400"].join(" ")}>
                      {digits.length}/10
                    </Text>
                  </View>
                  <Text
                    className={[
                      "mt-1 text-[11px]",
                      !touched.tel ? "text-gray-400" : phoneValid ? "text-green-600" : "text-red-500",
                    ].join(" ")}
                  >
                    {!touched.tel
                      ? "Solo números (10 dígitos)."
                      : phoneValid
                      ? "Formato válido."
                      : "Debe contener 10 dígitos."}
                  </Text>
                </View>

                {/* Nombre */}
                <View>
                  <Text className="text-gray-700 mb-1 font-semibold">Nombre</Text>
                  <View className="flex-row items-center rounded-2xl border border-gray-200 bg-[#F9FAFB] px-4 py-3">
                    <Text className="text-gray-500 mr-2">👤</Text>
                    <TextInput
                      value={nombre}
                      onChangeText={setNombre}
                      placeholder="Nombre"
                      placeholderTextColor="#9CA3AF"
                      className="flex-1 text-[16px] text-gray-800"
                      returnKeyType="next"
                    />
                  </View>
                </View>

                {/* Apellido Paterno */}
                <View>
                  <Text className="text-gray-700 mb-1 font-semibold">Apellido Paterno</Text>
                  <View className="flex-row items-center rounded-2xl border border-gray-200 bg-[#F9FAFB] px-4 py-3">
                    <Text className="text-gray-500 mr-2">🧾</Text>
                    <TextInput
                      value={apellidoPaterno}
                      onChangeText={setApellidoPaterno}
                      placeholder="Apellido paterno"
                      placeholderTextColor="#9CA3AF"
                      className="flex-1 text-[16px] text-gray-800"
                      returnKeyType="next"
                    />
                  </View>
                </View>

                {/* Apellido Materno */}
                <View>
                  <Text className="text-gray-700 mb-1 font-semibold">Apellido Materno</Text>
                  <View className="flex-row items-center rounded-2xl border border-gray-200 bg-[#F9FAFB] px-4 py-3">
                    <Text className="text-gray-500 mr-2">🧾</Text>
                    <TextInput
                      value={apellidoMaterno}
                      onChangeText={setApellidoMaterno}
                      placeholder="Apellido materno"
                      placeholderTextColor="#9CA3AF"
                      className="flex-1 text-[16px] text-gray-800"
                      returnKeyType="next"
                    />
                  </View>
                </View>

                {/* Correo */}
                <View>
                  <Text className="text-gray-700 mb-1 font-semibold">Correo</Text>
                  <View
                    className={[
                      "flex-row items-center rounded-2xl border px-4 py-3 bg-[#F9FAFB]",
                      touched.email ? (emailValid ? "border-green-500" : "border-red-500") : "border-gray-200",
                    ].join(" ")}
                  >
                    <Text className="text-gray-500 mr-2">✉️</Text>
                    <TextInput
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        setTouched((s) => ({ ...s, email: true }));
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      placeholder="ejemplo@correo.com"
                      placeholderTextColor="#9CA3AF"
                      className="flex-1 text-[16px] text-gray-800"
                      returnKeyType="done"
                      onSubmitEditing={handleRegister}
                    />
                  </View>
                  {touched.email && !emailValid && (
                    <Text className="text-red-500 text-[11px] mt-1">Correo inválido.</Text>
                  )}
                </View>
              </View>

              {/* Error servidor */}
              {!!serverError && <Text className="text-red-500 text-xs mt-3">{serverError}</Text>}

              {/* Botón */}
              <Pressable
                onPress={handleRegister}
                disabled={!canSubmit}
                className={[
                  "rounded-2xl py-3.5 items-center mt-5 shadow-lg shadow-blue-500/30",
                  canSubmit ? "bg-blue-700 active:opacity-90" : "bg-blue-400",
                ].join(" ")}
              >
                {loading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#fff" />
                    <Text className="text-white font-semibold text-base ml-3">Creando…</Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-base">Crear usuario</Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
