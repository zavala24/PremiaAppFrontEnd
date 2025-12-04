import React from "react";
import { TextInput as RNTextInput, Pressable as RNPressable, ActivityIndicator,   View as RNView,
  Text as RNText,
 } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { currency } from "../utils/sellHelpers";
import { styled } from "nativewind";

const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const Pressable = styled(RNPressable);

interface Props {
  phone: string;
  onChangePhone: (t: string) => void;
  onSearch: () => void;
  loading: boolean;
  userValid: boolean | null;
  customerName: string | null;
  customerBalance: number;
  disabled: boolean;
}

export const CustomerSearch = ({
  phone,
  onChangePhone,
  onSearch,
  loading,
  userValid,
  customerName,
  customerBalance,
  disabled
}: Props) => {
  return (
    <View>
      <Text className="text-gray-500 mb-2">Número de teléfono del cliente (obligatorio)</Text>
      <View className="flex-row items-center rounded-2xl border border-gray-300 bg-white px-4 py-3">
        <MaterialCommunityIcons name="phone" size={20} color="#6B7280" style={{ marginRight: 8 }} />
        <TextInput
          value={phone}
          onChangeText={onChangePhone}
          placeholder="5512345678"
          placeholderTextColor="#9CA3AF"
          className="flex-1 text-base text-gray-800 mr-3"
          style={{ paddingVertical: 0 }}
          keyboardType="number-pad"
          maxLength={10}
        />
        <Pressable
          onPress={onSearch}
          disabled={disabled || loading}
          className={`ml-3 px-4 py-2 rounded-xl ${loading ? "bg-blue-200" : "bg-blue-600"} shrink-0`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold">Buscar</Text>
          )}
        </Pressable>
      </View>

      {userValid !== null && !loading && (
        <Text className={`mt-2 ${userValid ? "text-green-600" : "text-red-600"}`}>
          {userValid ? "Usuario válido" : "Usuario no válido"}
        </Text>
      )}

      {customerName && userValid && !loading && (
        <View className="bg-blue-50 border border-blue-100 rounded-2xl p-3 mt-3">
          <Text className="text-blue-900 font-semibold">{customerName}</Text>
          <Text className="text-blue-700/70 mt-1">
            Saldo disponible: <Text className="font-semibold">{currency(customerBalance)}</Text>
          </Text>
        </View>
      )}
    </View>
  );
};