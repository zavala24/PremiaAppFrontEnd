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
} from "react-native";
import { styled } from "nativewind";
import Toast from "react-native-toast-message";

import { UserRepository } from "../infrastructure/repositories/UserRepository";
import { UserService } from "../application/services/UserServices";
import { IUserService } from "../application/interfaces/IUserServices";

const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const Pressable = styled(RNPressable);
const KeyboardAvoidingView = styled(RNKeyboardAvoidingView);

export default function CreateUserScreen() {
  const [telefono, setTelefono] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const repository = new UserRepository();
  const userService: IUserService = new UserService(repository);

  const digits = useMemo(() => telefono.replace(/\D/g, ""), [telefono]);
  const isValid = /^\d{10}$/.test(digits);
  const remaining = 10 - digits.length;

  const handleChange = (text: string) => {
    setTelefono(text.replace(/\D/g, ""));
    setTouched(true);
    setServerError("");
  };

  const handleCrearUsuario = async () => {
    if (!isValid || loading) return;

    try {
      setLoading(true);
      await userService.createUser({
        nombre: "",
        telefono: digits,
        role: "User",
      });
      setLoading(false);

      Toast.show({
        type: "success",
        text1: "Usuario creado",
        text2: `Teléfono: ${digits}`,
        position: "top",
        visibilityTime: 2000, // 2s
        autoHide: true,
      });

      setTelefono("");
      setTouched(false);
    } catch (err: any) {
      setLoading(false);
      setServerError(err?.message || "No se pudo crear el usuario");
      Toast.show({
        type: "error",
        text1: "Error al crear",
        text2: err?.message || "Inténtalo de nuevo",
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
          <View className="items-center mb-6">
            <Text className="text-3xl font-extrabold text-blue-700">
              Crear usuario
            </Text>
            <Text className="text-gray-500 mt-1 text-center">
              Registra un número para comenzar
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
                keyboardType="phone-pad"
                placeholder="Número de teléfono"
                placeholderTextColor="#9CA3AF"
                className="flex-1 text-base text-gray-800"
                accessible
                accessibilityLabel="Número de teléfono (10 dígitos)"
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
            disabled={!isValid || loading}
            className={[
              "rounded-2xl py-4 items-center mt-4 shadow-lg shadow-blue-500/30",
              !isValid || loading ? "bg-blue-400" : "bg-blue-700 active:opacity-90",
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
              <Text className="text-white font-semibold text-lg">
                Crear Usuario
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
