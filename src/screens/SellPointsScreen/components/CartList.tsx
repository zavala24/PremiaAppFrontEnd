import React from "react";
import { 
    Pressable as RNPressable,
      View as RNView,
  Text as RNText,
 } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { currency } from "../utils/sellHelpers";
import { CartItem } from "../types";
import { styled } from "nativewind";

const View = styled(RNView);
const Text = styled(RNText);
const Pressable = styled(RNPressable);

interface Props {
  cart: CartItem[];
  onRemove: (id: string) => void;
}

export const CartList = ({ cart, onRemove }: Props) => {
  return (
    <View className="mt-4">
      <Text className="text-gray-500 mb-2">Carrito ({cart.length})</Text>
      {cart.length === 0 ? (
        <View className="rounded-2xl border border-gray-200 p-3 bg-white">
          <Text className="text-gray-400">No hay artículos en el carrito.</Text>
        </View>
      ) : (
        <View className="rounded-2xl border border-gray-200 p-3 bg-white">
          {cart.map((it) => (
            <View key={it.id} className="flex-row items-center justify-between py-2">
              <View className="flex-1 pr-2">
                <Text className="font-semibold text-slate-800">{it.articulo}</Text>
                <Text className="text-xs text-slate-500">{it.descripcion ?? ""}</Text>
                <Text className="text-xs text-slate-600 mt-1">
                  {it.cantidad} × {currency(it.monto)} = {currency(it.monto * it.cantidad)}
                </Text>
              </View>
              <Pressable
                onPress={() => onRemove(it.id)}
                className="ml-3 p-2 rounded-full bg-red-100"
              >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#DC2626" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};