import React from "react";
import { Modal, Pressable as RNPressable,  View as RNView,
  Text as RNText,
  Image as RNImage } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { WhatsAppContext } from "../types";
import { currency } from "../utils/sellHelpers";
import { styled } from "nativewind";

const View = styled(RNView);
const Text = styled(RNText);
const Image = styled(RNImage);
const Pressable = styled(RNPressable);

interface Props {
  visible: boolean;
  context: WhatsAppContext | null;
  onClose: () => void;
  onConfirm: () => void;
  defaultSubtotal?: number; // fallback visual
}

export const WhatsAppModal = ({ visible, context, onClose, onConfirm, defaultSubtotal }: Props) => {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <View className="w-full max-w-md bg-white rounded-3xl p-5 border border-blue-100">
          <View className="items-center mb-3">
            <View className="h-12 w-12 rounded-full bg-green-100 items-center justify-center">
              <MaterialCommunityIcons name="whatsapp" size={28} color="#16a34a" />
            </View>
            <Text className="text-xl font-extrabold text-slate-900">Enviar por WhatsApp</Text>
            <Text className="text-slate-600 mt-1 text-center">
              ¿Quieres enviar el comprobante al cliente por WhatsApp?
            </Text>
          </View>

          <View className="max-h-64 mb-3 overflow-y-auto">
            {/* Detalles Rápidos */}
            <View className="mb-2">
                {context?.cartItems && context.cartItems.length > 0 ? (
                   context.cartItems.map((it, i) => (
                    <View key={i} className="flex-row justify-between py-1">
                        <Text className="text-slate-700">{`${i+1}. ${it.articulo} x ${it.cantidad}`}</Text>
                        <Text className="text-slate-700">{currency(it.monto * it.cantidad)}</Text>
                    </View>
                   ))
                ) : context?.article ? (
                    <View className="flex-row justify-between py-1">
                        <Text className="text-slate-700">{context.article}</Text>
                        <Text className="text-slate-700">{currency(context.amount)}</Text>
                    </View>
                ) : (
                    <Text className="text-slate-500">Sin detalles</Text>
                )}
            </View>

            <View className="flex-row justify-between mt-2">
              <Text className="text-slate-700">Total a cobrar</Text>
              <Text className="font-extrabold">{currency(context?.total ?? 0)}</Text>
            </View>
          </View>

          <View className="flex-row gap-3 mt-4">
            <Pressable
              className="flex-1 py-3 rounded-2xl border border-slate-300 items-center"
              onPress={onClose}
            >
              <Text className="text-slate-700 font-semibold">NO</Text>
            </Pressable>
            <Pressable
              className="flex-1 py-3 rounded-2xl items-center bg-green-500"
              onPress={onConfirm}
            >
              <Text className="text-white font-extrabold">SÍ</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};