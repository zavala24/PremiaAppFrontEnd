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
import { SafeAreaView } from "react-native-safe-area-context";

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
const Safe = styled(SafeAreaView);

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
      const result = await userService.registerUser({
        telefono: digits,
        nombre: nombre.trim(),
        apellidoPaterno: apellidoPaterno.trim(),
        apellidoMaterno: apellidoMaterno.trim(),
        email: email.trim(),
        role: "User",
      });

      setLoading(false);
      resetForm();

      Toast.show({
        type: "success",              
        text1: result.message,
        position: "top",
        visibilityTime: 2000,
      });

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
        position: "top",
        visibilityTime: 2000,
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
        <View className="justify-center items-center mt-2 px-4 z-10 mb-6">
            {/* Botón Volver */}
            <View className="w-full flex-row justify-start mb-2">
                <Pressable
                    onPress={() => {
                        if (navigation.canGoBack()) navigation.goBack();
                        else navigation.replace("Login");
                    }}
                    className="h-10 w-10 items-center justify-center rounded-full bg-white/20 active:bg-white/30"
                >
                    <MaterialCommunityIcons name="chevron-left" size={28} color="white" />
                </Pressable>
            </View>

            <View className="items-center">
                <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center mb-3">
                    <MaterialCommunityIcons name="account-plus-outline" size={26} color="white" />
                </View>
                <Text className="text-white text-2xl font-extrabold tracking-wide text-center">
                    Regístrate
                </Text>
                <Text className="text-blue-100 text-sm mt-1 text-center font-medium">
                    Completa tus datos para comenzar
                </Text>
            </View>
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
                    
                    {/* Teléfono */}
                    <View>
                        <Text className="text-slate-500 font-bold text-xs uppercase mb-2 ml-1">Número de Teléfono</Text>
                        <View className={`flex-row items-center rounded-2xl border px-4 py-3.5 bg-slate-50 ${touched.tel ? (phoneValid ? "border-green-500 bg-green-50/30" : "border-red-400 bg-red-50/30") : "border-slate-200"}`}>
                            <MaterialCommunityIcons name="cellphone" size={20} color="#94A3B8" style={{ marginRight: 10 }} />
                            <TextInput
                                value={digits}
                                onChangeText={(t) => {
                                    setTelefono(t.replace(/\D/g, ""));
                                    setTouched((s) => ({ ...s, tel: true }));
                                }}
                                maxLength={10}
                                keyboardType="number-pad"
                                placeholder="Ej. 5512345678"
                                placeholderTextColor="#9CA3AF"
                                className="flex-1 text-base font-semibold text-slate-800"
                                returnKeyType="next"
                            />
                            {phoneValid && (
                                <MaterialCommunityIcons name="check-circle" size={18} color="#15803d" />
                            )}
                        </View>
                        {!phoneValid && touched.tel && (
                            <Text className="text-red-500 text-xs mt-1 ml-1 font-medium">Debe tener 10 dígitos.</Text>
                        )}
                    </View>

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
                        <View className={`flex-row items-center rounded-2xl border px-4 py-3.5 bg-slate-50 ${touched.email ? (emailValid ? "border-green-500 bg-green-50/30" : "border-red-400 bg-red-50/30") : "border-slate-200"}`}>
                            <MaterialCommunityIcons name="email-outline" size={20} color={touched.email && !emailValid ? "#EF4444" : "#94A3B8"} style={{ marginRight: 10 }} />
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
                                className="flex-1 text-base font-semibold text-slate-800"
                                onSubmitEditing={handleRegister}
                            />
                            {touched.email && emailValid && (
                                <MaterialCommunityIcons name="check-circle" size={18} color="#15803d" />
                            )}
                        </View>
                        {touched.email && !emailValid && (
                            <Text className="text-red-500 text-xs mt-1 ml-1 font-medium">
                                Por favor ingresa un correo válido.
                            </Text>
                        )}
                    </View>

                    {/* Error de Servidor */}
                    {!!serverError && (
                        <View className="bg-red-50 p-3 rounded-xl flex-row items-center border border-red-100">
                            <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#EF4444" />
                            <Text className="text-red-600 text-xs ml-2 flex-1 font-medium">{serverError}</Text>
                        </View>
                    )}

                    {/* Botón Crear Cuenta */}
                    <Pressable
                        onPress={handleRegister}
                        disabled={!canSubmit}
                        className={`rounded-2xl py-4 items-center shadow-lg mt-4 transition-all ${
                            canSubmit 
                                ? "bg-blue-600 shadow-blue-300 active:scale-[0.98] active:bg-blue-700" 
                                : "bg-slate-200 shadow-none"
                        }`}
                    >
                        {loading ? (
                            <View className="flex-row items-center">
                                <ActivityIndicator size="small" color={!canSubmit ? "#94A3B8" : "#fff"} />
                                <Text className={`font-bold text-base ml-2 ${!canSubmit ? "text-slate-400" : "text-white"}`}>
                                    Procesando...
                                </Text>
                            </View>
                        ) : (
                            <Text className={`font-bold text-lg ${!canSubmit ? "text-slate-400" : "text-white"}`}>
                                Crear Cuenta
                            </Text>
                        )}
                    </Pressable>

                </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Safe>
    </View>
  );
}