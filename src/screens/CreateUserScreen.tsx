import React, { useState } from "react";
import { View as RNView, Text as RNText, TextInput as RNTextInput, Pressable as RNPressable } from "react-native";
import { styled } from "nativewind";
import { UserRepository } from "../infrastructure/repositories/UserRepository";
import { UserService } from "../application/services/UserServices";
import { IUserService } from "../application/interfaces/IUserServices";

const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const Pressable = styled(RNPressable);

export default function CreateUserScreen() {
  const [telefono, setTelefono] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");

  const repository = new UserRepository();
  const userService: IUserService = new UserService(repository);

  const isValid = /^\d{10}$/.test(telefono);

  const handleChange = (text: string) => {
    setTelefono(text.replace(/\D/g, "")); // Solo números
    setTouched(true);
    setError("");
  };

  const handleCrearUsuario = async () => {
    if (!isValid) {
      setError("Formato incorrecto: debe tener 10 dígitos");
      return;
    }

    try {
      await userService.createUser({ nombre: "Nuevo Usuario", telefono, role: "User" });
      alert("Usuario creado correctamente");
      setTelefono("");
      setTouched(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <View className="flex-1 bg-white justify-center items-center p-6">
      <TextInput
        className={`w-72 p-4 rounded-2xl text-lg font-bold ${
          !touched ? "border-gray-300" : isValid ? "border-green-500" : "border-red-500"
        } border-2 mb-2 bg-white shadow-sm`}
        placeholder="Ingresa el número de teléfono"
        placeholderTextColor="#999"
        keyboardType="phone-pad"
        value={telefono}
        onChangeText={handleChange}
      />

      {error && <Text className="text-red-500 font-semibold mb-6">{error}</Text>}

      <Pressable
        className="w-72 p-4 rounded-2xl bg-blue-700 shadow-lg active:scale-95 mt-10"
        onPress={handleCrearUsuario}
      >
        <Text className="text-center text-white font-bold text-lg tracking-wide">
          Crear Usuario
        </Text>
      </Pressable>
    </View>
  );
}
