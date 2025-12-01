// src/presentation/screens/SellPoints/SellPointsScreen.tsx

import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  ActivityIndicator,
      View as RNView,
  Text as RNText,
  TextInput as RNTextInput, 
  Pressable as RNPressable, 
} from "react-native";
import { styled } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";

// === Arquitectura Limpia: Componentes y Hook ===
import { useSellPointsViewModel } from "./hooks/useSellPointsViewModel";
import { BusinessHeader } from "./components/BusinessHeader";
import { CustomerSearch } from "./components/CustomerSearch";
import { CartList } from "./components/CartList";
import { WhatsAppModal } from "./components/WhatsAppModal";
import { ProductPicker } from "./components/ProductPicker";
import { currency } from "./utils/sellHelpers";

const View = styled(RNView);
const Text = styled(RNText);
const Pressable = styled(RNPressable);
const TextInput = styled(RNTextInput);
// Componentes estlilizados básicos
const Safe = styled(SafeAreaView);
const KeyboardView = styled(KeyboardAvoidingView);

export default function SellPointsScreen() {
  // Extraemos todo el estado y las acciones del Hook
  const { state, actions } = useSellPointsViewModel();
  const {
    loading,
    error,
    business,
    customer,
    inputs,
    cart,
    totals,
    waModal,
    wantsRedeem,
    custom,
  } = state;

  // Determina si estamos en el flujo de producto personalizado
  const isCustomFlow = !!custom.selected;

  return (
    <KeyboardView
      className="flex-1 bg-blue-600"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* === Decoración de Fondo (Burbujas) === */}
      <View
        pointerEvents="none"
        className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-400/25"
      />
      <View
        pointerEvents="none"
        className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-blue-800/25"
      />

      <Safe className="flex-1 px-4">
        <View className="flex-1 bg-white rounded-3xl p-6 border border-blue-100 shadow-2xl mt-16">
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {/* 1. Encabezado del Negocio */}
            <BusinessHeader
              loading={loading.business}
              error={error}
              business={business}
            />

            {/* 2. Búsqueda de Cliente */}
            <CustomerSearch
              phone={inputs.phone}
              onChangePhone={actions.setPhone}
              onSearch={actions.handleLookup}
              loading={loading.lookup}
              userValid={customer.valid}
              customerName={customer.name}
              customerBalance={customer.balance}
              disabled={loading.business || !!error}
            />

            {/* 3. Selector de Promociones Custom (Solo si el negocio lo permite) */}
            {business?.configuracion?.permitirConfiguracionPersonalizada && (
              <View className="mt-5">
                <Text className="text-gray-500 mb-2">
                  Promoción personalizada (opcional)
                </Text>
                <ProductPicker
                  products={custom.products}
                  selectedProduct={custom.selected}
                  onSelect={(prod) => {
                    actions.setSelectedProduct(prod);
                    if (!prod) actions.setActionType(null);
                  }}
                  loading={loading.products}
                  disabled={!customer.valid}
                />

                {/* Botones de Acción para Promo Custom (Acumular / Canjear) */}
                {custom.selected && (
                  <View className="flex-row gap-3 mt-4">
                    <Pressable
                      onPress={() => actions.setActionType("acumular")}
                      className={`flex-1 py-3 rounded-2xl items-center border ${
                        custom.actionType === "acumular"
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300"
                      }`}
                    >
                      <Text
                        className={`font-semibold ${
                          custom.actionType === "acumular"
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        Acumular
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => actions.setActionType("canjear")}
                      className={`flex-1 py-3 rounded-2xl items-center border ${
                        custom.actionType === "canjear"
                          ? "bg-green-600 border-green-600"
                          : "border-gray-300"
                      }`}
                    >
                      <Text
                        className={`font-semibold ${
                          custom.actionType === "canjear"
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        Canjear
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            {/* 4. Formulario de Artículo / Monto / Cantidad */}
            <Text className="text-gray-500 mt-5 mb-2">Artículo</Text>
            <View className="rounded-2xl border border-gray-300 bg-white px-4 py-3">
              <TextInput
                value={inputs.article}
                onChangeText={actions.setArticle}
                placeholder="Ej. Pizza grande"
                placeholderTextColor="#9CA3AF"
                className="text-base text-gray-800"
              />
            </View>

            <View className="flex-row gap-3 mt-4">
              <View className="flex-1">
                <Text className="text-gray-500 mb-2">Cantidad</Text>
                <View className="rounded-2xl border border-gray-300 bg-white px-4 py-3">
                  <TextInput
                    value={inputs.qty}
                    onChangeText={actions.setQty}
                    keyboardType="decimal-pad"
                    placeholder="1"
                    className="text-base text-gray-800"
                  />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 mb-2">Monto Unitario</Text>
                <View className="rounded-2xl border border-gray-300 bg-white px-4 py-3">
                  <TextInput
                    value={inputs.amount}
                    onChangeText={actions.setAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    className="text-base text-gray-800"
                  />
                </View>
              </View>
            </View>

            <Text className="text-gray-500 mt-4 mb-2">Descripción (opcional)</Text>
            <View className="rounded-2xl border border-gray-300 bg-white px-4 py-3">
              <TextInput
                value={inputs.description}
                onChangeText={actions.setDescription}
                placeholder="Ej. Con refresco incluido"
                placeholderTextColor="#9CA3AF"
                className="text-base text-gray-800"
              />
            </View>

            {/* Botón Añadir al Carrito */}
            <View className="mt-4">
              <Pressable
                onPress={actions.addToCart}
                className="py-3 rounded-2xl items-center bg-blue-600"
              >
                <Text className="text-white font-extrabold">
                  Añadir al carrito
                </Text>
              </Pressable>
            </View>

            {/* 5. Lista del Carrito */}
            <CartList cart={cart} onRemove={actions.removeFromCart} />

            {/* 6. Switch para Canjear Puntos */}
            <View className="mt-5">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 font-semibold">
                  Aplicar cashback disponible
                </Text>
                <Switch
                  value={isCustomFlow ? false : wantsRedeem}
                  onValueChange={actions.setWantsRedeem}
                  disabled={isCustomFlow}
                />
              </View>
              {isCustomFlow && (
                <Text className="text-xs text-red-600 mt-1">
                  No disponible con promoción personalizada seleccionada.
                </Text>
              )}
            </View>

            {/* 7. Resumen de Totales */}
            <View className="bg-[#0b1220] border border-[#1e293b] rounded-2xl p-4 mt-5">
              <Row label="Monto" value={currency(totals.currentAmount)} />
              <Row
                label="Total cashback disponible"
                value={currency(totals.availableBalanceDisplay)} 
              />

              {/* Barra de progreso custom (si existe progreso) */}
              {custom.selected && customer.valid && (
                <View className="mt-3">
                  <Text className="text-gray-300 mb-2">
                    Avance de promoción{" "}
                    <Text className="text-gray-100 font-semibold">
                      ({custom.selected.nombreProducto})
                    </Text>
                  </Text>
                  <View className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-emerald-500"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, custom.progress?.porcentaje ?? 0)
                        )}%`,
                      }}
                    />
                  </View>
                  <Text className="text-gray-400 text-xs mt-1">
                    {custom.progress
                      ? `${custom.progress.porcentaje}% • ${custom.progress.estado}`
                      : "Sin progreso"}
                  </Text>
                </View>
              )}

              <Row
                label="Monto aplicado"
                value={currency(totals.appliedAmount)}
                strong
              />
              <Row
                label="Total a cobrar"
                value={currency(totals.totalToCharge)}
              />
            </View>

            {/* 8. Botones Finales (Confirmar / Limpiar) */}
            <View className="flex-row gap-3 mt-5">
<Pressable
                onPress={actions.handleSubmit}
                disabled={
                  loading.submit ||
                  loading.business ||
                  !!error ||
                  customer.valid !== true ||
                  cart.length === 0 || // <--- VALIDACIÓN NUEVA
                  (isCustomFlow && !custom.actionType)
                }
                className={`flex-1 py-4 rounded-2xl items-center ${
                  loading.submit ||
                  customer.valid !== true ||
                  cart.length === 0 || // <--- ESTILO GRIS SI ESTÁ VACÍO
                  (isCustomFlow && !custom.actionType)
                    ? "bg-blue-300" // O usa "bg-gray-300" si prefieres que se vea más deshabilitado
                    : "bg-green-500"
                }`}
              >
                {loading.submit ? (
                  <ActivityIndicator color="#0b1220" />
                ) : (
                  <Text className="text-[#0b1220] font-extrabold">
                    Confirmar
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={actions.clearForm}
                className="flex-0 py-4 px-4 rounded-2xl items-center bg-gray-200"
              >
                <Text className="text-gray-800 font-semibold">Limpiar</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Safe>

      {/* Modal de WhatsApp para confirmación final */}
      <WhatsAppModal
        visible={waModal.visible}
        context={waModal.context}
        onClose={actions.closeWaModal}
        onConfirm={actions.handleSendWhatsApp}
      />
    </KeyboardView>
  );
}

// Componente auxiliar local para filas de resumen
function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View className="flex-row justify-between mt-2">
      <Text className="text-gray-300">{label}</Text>
      <Text
        className={`text-white ${strong ? "font-extrabold" : "font-semibold"}`}
      >
        {value}
      </Text>
    </View>
  );
}