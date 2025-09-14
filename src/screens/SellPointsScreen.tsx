// src/screens/SellPointsScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View as RNView,
  Text as RNText,
  TextInput as RNTextInput,
  Pressable as RNPressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  Platform,
  ScrollView as RNScrollView,
  Switch,
  Image as RNImage,
} from "react-native";
import { styled } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "../presentation/context/AuthContext";
import { Business } from "../domain/entities/Business";
import { BusinessService } from "../application/services/BusinessService";
import { BusinessRepository } from "../infrastructure/repositories/BusinessRepository";
import { IBusinessService } from "../application/interfaces/IBusinessService";

const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const Pressable = styled(RNPressable);
const Safe = styled(SafeAreaView);
const KeyboardAvoidingView = styled(RNKeyboardAvoidingView);
const ScrollView = styled(RNScrollView);
const Image = styled(RNImage);

// ==== Helpers ====
const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(isNaN(n) ? 0 : n);
const onlyDigits = (s: string) => s.replace(/\D/g, "");

// ==== Mocks SOLO para cliente y venta (tu negocio ya viene de la API) ====
// (Puedes reemplazar estos dos por tus endpoints reales de cliente y venta)
async function fetchCustomerByPhone(phone: string): Promise<{ name: string; balance: number }> {
  await new Promise((r) => setTimeout(r, 600));
  // simula que todos tienen 0 saldo excepto este
  if (phone === "6441900765") return { name: "Cliente Paletita", balance: 10 };
  return { name: "Cliente", balance: 0 };
}
async function postTransaction(payload: {
  customerPhone: string;
  amount: number;
  applied: number;
  businessId: number;
  configId?: number | null;
  article?: string;
  description?: string;
}): Promise<{ ok: boolean; id: string }> {
  await new Promise((r) => setTimeout(r, 700));
  return { ok: true, id: "tx_" + Date.now() };
}

