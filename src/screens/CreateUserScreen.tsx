import React, { useEffect, useMemo, useState } from "react";
import {
  View as RNView,
  Text as RNText,
  TextInput as RNTextInput,
  Pressable as RNPressable,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  Platform,
  ScrollView as RNScrollView, // 1. Renombramos el import original
} from "react-native";
import { styled } from "nativewind";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../presentation/context/AuthContext";

import { UserRepository } from "../infrastructure/repositories/UserRepository";
import { UserService } from "../application/services/UserServices";
import { IUserService } from "../application/interfaces/IUserServices";

import { Business } from "../domain/entities/Business";
import { BusinessRepository } from "../infrastructure/repositories/BusinessRepository";
import { BusinessService } from "../application/services/BusinessService";
import { IBusinessService } from "../application/interfaces/IBusinessService";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const Pressable = styled(RNPressable);
const KeyboardAvoidingView = styled(RNKeyboardAvoidingView);
const Safe = styled(SafeAreaView);
const ScrollView = styled(RNScrollView); // 2. Creamos el componente estilizado

export default function CreateUserScreen() {
  const { user } = useAuth();

  // ===== infra/services =====
  const userRepository = new UserRepository();
  const userService: IUserService = new UserService(userRepository);

  const businessRepository = new BusinessRepository();
  const businessService: IBusinessService = new BusinessService(businessRepository);

  // ===== negocio actual =====
  const [bizLoading, setBizLoading] = useState(true);
  const [bizError, setBizError] = useState<string | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user?.telefono) {
          setBizError("No se encontró el teléfono del usuario autenticado.");
          return;
        }
        const res = await businessService.getNegocioConfigByTelefono(user.telefono);
        if (!mounted) return;

        if (res.status !== 200 || !res.data) {
          setBizError(res.message || "No fue posible obtener el negocio.");
          return;
        }
        setBusiness(res.data);
        setBizError(null);
      } catch (e: any) {
        if (!mounted) return;
        setBizError(e?.message || "Error al cargar el negocio.");
      } finally {
        if (mounted) setBizLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.telefono]);

  // ===== formulario =====
  const [telefono, setTelefono] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const digits = useMemo(() => telefono.replace(/\D/g, ""), [telefono]);
  const isValid = /^\d{10}$/.test(digits);
  const remaining = 10 - digits.length;

  const handleChange = (text: string) => {
    // Solo números y tope 10; ignora extras para evitar parpadeos.
    setTelefono((prev) => {
      const cleaned = text.replace(/\D/g, "");
      if (cleaned.length <= 10) return cleaned;
      return prev;
    });
    setTouched(true);
    setServerError("");
  };

  const handleCrearUsuario = async () => {
    if (!isValid || loading) return;

    const businessId = business?.idNegocio ?? 0;
    if (!businessId) {
      Toast.show({
        type: "error",
        text1: "Negocio no disponible",
        text2: bizError || "No se pudo determinar el negocio del usuario.",
        position: "top",
        visibilityTime: 2200,
      });
      return;
    }

    try {
      setLoading(true);

      const payload: any = {
        nombre: "",
        telefono: digits,
        role: "User",
        idNegocio: businessId,
      };

      await userService.createUser(payload);

      setLoading(false);

      Toast.show({
        type: "success",
        text1: "Usuario creado",
        text2: `Teléfono: ${digits}`,
        position: "top",
        visibilityTime: 2000,
        autoHide: true,
      });

      setTelefono("");
      setTouched(false);
      setServerError("");
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message || "No se pudo crear el usuario";
      setServerError(msg);
      Toast.show({
        type: "error",
        text1: "Error al crear",
        text2: msg,
        position: "top",
        visibilityTime: 2200,
      });
    }
  };

  const disabledBtn = !isValid || loading || bizLoading || !!bizError;

  return (
    <View className="flex-1 bg-blue-600">
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      {/* Fondo decorativo sutil (Burbujas) */}
      <View pointerEvents="none" className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-400/25" />
      <View pointerEvents="none" className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-blue-800/25" />

      <Safe className="flex-1" edges={['top', 'left', 'right']}>
        
        {/* HEADER "PREMIUM" */}
        {/* Se agregó mb-6 para separar el texto del card blanco */}
        <View className="h-28 justify-center items-center mt-4 px-4 z-10 mb-6">
            <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center mb-3">
                <MaterialCommunityIcons name="account-plus" size={24} color="white" />
            </View>
            <Text className="text-white text-2xl font-extrabold tracking-wide text-center">
                Crear Usuario
            </Text>
            <Text className="text-blue-100 text-sm mt-1 text-center font-medium">
                Registra un nuevo cliente para tu negocio
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
                <View className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    
                    {/* Campo Teléfono */}
                    <View className="mb-6">
                        <Text className="text-slate-500 font-bold text-xs uppercase mb-2 ml-1">
                            Número de Teléfono
                        </Text>
                        
                        <View
                            className={[
                                "flex-row items-center rounded-2xl border px-4 py-3.5 bg-slate-50",
                                touched
                                    ? isValid
                                        ? "border-green-500 bg-green-50/30"
                                        : "border-red-400 bg-red-50/30"
                                    : "border-slate-200",
                            ].join(" ")}
                        >
                            <Text className="text-slate-400 mr-3 text-lg">🇲🇽 +52</Text>

                            <TextInput
                                value={digits}
                                onChangeText={handleChange}
                                maxLength={10}
                                keyboardType="number-pad"
                                inputMode="numeric"
                                placeholder="000 000 0000"
                                placeholderTextColor="#94A3B8"
                                className="flex-1 text-lg font-semibold text-slate-800"
                                style={{
                                    paddingVertical: 0,
                                    ...(Platform.OS === "android" ? { textAlignVertical: "center" as const } : null),
                                }}
                                returnKeyType="done"
                            />

                            {isValid && (
                                <View className="bg-green-100 rounded-full p-1 ml-2">
                                    <MaterialCommunityIcons name="check" size={14} color="#15803d" />
                                </View>
                            )}
                        </View>

                        {/* Mensajes de ayuda / error */}
                        <View className="flex-row justify-between items-start mt-2 px-1">
                            <Text
                                className={[
                                    "text-xs font-medium flex-1 mr-2",
                                    !touched
                                        ? "text-slate-400"
                                        : isValid
                                        ? "text-green-600"
                                        : "text-red-500",
                                ].join(" ")}
                            >
                                {!touched
                                    ? "Ingresa los 10 dígitos del cliente."
                                    : isValid
                                    ? "Número válido."
                                    : remaining > 0
                                    ? `Faltan ${remaining} dígito${remaining === 1 ? "" : "s"}.`
                                    : "Verifica que sean 10 dígitos."}
                            </Text>
                            
                            <Text className="text-xs text-slate-400 font-medium">
                                {digits.length}/10
                            </Text>
                        </View>

                        {serverError ? (
                            <View className="mt-3 bg-red-50 p-3 rounded-xl flex-row items-center border border-red-100">
                                <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#EF4444" />
                                <Text className="text-red-600 text-xs ml-2 flex-1 font-medium">{serverError}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Botón Crear */}
                    <Pressable
                        onPress={handleCrearUsuario}
                        disabled={disabledBtn}
                        className={[
                            "rounded-2xl py-4 items-center shadow-lg transition-all",
                            disabledBtn 
                                ? "bg-slate-200 shadow-none" 
                                : "bg-blue-600 shadow-blue-300 active:scale-[0.98] active:bg-blue-700",
                        ].join(" ")}
                    >
                        {loading ? (
                            <View className="flex-row items-center">
                                <ActivityIndicator size="small" color={disabledBtn ? "#94A3B8" : "#fff"} />
                                <Text className={`font-bold text-base ml-2 ${disabledBtn ? "text-slate-400" : "text-white"}`}>
                                    Procesando...
                                </Text>
                            </View>
                        ) : (
                            <Text className={`font-bold text-lg ${disabledBtn ? "text-slate-400" : "text-white"}`}>
                                Crear Usuario
                            </Text>
                        )}
                    </Pressable>

                </View>
                
                {/* Nota inferior opcional */}
                <Text className="text-center text-slate-400 text-xs mt-6 px-10">
                    Al crear el usuario, podrá comenzar a acumular puntos inmediatamente en {business?.name || "tu negocio"}.
                </Text>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Safe>
    </View>
  );
}