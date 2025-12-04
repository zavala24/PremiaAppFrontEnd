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
const Safe = styled(SafeAreaView);
const KeyboardView = styled(KeyboardAvoidingView);

export default function SellPointsScreen() {
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

  const isCustomFlow = !!custom.selected;

  return (
    <View className="flex-1 bg-blue-600">
      {/* Decoración de Fondo */}
      <View
        pointerEvents="none"
        className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-400/25"
      />
      <View
        pointerEvents="none"
        className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-blue-800/25"
      />

      <Safe className="flex-1" edges={['top', 'left', 'right']}>
        {/* 1. Header "Nueva Venta"
           Agregamos padding top y margin para asegurar que esté debajo de la hamburguesa.
        */}
        <View className="h-16 justify-center items-center relative z-10 mt-2">
            <Text className="text-white text-xl font-extrabold tracking-wider shadow-sm uppercase">
                Nueva Venta
            </Text>
        </View>

        {/* 2. KeyboardAvoidingView 
           Configuración robusta para que los inputs suban.
        */}
        <KeyboardView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          {/* Tarjeta Blanca Principal con bordes superiores redondeados */}
          <View className="flex-1 bg-slate-50 rounded-t-[32px] overflow-hidden shadow-2xl border-t border-white/20">
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              // 3. Padding Bottom Generoso (150) para asegurar scroll final
              contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 150 }}
            >
              {/* 1. Encabezado del Negocio */}
              <BusinessHeader
                loading={loading.business}
                error={error}
                business={business}
              />

              {/* 2. Búsqueda de Cliente */}
              <View className="mt-6">
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
              </View>

              {/* 3. Selector de Promociones Custom */}
              {business?.configuracion?.permitirConfiguracionPersonalizada && (
                <View className="mt-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <Text className="text-slate-500 font-bold mb-3 text-xs uppercase tracking-wide">
                    Promoción personalizada (Opcional)
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

                  {custom.selected && (
                    <View className="flex-row gap-3 mt-4">
                      <Pressable
                        onPress={() => actions.setActionType("acumular")}
                        className={`flex-1 py-3 rounded-xl items-center border-2 transition-all ${
                          custom.actionType === "acumular"
                            ? "bg-blue-50 border-blue-600"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        <Text
                          className={`font-bold ${
                            custom.actionType === "acumular"
                              ? "text-blue-700"
                              : "text-slate-500"
                          }`}
                        >
                          Acumular
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => actions.setActionType("canjear")}
                        className={`flex-1 py-3 rounded-xl items-center border-2 transition-all ${
                          custom.actionType === "canjear"
                            ? "bg-green-50 border-green-600"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        <Text
                          className={`font-bold ${
                            custom.actionType === "canjear"
                              ? "text-green-700"
                              : "text-slate-500"
                          }`}
                        >
                          Canjear
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}

              {/* SECCIÓN DETALLES DE VENTA */}
              <Text className="text-slate-800 font-bold text-lg mt-8 mb-4">
                Detalles de Venta
              </Text>

              {/* 4. Formulario de Artículo / Monto / Cantidad */}
              <View className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                  {/* Artículo */}
                  <View>
                    <Text className="text-slate-500 font-bold text-xs uppercase mb-1 ml-1">Artículo</Text>
                    <View className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
                        <TextInput
                        value={inputs.article}
                        onChangeText={actions.setArticle}
                        placeholder="Ej. Pizza grande"
                        placeholderTextColor="#94A3B8"
                        className="text-base text-slate-800 font-medium"
                        />
                    </View>
                  </View>

                  <View className="flex-row gap-4">
                    {/* Cantidad */}
                    <View className="flex-1">
                        <Text className="text-slate-500 font-bold text-xs uppercase mb-1 ml-1">Cantidad</Text>
                        <View className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
                            <TextInput
                                value={inputs.qty}
                                onChangeText={actions.setQty}
                                keyboardType="decimal-pad"
                                placeholder="1"
                                placeholderTextColor="#94A3B8"
                                className="text-base text-slate-800 font-medium text-center"
                            />
                        </View>
                    </View>
                    {/* Monto */}
                    <View className="flex-1">
                        <Text className="text-slate-500 font-bold text-xs uppercase mb-1 ml-1">Monto Unitario</Text>
                        <View className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
                            <TextInput
                                value={inputs.amount}
                                onChangeText={actions.setAmount}
                                keyboardType="decimal-pad"
                                placeholder="$0.00"
                                placeholderTextColor="#94A3B8"
                                className="text-base text-slate-800 font-medium text-right"
                            />
                        </View>
                    </View>
                  </View>

                  {/* Descripción */}
                  <View>
                    <Text className="text-slate-500 font-bold text-xs uppercase mb-1 ml-1">Notas (Opcional)</Text>
                    <View className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
                        <TextInput
                        value={inputs.description}
                        onChangeText={actions.setDescription}
                        placeholder="Ej. Sin cebolla"
                        placeholderTextColor="#94A3B8"
                        className="text-base text-slate-800 font-medium"
                        />
                    </View>
                  </View>

                  {/* Botón Añadir al Carrito */}
                  <Pressable
                    onPress={actions.addToCart}
                    className="bg-blue-600 py-3.5 rounded-xl items-center shadow-lg shadow-blue-200 active:bg-blue-700 mt-2"
                  >
                    <Text className="text-white font-bold text-base">
                        Añadir al carrito
                    </Text>
                  </Pressable>
              </View>

              {/* 5. Lista del Carrito */}
              <View className="mt-6">
                 <CartList cart={cart} onRemove={actions.removeFromCart} />
              </View>

              {/* 6. Switch para Canjear Puntos */}
              <View className="mt-6 flex-row items-center justify-between bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <View className="flex-1 mr-4">
                    <Text className="text-slate-800 font-bold text-base">
                        Canjear cashback
                    </Text>
                    <Text className="text-slate-500 text-xs mt-0.5">
                        Usa el saldo disponible del cliente
                    </Text>
                    {isCustomFlow && (
                        <Text className="text-xs text-orange-500 mt-1 font-medium">
                        No disponible en promo personalizada
                        </Text>
                    )}
                </View>
                <Switch
                  value={isCustomFlow ? false : wantsRedeem}
                  onValueChange={actions.setWantsRedeem}
                  disabled={isCustomFlow}
                  trackColor={{ false: "#CBD5E1", true: "#2563EB" }}
                  thumbColor={"#FFFFFF"}
                />
              </View>

              {/* 7. Resumen de Totales - DARK CARD */}
              <View className="bg-slate-900 rounded-[24px] p-6 mt-6 shadow-xl relative overflow-hidden">
                {/* Decorative gradients */}
                <View className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -mr-10 -mt-10" />
                
                <Row label="Subtotal" value={currency(totals.currentAmount)} />
                <Row
                  label="Cashback disponible"
                  value={currency(totals.availableBalanceDisplay)} 
                  color="text-emerald-400"
                />

                {custom.selected && customer.valid && (
                  <View className="my-4 bg-white/5 p-3 rounded-xl border border-white/10">
                    <Text className="text-slate-300 text-xs mb-2">
                      Avance: <Text className="text-white font-bold">{custom.selected.nombreProducto}</Text>
                    </Text>
                    <View className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-blue-500"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, custom.progress?.porcentaje ?? 0)
                          )}%`,
                        }}
                      />
                    </View>
                    <Text className="text-slate-400 text-[10px] mt-1 text-right">
                      {custom.progress
                        ? `${custom.progress.porcentaje}% completado`
                        : "0%"}
                    </Text>
                  </View>
                )}

                <View className="h-[1px] bg-slate-700 my-4" />

                <Row
                  label="Descuento aplicado"
                  value={`- ${currency(totals.appliedAmount)}`}
                  color="text-orange-400"
                />
                
                <View className="flex-row justify-between items-end mt-2">
                    <Text className="text-slate-400 font-medium">Total a Cobrar</Text>
                    <Text className="text-white text-3xl font-black">
                        {currency(totals.totalToCharge)}
                    </Text>
                </View>
              </View>

              {/* 8. Botones Finales */}
              <View className="flex-row gap-4 mt-8 mb-4">
                <Pressable
                  onPress={actions.clearForm}
                  className="flex-1 py-4 rounded-2xl items-center bg-slate-100 active:bg-slate-200"
                >
                  <Text className="text-slate-600 font-bold text-base">Limpiar</Text>
                </Pressable>

                <Pressable
                  onPress={actions.handleSubmit}
                  disabled={
                    loading.submit ||
                    loading.business ||
                    !!error ||
                    customer.valid !== true ||
                    cart.length === 0 || 
                    (isCustomFlow && !custom.actionType)
                  }
                  className={`flex-[2] py-4 rounded-2xl items-center shadow-lg ${
                    loading.submit ||
                    customer.valid !== true ||
                    cart.length === 0 || 
                    (isCustomFlow && !custom.actionType)
                      ? "bg-slate-300 shadow-none"
                      : "bg-blue-600 shadow-blue-300"
                  }`}
                >
                  {loading.submit ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className={`font-bold text-base ${
                        loading.submit || customer.valid !== true || cart.length === 0
                        ? "text-slate-500" 
                        : "text-white"
                    }`}>
                      Confirmar Venta
                    </Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardView>
      </Safe>

      <WhatsAppModal
        visible={waModal.visible}
        context={waModal.context}
        onClose={actions.closeWaModal}
        onConfirm={actions.handleSendWhatsApp}
      />
    </View>
  );
}

function Row({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View className="flex-row justify-between mb-2">
      <Text className="text-slate-400 font-medium">{label}</Text>
      <Text
        className={`font-bold text-base ${color ?? "text-white"}`}
      >
        {value}
      </Text>
    </View>
  );
}