export default function SellPointsScreen() {
  const { user } = useAuth(); // ← usuario autenticado (de aquí obtenemos su teléfono)
  const service: IBusinessService = new BusinessService(new BusinessRepository());

  // ======== Estado del NEGOCIO (obtenido por teléfono del usuario autenticado) ========
  const [bizLoading, setBizLoading] = useState(true);
  const [bizError, setBizError] = useState<string | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);

  // variables derivadas (para usar al registrar la venta)
  const businessId = business?.id ?? 0;
  const configId = business?.configuracion?.id ?? null;
  const bizLogoUrl = business?.configuracion?.urlLogo ?? undefined;

  // porcentaje en UI
  // Tu backend guarda "3" para 3% (no 0.03). Convertimos a factor.
  const rawPct = business?.configuracion?.porcentajeVentas ?? 0;
  const pctFactor = rawPct >= 1 ? rawPct / 100 : rawPct; // defensivo

  // ======== Estado de CLIENTE y venta ========
  const [phone, setPhone] = useState(""); // teléfono del CLIENTE
  const [amount, setAmount] = useState("");
  const [article, setArticle] = useState("");
  const [description, setDescription] = useState("");

  const [customerName, setCustomerName] = useState<string | null>(null);
  const [customerBalance, setCustomerBalance] = useState<number>(0);

  const [wantsRedeem, setWantsRedeem] = useState(false);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  // ======== Cargar NEGOCIO al montar la pantalla ========
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!user?.telefono) {
          setBizError("No se encontró el teléfono del usuario autenticado.");
          setBizLoading(false);
          return;
        }
        const res = await service.getNegocioConfigByTelefono(user.telefono);
        if (!mounted) return;

        if (res.status !== 200 || !res.data) {
          setBizError(res.message || "No fue posible obtener el negocio.");
          setBizLoading(false);
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
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user?.telefono]);

  // Monto como número + cálculos (aplicar saldo del cliente)
  const amountNumber = useMemo(() => Number((amount || "0").replace(",", ".")) || 0, [amount]);
  const applied = wantsRedeem ? Math.min(customerBalance, amountNumber) : 0;
  const totalAfterRedeem = Math.max(0, amountNumber - applied);

  // Puntos ganados = total pagado * porcentaje negocio
  const earned = useMemo(() => totalAfterRedeem * pctFactor, [totalAfterRedeem, pctFactor]);

  // ======== Consultar CLIENTE ========
  const handleLookup = async () => {
    const p = onlyDigits(phone);
    if (p.length < 10) return Alert.alert("Teléfono inválido", "Ingresa al menos 10 dígitos.");
    try {
      setLoadingLookup(true);
      const res = await fetchCustomerByPhone(p);
      setCustomerName(res.name);
      setCustomerBalance(res.balance);
    } catch {
      Alert.alert("Error", "No se pudo consultar al cliente.");
    } finally {
      setLoadingLookup(false);
    }
  };

  // ======== Confirmar venta (a futuro envía a tu API real) ========
  const handleSubmit = async () => {
    const p = onlyDigits(phone);
    if (p.length < 10) return Alert.alert("Teléfono inválido", "Ingresa al menos 10 dígitos.");
    if (!(amountNumber > 0)) return Alert.alert("Monto inválido", "El monto debe ser mayor a 0.");
    if (!businessId) return Alert.alert("Negocio no disponible", "Vuelve a intentar más tarde.");

    try {
      setLoadingSubmit(true);
      const res = await postTransaction({
        customerPhone: p,
        amount: amountNumber,
        applied,
        businessId,
        configId,
        article: article.trim() || undefined,
        description: description.trim() || undefined,
      });
      if (res.ok) {
        Alert.alert(
          "Venta registrada",
          `ID: ${res.id}\nPagado: ${currency(totalAfterRedeem)}\nGanados: ${currency(earned)}`
        );
        // reset mínimos
        setAmount("");
        setArticle("");
        setDescription("");
        setWantsRedeem(false);
      } else {
        Alert.alert("Error", "No se pudo registrar la venta.");
      }
    } catch {
      Alert.alert("Error", "Falló el registro de la venta.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  // ======== Render ========
  return (
    <KeyboardAvoidingView className="flex-1 bg-blue-600" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Burbujas decorativas */}
      <View pointerEvents="none" className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-400/25" />
      <View pointerEvents="none" className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-blue-800/25" />

      <Safe className="flex-1 px-4">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingVertical: 12 }}>
          <View className="bg-white rounded-3xl p-6 border border-blue-100 shadow-2xl">
            {/* Header negocio */}
            {bizLoading ? (
              <View className="items-center py-6">
                <ActivityIndicator color="#1D4ED8" />
                <Text className="text-blue-800/70 mt-2">Cargando negocio…</Text>
              </View>
            ) : bizError ? (
              <View className="items-center py-4">
                <MaterialCommunityIcons name="store-alert-outline" size={28} color="#EF4444" />
                <Text className="text-red-600 mt-2 text-center">{bizError}</Text>
              </View>
            ) : (
              <View className="items-center mb-4">
                <View className="h-24 w-24 rounded-full bg-blue-50 border border-blue-100 overflow-hidden items-center justify-center mb-3">
                  {bizLogoUrl ? (
                    <Image source={{ uri: bizLogoUrl }} className="h-full w-full" resizeMode="cover" />
                  ) : (
                    <MaterialCommunityIcons name="storefront-outline" size={38} color="#2563EB" />
                  )}
                </View>
                <Text className="text-lg font-extrabold text-blue-700">
                  {business?.name ?? "Mi negocio"}
                </Text>
                <Text className="text-gray-500 mt-1 text-center">
                  {`Porcentaje de puntos por venta: ${(rawPct ?? 0).toString()}%`}
                </Text>
                {!!business?.direccion && (
                  <Text className="text-gray-400 text-xs mt-1 text-center">{business.direccion}</Text>
                )}
              </View>
            )}

            {/* Teléfono del CLIENTE */}
            <Text className="text-gray-500 mb-2">Número de teléfono del cliente (obligatorio)</Text>
            <View className="flex-row items-center rounded-2xl border border-gray-300 bg-white px-4 py-3">
              <MaterialCommunityIcons name="phone" size={20} color="#6B7280" />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="5512345678"
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-2 text-base text-gray-800"
                keyboardType="phone-pad"
                maxLength={16}
              />
              <Pressable
                onPress={handleLookup}
                className={`ml-2 px-3 py-2 rounded-xl ${loadingLookup ? "bg-blue-200" : "bg-blue-600"}`}
                disabled={loadingLookup || !!bizError || bizLoading}
              >
                {loadingLookup ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Consultar</Text>}
              </Pressable>
            </View>

            {customerName && (
              <View className="bg-blue-50 border border-blue-100 rounded-2xl p-3 mt-3">
                <Text className="text-blue-900 font-semibold">{customerName}</Text>
                <Text className="text-blue-700/70 mt-1">
                  Saldo disponible: <Text className="font-semibold">{currency(customerBalance)}</Text>
                </Text>
              </View>
            )}

            {/* Artículo */}
            <Text className="text-gray-500 mt-5 mb-2">Artículo</Text>
            <View className="rounded-2xl border border-gray-300 bg-white px-4 py-3">
              <TextInput
                value={article}
                onChangeText={setArticle}
                placeholder="Ej. Pizza grande"
                placeholderTextColor="#9CA3AF"
                className="text-base text-gray-800"
              />
            </View>

            {/* Monto */}
            <Text className="text-gray-500 mt-5 mb-2">Monto de la compra</Text>
            <View className="rounded-2xl border border-gray-300 bg-white px-4 py-3">
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                className="text-base text-gray-800"
                keyboardType="decimal-pad"
              />
            </View>

            {/* Descripción */}
            <Text className="text-gray-500 mt-5 mb-2">Descripción</Text>
            <View className="rounded-2xl border border-gray-300 bg-white px-4 py-3">
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Ej. Con refresco incluido"
                placeholderTextColor="#9CA3AF"
                className="text-base text-gray-800"
              />
            </View>

            {/* Switch aplicar saldo */}
            <View className="flex-row items-center justify-between mt-5">
              <Text className="text-gray-900 font-semibold">Aplicar puntos disponibles</Text>
              <Switch value={wantsRedeem} onValueChange={setWantsRedeem} />
            </View>

            {/* Resumen */}
            <View className="bg-[#0b1220] border border-[#1e293b] rounded-2xl p-4 mt-5">
              <Row label="Monto" value={currency(amountNumber)} />
              <Row label="Total puntos en dinero" value={currency(balance)} />
              <Row label="Monto aplicado" value={currency(totalAfterRedeem)} strong />
            </View>

            {/* Confirmar */}
            <Pressable
              onPress={handleSubmit}
              disabled={loadingSubmit || bizLoading || !!bizError}
              className={`mt-5 py-4 rounded-2xl items-center ${loadingSubmit ? "bg-blue-300" : "bg-green-500"}`}
            >
              {loadingSubmit ? (
                <ActivityIndicator color="#0b1220" />
              ) : (
                <Text className="text-[#0b1220] font-extrabold">Confirmar venta</Text>
              )}
            </Pressable>

          </View>
        </ScrollView>
      </Safe>
    </KeyboardAvoidingView>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="flex-row justify-between mt-2">
      <Text className="text-gray-300">{label}</Text>
      <Text className={`text-white ${strong ? "font-extrabold" : "font-semibold"}`}>{value}</Text>
    </View>
  );
}
