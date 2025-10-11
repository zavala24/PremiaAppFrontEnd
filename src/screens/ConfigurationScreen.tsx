// src/screens/ConfigurationScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View as RNView,
  Text as RNText,
  TextInput as RNTextInput,
  Pressable as RNPressable,
  StatusBar,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  Platform,
  ScrollView as RNScrollView,
  ActivityIndicator,
} from "react-native";
import { styled } from "nativewind";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "../presentation/context/AuthContext";
import { UserRepository } from "../infrastructure/repositories/UserRepository";
import { UserService } from "../application/services/UserServices";
import { IUserService } from "../application/interfaces/IUserServices";

const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const Pressable = styled(RNPressable);
const KeyboardAvoidingView = styled(RNKeyboardAvoidingView);
const ScrollView = styled(RNScrollView);

const userService: IUserService = new UserService(new UserRepository());

export default function ConfigurationScreen() {
  const { user } = useAuth();

  // Form state
  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [email, setEmail] = useState("");
  const [notif, setNotif] = useState(true); // visual por ahora

  const [touchedEmail, setTouchedEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  // Teléfono actual (no editable aquí; se usa para el update)
  const [telefonoActual, setTelefonoActual] = useState<string | null>(null);

  const emailValid = useMemo(
    () => email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    [email]
  );
  const canSave = !loading && emailValid;

  // Cargar perfil al abrir
  const fetchUser = async () => {
    try {
      setLoading(true);

      // 1) del contexto si existe
      let phone = (user as any)?.telefono as string | undefined;

      // 2) fallback: guardado por LoginScreen (haz AsyncStorage.setItem("lastPhone", phone) en el login)
      if (!phone) {
        phone = (await AsyncStorage.getItem("lastPhone")) ?? undefined;
      }

      if (!phone) {
        setLoading(false);
        Toast.show({
          type: "error",
          text1: "No se pudo obtener tu teléfono",
          position: "top",
          visibilityTime: 2000,
        });
        return;
      }

      const { resp, user: u } = await userService.getUserByPhone(phone);

      if (!resp.success || !u) {
        setLoading(false);
        Toast.show({
          type: "error",
          text1: resp.message || "No se encontró el usuario",
          position: "top",
          visibilityTime: 2000,
        });
        return;
      }

      setNombre(u.nombre ?? "");
      setApellidoPaterno(u.apellidoPaterno ?? "");
      setApellidoMaterno(u.apellidoMaterno ?? "");
      setEmail(u.email ?? "");
      setTelefonoActual(u.telefono ?? null);

      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      Toast.show({
        type: "error",
        text1: e?.message ?? "Error al cargar tu perfil",
        position: "top",
        visibilityTime: 2000,
      });
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Guardar cambios
  const handleSave = async () => {
    if (!canSave || !telefonoActual) {
      Toast.show({
        type: "error",
        text1: !telefonoActual ? "Teléfono no disponible" : "Revise los campos",
        position: "top",
        visibilityTime: 1800,
      });
      return;
    }

    setLoading(true);
    try {
      const resp = await userService.updateUser({
        telefono: telefonoActual,
        nombre: nombre.trim(),
        apellidoPaterno: apellidoPaterno.trim(),
        apellidoMaterno: apellidoMaterno.trim(),
        email: email.trim(),
        role: "User", // si tu entidad lo requiere
      });

      setLoading(false);

      if (resp.success) {
        Toast.show({
          type: "success",
          text1: resp.message ?? "Configuración guardada",
          position: "top",
          visibilityTime: 2000,
        });
      } else {
        Toast.show({
          type: "error",
          text1: resp.message || "No se pudo guardar",
          position: "top",
          visibilityTime: 2200,
        });
      }
    } catch (e: any) {
      setLoading(false);
      Toast.show({
        type: "error",
        text1: e?.message ?? "Error al guardar",
        position: "top",
        visibilityTime: 2200,
      });
    }
  };

  return (
    <View className="flex-1 bg-blue-600">
      <StatusBar barStyle="light-content" />

      {/* Fondo decorativo */}
      <View
        pointerEvents="none"
        className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-400/25"
      />
      <View
        pointerEvents="none"
        className="absolute bottom-10 left-6 h-28 w-28 rounded-3xl bg-white/10 rotate-6"
      />

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          className="px-6"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 items-center justify-center py-6">
            <View
              className="w-full rounded-3xl bg-white shadow-2xl p-6 mt-16"
              style={{ maxWidth: 460 }}
            >
              <Text className="text-2xl font-extrabold text-blue-700 mb-1 text-center">
                Configuración
              </Text>
              <Text className="text-gray-500 text-center mb-5">
                Administra tu información de perfil
              </Text>
              <View className="h-[1px] bg-gray-100 mb-5" />

              {/* Nombre */}
              <Text className="text-gray-700 mb-1 font-semibold">Nombre</Text>
              <View className="flex-row items-center rounded-2xl border border-gray-200 bg-[#F9FAFB] px-4 py-3 mb-3">
                <Text className="text-gray-500 mr-2">👤</Text>
                <TextInput
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Tu nombre"
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 text-[16px] text-gray-800"
                />
              </View>

              {/* Apellido paterno */}
              <Text className="text-gray-700 mb-1 font-semibold">
                Apellido paterno
              </Text>
              <View className="flex-row items-center rounded-2xl border border-gray-200 bg-[#F9FAFB] px-4 py-3 mb-3">
                <Text className="text-gray-500 mr-2">🧾</Text>
                <TextInput
                  value={apellidoPaterno}
                  onChangeText={setApellidoPaterno}
                  placeholder="Tu apellido paterno"
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 text-[16px] text-gray-800"
                />
              </View>

              {/* Apellido materno */}
              <Text className="text-gray-700 mb-1 font-semibold">
                Apellido materno
              </Text>
              <View className="flex-row items-center rounded-2xl border border-gray-200 bg-[#F9FAFB] px-4 py-3 mb-3">
                <Text className="text-gray-500 mr-2">🧾</Text>
                <TextInput
                  value={apellidoMaterno}
                  onChangeText={setApellidoMaterno}
                  placeholder="Tu apellido materno"
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 text-[16px] text-gray-800"
                />
              </View>

              {/* Correo */}
              <Text className="text-gray-700 mb-1 font-semibold">Correo</Text>
              <View
                className={`flex-row items-center rounded-2xl border px-4 py-3 bg-[#F9FAFB] ${
                  touchedEmail
                    ? emailValid
                      ? "border-green-500"
                      : "border-red-500"
                    : "border-gray-200"
                }`}
              >
                <Text className="text-gray-500 mr-2">✉️</Text>
                <TextInput
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setTouchedEmail(true);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 text-[16px] text-gray-800"
                />
              </View>
              {touchedEmail && !emailValid && (
                <Text className="text-red-500 text-[11px] mt-1 mb-1">
                  Correo inválido.
                </Text>
              )}

              {/* Guardar */}
              <Pressable
                onPress={handleSave}
                disabled={!canSave}
                className={`rounded-2xl py-3.5 items-center mt-6 shadow-lg shadow-blue-500/30 ${
                  canSave ? "bg-blue-700 active:opacity-90" : "bg-blue-400"
                }`}
              >
                {loading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#fff" />
                    <Text className="text-white font-semibold text-base ml-3">
                      Guardando…
                    </Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-base">
                    Guardar cambios
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
