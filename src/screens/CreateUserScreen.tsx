// src/screens/CreateUserScreen.tsx
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
} from "react-native";
import { styled } from "nativewind";
import Toast from "react-native-toast-message";

import { useAuth } from "../presentation/context/AuthContext";

import { UserRepository } from "../infrastructure/repositories/UserRepository";
import { UserService } from "../application/services/UserServices";
import { IUserService } from "../application/interfaces/IUserServices";

import { Business } from "../domain/entities/Business";
import { BusinessRepository } from "../infrastructure/repositories/BusinessRepository";
import { BusinessService } from "../application/services/BusinessService";
import { IBusinessService } from "../application/interfaces/IBusinessService";

const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const Pressable = styled(RNPressable);
const KeyboardAvoidingView = styled(RNKeyboardAvoidingView);

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
      <StatusBar barStyle="light-content" />

      {/* Fondo decorativo sutil */}
      <View className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-400/25" />
      <View className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-blue-800/25" />
      <View className="absolute top-32 left-8 h-16 w-16 rounded-2xl bg-white/10 rotate-12" />
      <View className="absolute bottom-44 right-8 h-20 w-20 rounded-3xl bg-white/10 -rotate-6" />

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        className="flex-1 justify-center px-6"
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        {/* Tarjeta */}
        <View className="w-full rounded-3xl bg-white shadow-2xl p-7">
          {/* Encabezado */}
          <View className="items-center mb-4">
            <Text className="text-3xl font-extrabold text-blue-700">Crear usuario</Text>
            <Text className="text-gray-500 mt-1 text-center">
              Registra un número para registrar
            </Text>
          </View>

          {/* Campo teléfono */}
          <View className="mb-4">
            <View
              className={[
                "flex-row items-center rounded-2xl border px-4 py-3 shadow-sm bg-[#F9FAFB]",
                touched
                  ? isValid
                    ? "border-green-500"
                    : "border-red-500"
                  : "border-gray-200",
              ].join(" ")}
            >
              <Text className="text-gray-500 mr-2">📞</Text>

              <TextInput
                value={digits}
                onChangeText={handleChange}
                maxLength={10}
                keyboardType="number-pad"
                inputMode="numeric"
                textContentType="telephoneNumber"
                autoComplete="tel"
                autoCorrect={false}
                placeholder="Teléfono"
                placeholderTextColor="#9CA3AF"
                className="flex-1 text-base text-gray-800 mr-2"
                // Centrado vertical del placeholder/valor en iOS y Android
                style={{
                  paddingVertical: 0,
                  ...(Platform.OS === "android"
                    ? { textAlignVertical: "center" as const }
                    : null),
                }}
                returnKeyType="done"
              />

              <Text
                className={[
                  "ml-2 text-xs font-semibold",
                  isValid ? "text-green-600" : "text-gray-400",
                ].join(" ")}
              >
                {digits.length}/10
              </Text>
            </View>

            {/* Ayuda / error */}
            <Text
              className={[
                "mt-2 text-xs",
                !touched
                  ? "text-gray-400"
                  : isValid
                  ? "text-green-600"
                  : "text-red-500",
              ].join(" ")}
            >
              {!touched
                ? "Solo números (10 dígitos)."
                : isValid
                ? "Formato válido."
                : remaining > 0
                ? `Faltan ${remaining} dígito${remaining === 1 ? "" : "s"}.`
                : "Formato incorrecto: deben ser 10 dígitos."}
            </Text>

            {serverError ? (
              <Text className="text-red-500 text-xs mt-1">{serverError}</Text>
            ) : null}
          </View>

          {/* Botón */}
          <Pressable
            onPress={handleCrearUsuario}
            disabled={disabledBtn}
            className={[
              "rounded-2xl py-4 items-center mt-2 shadow-lg shadow-blue-500/30",
              disabledBtn ? "bg-blue-400" : "bg-blue-700 active:opacity-90",
            ].join(" ")}
          >
            {loading ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#fff" />
                <Text className="text-white font-semibold text-base ml-3">
                  Creando…
                </Text>
              </View>
            ) : (
              <Text className="text-white font-semibold text-lg">Crear</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
