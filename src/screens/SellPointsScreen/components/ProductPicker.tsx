import React, { useState } from "react";
import { Pressable as RNPressable, Modal, ActivityIndicator, FlatList,  View as RNView,
  Text as RNText,
  Image as RNImage 
 } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { styled } from "nativewind";

const View = styled(RNView);
const Text = styled(RNText);
const Image = styled(RNImage);
const Pressable = styled(RNPressable);
// Definimos la interfaz del producto aquí o impórtala de tu capa de dominio si ya existe
export interface ProductCustom {
  idProductoCustom: number;
  nombreProducto: string;
  tipoAcumulacion: string;
  meta: number;
  porcentajePorCompra: number;
  recompensa?: string;
  estado?: boolean;
}

interface Props {
  products: ProductCustom[];
  selectedProduct: ProductCustom | null;
  onSelect: (product: ProductCustom | null) => void;
  loading: boolean;
  disabled: boolean;
}

export const ProductPicker = ({
  products,
  selectedProduct,
  onSelect,
  loading,
  disabled,
}: Props) => {
  const [modalVisible, setModalVisible] = useState(false);

  // Manejador para abrir el modal
  const handleOpen = () => {
    if (!disabled) setModalVisible(true);
  };

  // Renderizado de cada item en la lista
  const renderItem = ({ item }: { item: ProductCustom }) => (
    <Pressable
      onPress={() => {
        onSelect(item);
        setModalVisible(false);
      }}
      className={`py-3 px-3 rounded-xl border mb-2 ${
        selectedProduct?.idProductoCustom === item.idProductoCustom
          ? "bg-blue-50 border-blue-500"
          : "border-slate-200 bg-white"
      }`}
    >
      <Text className="font-semibold text-slate-800">{item.nombreProducto}</Text>
      <Text className="text-slate-500 text-xs mt-1">
        Tipo: {item.tipoAcumulacion} · Meta: {item.meta} · % x compra: {item.porcentajePorCompra}%
      </Text>
      {item.recompensa && (
        <Text className="text-emerald-600 text-xs mt-1">Recompensa: {item.recompensa}</Text>
      )}
    </Pressable>
  );

  return (
    <View>
      {/* --- TRIGGER (El input falso) --- */}
      <Pressable
        onPress={handleOpen}
        className={`rounded-2xl border px-4 py-3 flex-row items-center justify-between ${
          disabled ? "bg-gray-100 border-gray-200" : "bg-white border-gray-300"
        }`}
        disabled={disabled}
      >
        <View className="flex-1 flex-row items-center justify-between">
          <Text
            className={`text-base ${
              selectedProduct ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {selectedProduct
              ? selectedProduct.nombreProducto
              : loading
              ? "Cargando promociones..."
              : disabled
              ? "Valida el teléfono para habilitar"
              : products.length > 0
              ? "Selecciona una promoción"
              : "No hay promociones disponibles"}
          </Text>

          {/* Botón para quitar selección (X) o Flecha abajo */}
          {selectedProduct ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onSelect(null);
              }}
              className="ml-3 p-1 rounded-full bg-red-100"
            >
              <MaterialCommunityIcons name="close" size={18} color="#DC2626" />
            </Pressable>
          ) : (
            <MaterialCommunityIcons
              name="chevron-down"
              size={22}
              color={disabled ? "#9CA3AF" : "#6B7280"}
            />
          )}
        </View>
      </Pressable>

      {/* --- MODAL DE SELECCIÓN --- */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="w-full max-w-md bg-white rounded-3xl p-5 border border-blue-100 max-h-[80%]">
            <Text className="text-lg font-extrabold text-slate-900 mb-4">
              Selecciona una promoción
            </Text>

            {loading ? (
              <View className="items-center py-6">
                <ActivityIndicator color="#2563EB" />
              </View>
            ) : products.length === 0 ? (
              <View className="py-4 items-center">
                <Text className="text-slate-500">No hay promociones activas para este negocio.</Text>
              </View>
            ) : (
              <FlatList
                data={products}
                keyExtractor={(item) => item.idProductoCustom.toString()}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 10 }}
              />
            )}

            <View className="mt-4">
              <Pressable
                className="py-3 rounded-2xl border border-slate-300 items-center bg-gray-50"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-slate-700 font-semibold">Cerrar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};