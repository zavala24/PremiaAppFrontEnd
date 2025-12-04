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
import { SafeAreaView } from "react-native-safe-area-context";

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
const Safe = styled(SafeAreaView);

const userService: IUserService = new UserService(new UserRepository());

export default function ConfigurationScreen() {
  const { user } = useAuth();

  // Form state
  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);

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

      // 2) fallback: guardado por LoginScreen
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
        role: "User", 
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
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      {/* Fondo decorativo (Burbujas) */}
      <View pointerEvents="none" className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-400/25" />
      <View pointerEvents="none" className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-blue-800/25" />

      <Safe className="flex-1" edges={['top', 'left', 'right']}>
        
        {/* HEADER "PREMIUM" */}
        <View className="h-28 justify-center items-center mt-4 px-4 z-10 mb-6">
            <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center mb-3">
                <MaterialCommunityIcons name="cog-outline" size={24} color="white" />
            </View>
            <Text className="text-white text-2xl font-extrabold tracking-wide text-center">
                Configuración
            </Text>
            <Text className="text-blue-100 text-sm mt-1 text-center font-medium">
                Administra tu información de perfil
            </Text>
        </View>

        {/* CONTENEDOR PRINCIPAL */}
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: "height" })}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          {/* Tarjeta Blanca "Sheet" */}
          <View className="flex-1 bg-slate-50 rounded-t-[32px] pt-8 px-6 shadow-2xl overflow-hidden border-t border-white/20">
            <ScrollView
              className="flex-1"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* Formulario */}
                <View className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
                    
                    {/* Nombre */}
                    <View>
                        <Text className="text-slate-500 font-bold text-xs uppercase mb-2 ml-1">Nombre</Text>
                        <View className="flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                            <MaterialCommunityIcons name="account-outline" size={20} color="#94A3B8" style={{ marginRight: 10 }} />
                            <TextInput
                                value={nombre}
                                onChangeText={setNombre}
                                placeholder="Tu nombre"
                                placeholderTextColor="#9CA3AF"
                                className="flex-1 text-base font-semibold text-slate-800"
                            />
                        </View>
                    </View>

                    {/* Apellido Paterno */}
                    <View>
                        <Text className="text-slate-500 font-bold text-xs uppercase mb-2 ml-1">Apellido Paterno</Text>
                        <View className="flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                            <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#94A3B8" style={{ marginRight: 10 }} />
                            <TextInput
                                value={apellidoPaterno}
                                onChangeText={setApellidoPaterno}
                                placeholder="Tu apellido paterno"
                                placeholderTextColor="#9CA3AF"
                                className="flex-1 text-base font-semibold text-slate-800"
                            />
                        </View>
                    </View>

                    {/* Apellido Materno */}
                    <View>
                        <Text className="text-slate-500 font-bold text-xs uppercase mb-2 ml-1">Apellido Materno</Text>
                        <View className="flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                            <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#94A3B8" style={{ marginRight: 10 }} />
                            <TextInput
                                value={apellidoMaterno}
                                onChangeText={setApellidoMaterno}
                                placeholder="Tu apellido materno"
                                placeholderTextColor="#9CA3AF"
                                className="flex-1 text-base font-semibold text-slate-800"
                            />
                        </View>
                    </View>

                    {/* Correo */}
                    <View>
                        <Text className="text-slate-500 font-bold text-xs uppercase mb-2 ml-1">Correo Electrónico</Text>
                        <View className={`flex-row items-center rounded-2xl border px-4 py-3.5 bg-slate-50 ${touchedEmail ? (emailValid ? "border-green-500 bg-green-50/30" : "border-red-400 bg-red-50/30") : "border-slate-200"}`}>
                            <MaterialCommunityIcons name="email-outline" size={20} color={touchedEmail && !emailValid ? "#EF4444" : "#94A3B8"} style={{ marginRight: 10 }} />
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
                                className="flex-1 text-base font-semibold text-slate-800"
                            />
                            {touchedEmail && emailValid && (
                                <MaterialCommunityIcons name="check-circle" size={18} color="#15803d" />
                            )}
                        </View>
                        {touchedEmail && !emailValid && (
                            <Text className="text-red-500 text-xs mt-1 ml-1 font-medium">
                                Por favor ingresa un correo válido.
                            </Text>
                        )}
                    </View>

                    {/* Botón Guardar */}
                    <Pressable
                        onPress={handleSave}
                        disabled={!canSave}
                        className={`rounded-2xl py-4 items-center shadow-lg mt-4 transition-all ${
                            canSave 
                                ? "bg-blue-600 shadow-blue-300 active:scale-[0.98] active:bg-blue-700" 
                                : "bg-slate-200 shadow-none"
                        }`}
                    >
                        {loading ? (
                            <View className="flex-row items-center">
                                <ActivityIndicator size="small" color={!canSave ? "#94A3B8" : "#fff"} />
                                <Text className={`font-bold text-base ml-2 ${!canSave ? "text-slate-400" : "text-white"}`}>
                                    Guardando...
                                </Text>
                            </View>
                        ) : (
                            <Text className={`font-bold text-lg ${!canSave ? "text-slate-400" : "text-white"}`}>
                                Guardar Cambios
                            </Text>
                        )}
                    </Pressable>

                </View>
                
                {/* Nota de versión o info adicional */}
                <Text className="text-center text-slate-300 text-xs mt-8">
                </Text>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Safe>
    </View>
  );
}