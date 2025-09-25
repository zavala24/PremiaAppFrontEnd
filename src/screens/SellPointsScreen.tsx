// src/screens/SellPointsScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Linking,
  Modal as RNModal,
} from "react-native";
import { styled } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "../presentation/context/AuthContext";
import { Business } from "../domain/entities/Business";
import { BusinessService } from "../application/services/BusinessService";
import { BusinessRepository } from "../infrastructure/repositories/BusinessRepository";
import { IBusinessService } from "../application/interfaces/IBusinessService";

import { UserService } from "../application/services/UserServices";
import { UserRepository } from "../infrastructure/repositories/UserRepository";
import { IUserService } from "../application/interfaces/IUserServices";
import { SellRepository } from "../infrastructure/repositories/SellRepository";
import { SellService } from "../application/services/SellServices";
import { ISellService } from "../application/interfaces/ISellService";
import { InsertSellPayload } from "../domain/entities/Sell";
import Toast from "react-native-toast-message";

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
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    isNaN(n) ? 0 : n
  );
const onlyDigits = (s: string) => s.replace(/\D/g, "");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Prefijo del país para WhatsApp (MX por defecto)
const DEFAULT_COUNTRY_CODE = "52";
const formatPhoneForWhatsApp = (raw: string) => {
  const digits = onlyDigits(raw);
  return digits.startsWith(DEFAULT_COUNTRY_CODE) ? digits : DEFAULT_COUNTRY_CODE + digits;
};

const buildWhatsAppMessage = ({
  businessName,
  customerName,
  article,
  amount,
  applied,
  total,
  saldoAntes,
  saldoDespues,
}: {
  businessName: string;
  customerName?: string | null;
  article?: string | null;
  amount: number;
  applied: number;
  total: number;
  saldoAntes: number;
  saldoDespues: number;
}) =>
  [
    `Hola ${customerName ?? ""} 👋`,
    ``,
    `Gracias por tu compra en *${businessName}*.`,
    ``,
    `🧾 *Detalle de la compra*`,
    `• Artículo: ${article?.trim() || "-"}`,
    `• Monto: ${currency(amount)}`,
    `• Puntos aplicados: ${currency(applied)}`,
    `• Total cobrado: ${currency(total)}`,
    ``,
    `💳 *Tus puntos*`,
    `• Saldo anterior: ${currency(saldoAntes)}`,
    `• Saldo actual: ${currency(saldoDespues)}`,
    ``,
    `¡Gracias por tu preferencia! 💙`,
  ].join("\n");

async function sendWhatsApp(toPhone: string, text: string) {
  const phone = formatPhoneForWhatsApp(toPhone);
  const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(text)}`;
  const can = await Linking.canOpenURL(url);
  if (can) await Linking.openURL(url);
  else await Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`);
}

type WaContext = {
  toPhone: string;
  businessName: string;
  customerName: string | null;
  article: string | null;
  amount: number;
  applied: number;
  total: number;
  saldoAntes: number;
  saldoDespues: number;
};

const MIN_LOOKUP_MS = 800; // <- tiempo mínimo para que se sienta la búsqueda

export default function SellPointsScreen() {
  const { user } = useAuth();
  const businessService: IBusinessService = new BusinessService(new BusinessRepository());
  const userService: IUserService = new UserService(new UserRepository());

  // ======== Estado del NEGOCIO ========
  const [bizLoading, setBizLoading] = useState(true);
  const [bizError, setBizError] = useState<string | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const businessId = business?.id ?? 0;
  const bizLogoUrl = business?.configuracion?.urlLogo ?? undefined;

  // ======== Estado de CLIENTE / Venta ========
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [article, setArticle] = useState("");
  const [description, setDescription] = useState("");

  const [customerName, setCustomerName] = useState<string | null>(null);
  const [customerBalance, setCustomerBalance] = useState<number>(0);

  const [userValid, setUserValid] = useState<boolean | null>(null);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [wantsRedeem, setWantsRedeem] = useState(false);

  // ===== Modal de WhatsApp =====
  const [waModalVisible, setWaModalVisible] = useState(false);
  const [waContext, setWaContext] = useState<WaContext | null>(null);

  // Timer para abrir modal tras el toast
  const waTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => () => waTimerRef.current && clearTimeout(waTimerRef.current), []);

  // Dots animados para "Buscando..."
  const [dots, setDots] = useState(0);
  useEffect(() => {
    if (!loadingLookup) {
      setDots(0);
      return;
    }
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 300);
    return () => clearInterval(id);
  }, [loadingLookup]);

  const repository = new SellRepository();
  const sellService: ISellService = new SellService(repository);

  // Cargar negocio
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user?.telefono) {
          setBizError("No se encontró el teléfono del usuario autenticado.");
          setBizLoading(false);
          return;
        }
        const res = await businessService.getNegocioConfigByTelefono(user.telefono);
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
    })();
    return () => {
      mounted = false;
    };
  }, [user?.telefono]);

  // Números / cálculos
  const amountNumber = useMemo(
    () => Number((amount || "0").replace(",", ".")) || 0,
    [amount]
  );
  const applied = wantsRedeem ? Math.min(customerBalance, amountNumber) : 0;
  const totalAfterRedeem = Math.max(0, amountNumber - applied);

  // ======== Consultar CLIENTE por teléfono ========
  const handleLookup = async () => {
    const p = onlyDigits(phone);
    if (p.length < 10) {
      Alert.alert("Teléfono inválido", "Ingresa al menos 10 dígitos.");
      return;
    }

    try {
      setLoadingLookup(true);
      setUserValid(null);

      // Garantiza un mínimo de 800ms de "buscando..."
      const started = Date.now();
      const { resp, user: u } = await userService.getUserByPhone(p);
      const elapsed = Date.now() - started;
      if (elapsed < MIN_LOOKUP_MS) await sleep(MIN_LOOKUP_MS - elapsed);

      if (resp.status === 201) {
        setCustomerName(u?.nombre ?? "Usuario");
        setCustomerBalance(Number(u?.puntosAcumulados ?? 0));
        setUserValid(true);
      } else {
        setCustomerName(null);
        setCustomerBalance(0);
        setUserValid(false);
      }
    } catch (e: any) {
      setCustomerName(null);
      setCustomerBalance(0);
      setUserValid(false);
      Alert.alert("Error", e?.message || "No se pudo validar el usuario.");
    } finally {
      setLoadingLookup(false);
    }
  };

  const onChangePhone = (v: string) => {
    setPhone(v);
    setUserValid(null);
  };

  // ===== util: limpiar formulario =====
  const clearForm = () => {
    setPhone("");
    setAmount("");
    setArticle("");
    setDescription("");
    setWantsRedeem(false);
    setCustomerName(null);
    setCustomerBalance(0);
    setUserValid(null);
  };

  // Confirmar venta
  const handleSubmit = async () => {
    if (userValid !== true) {
      Alert.alert("Usuario no válido", "Valida el usuario antes de continuar.");
      return;
    }
    const p = onlyDigits(phone);
    if (p.length < 10) {
      Alert.alert("Teléfono inválido", "Ingresa al menos 10 dígitos.");
      return;
    }
    if (!(amountNumber > 0)) {
      Alert.alert("Monto inválido", "El monto debe ser mayor a 0.");
      return;
    }
    if (!businessId) {
      Alert.alert("Negocio no disponible", "Vuelve a intentar más tarde.");
      return;
    }

    try {
      setLoadingSubmit(true);

      const payload: InsertSellPayload = {
        NegocioId: businessId,
        TelefonoCliente: p,
        CreadoPor: user?.telefono ?? "",
        Articulo: article.trim() || null,
        Descripcion: description.trim() || null,
        Monto: amountNumber,
        PuntosAplicados: wantsRedeem,
        TotalCobrado: totalAfterRedeem,
        SaldoAntes: customerBalance,
        SaldoDespues: customerBalance - (wantsRedeem ? Math.min(customerBalance, amountNumber) : 0),
      };

      const { resp, result } = await sellService.insertSellByUserPhoneNumber(payload);
      if (!resp.success) {
        Alert.alert("Error", resp.message || "No se pudo registrar la venta.");
        return;
      }

      const totalCobrado =
        typeof result?.totalCobrado === "number" ? result.totalCobrado : payload.TotalCobrado;
      const saldoDespues =
        typeof result?.saldoDespues === "number" ? result.saldoDespues : payload.SaldoDespues;

      // Guardar contexto para el modal
      setWaContext({
        toPhone: p,
        businessName: business?.name ?? "Mi negocio",
        customerName,
        article,
        amount: amountNumber,
        applied,
        total: totalCobrado,
        saldoAntes: customerBalance,
        saldoDespues: saldoDespues ?? 0,
      });

      Toast.show({
        type: "success",
        text1: resp.message || "¡Venta registrada con éxito!",
        position: "top",
        visibilityTime: 2000,
        autoHide: true,
      });

      // Abrir el modal manualmente a los 2s (sin depender de onHide)
      if (waTimerRef.current) clearTimeout(waTimerRef.current);
      waTimerRef.current = setTimeout(() => setWaModalVisible(true), 2000);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Falló el registro de la venta.");
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
                <Text className="text-lg font-extrabold text-blue-700">{business?.name ?? "Mi negocio"}</Text>
              </View>
            )}

            {/* Teléfono del CLIENTE */}
            <Text className="text-gray-500 mb-2">Número de teléfono del cliente (obligatorio)</Text>
            <View className="flex-row items-center rounded-2xl border border-gray-300 bg-white px-4 py-3">
              <MaterialCommunityIcons name="phone" size={20} color="#6B7280" />
              <TextInput
                value={phone}
                onChangeText={onChangePhone}
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

            {/* Indicador "Buscando…" */}
            {loadingLookup && (
              <View className="flex-row items-center mt-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100">
                <MaterialCommunityIcons name="magnify" size={18} color="#2563EB" />
                <Text className="ml-2 text-blue-800 font-medium">
                  Buscando usuario{".".repeat(dots)}
                </Text>
              </View>
            )}

            {/* Estado de validación */}
            {userValid !== null && !loadingLookup && (
              <Text className={`mt-2 ${userValid ? "text-green-600" : "text-red-600"}`}>
                {userValid ? "Usuario válido" : "Usuario no válido"}
              </Text>
            )}

            {/* Info breve del cliente */}
            {customerName && userValid && !loadingLookup && (
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
              <TextInput value={article} onChangeText={setArticle} placeholder="Ej. Pizza grande" placeholderTextColor="#9CA3AF" className="text-base text-gray-800" />
            </View>

            {/* Monto */}
            <Text className="text-gray-500 mt-5 mb-2">Monto de la compra</Text>
            <View className="rounded-2xl border border-gray-300 bg-white px-4 py-3">
              <TextInput value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor="#9CA3AF" className="text-base text-gray-800" keyboardType="decimal-pad" />
            </View>

            {/* Descripción */}
            <Text className="text-gray-500 mt-5 mb-2">Descripción</Text>
            <View className="rounded-2xl border border-gray-300 bg-white px-4 py-3">
              <TextInput value={description} onChangeText={setDescription} placeholder="Ej. Con refresco incluido" placeholderTextColor="#9CA3AF" className="text-base text-gray-800" />
            </View>

            {/* Switch aplicar saldo */}
            <View className="flex-row items-center justify-between mt-5">
              <Text className="text-gray-900 font-semibold">Aplicar puntos disponibles</Text>
              <Switch value={wantsRedeem} onValueChange={setWantsRedeem} />
            </View>

            {/* Resumen */}
            <View className="bg-[#0b1220] border border-[#1e293b] rounded-2xl p-4 mt-5">
              <Row label="Monto" value={currency(amountNumber)} />
              <Row label="Total puntos en dinero" value={currency(customerBalance)} />
              <Row label="Monto aplicado" value={currency(totalAfterRedeem)} strong />
            </View>

            {/* Confirmar */}
            <Pressable
              onPress={handleSubmit}
              disabled={loadingSubmit || bizLoading || !!bizError || userValid !== true}
              className={`mt-5 py-4 rounded-2xl items-center ${loadingSubmit || userValid !== true ? "bg-blue-300" : "bg-green-500"}`}
            >
              {loadingSubmit ? <ActivityIndicator color="#0b1220" /> : <Text className="text-[#0b1220] font-extrabold">Confirmar venta</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </Safe>

      {/* ===== Modal Bonito WhatsApp ===== */}
      <RNModal visible={waModalVisible} animationType="fade" transparent onRequestClose={() => setWaModalVisible(false)}>
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="w-full max-w-md bg-white rounded-3xl p-5 border border-blue-100">
            <View className="items-center mb-3">
              <View className="h-12 w-12 rounded-full bg-green-100 items-center justify-center">
                <MaterialCommunityIcons name="whatsapp" size={28} color="#16a34a" />
              </View>
              <Text className="text-xl font-extrabold text-slate-900 mt-3">Enviar por WhatsApp</Text>
              <Text className="text-slate-600 mt-1 text-center">
                ¿Quieres enviar el comprobante de la venta al cliente por WhatsApp?
              </Text>
            </View>

            <View className="flex-row gap-3 mt-4">
              <Pressable
                className="flex-1 py-3 rounded-2xl border border-slate-300 items-center"
                onPress={() => {
                  setWaModalVisible(false);
                  clearForm(); // ← limpia en NO
                }}
              >
                <Text className="text-slate-700 font-semibold">NO</Text>
              </Pressable>

              <Pressable
                className="flex-1 py-3 rounded-2xl items-center bg-green-500"
                onPress={async () => {
                  if (waContext) {
                    const msg = buildWhatsAppMessage({
                      businessName: waContext.businessName,
                      customerName: waContext.customerName,
                      article: waContext.article,
                      amount: waContext.amount,
                      applied: waContext.applied,
                      total: waContext.total,
                      saldoAntes: waContext.saldoAntes,
                      saldoDespues: waContext.saldoDespues,
                    });
                    await sendWhatsApp(waContext.toPhone, msg);
                  }
                  setWaModalVisible(false);
                  clearForm(); // ← limpia en SÍ
                }}
              >
                <Text className="text-white font-extrabold">SÍ</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </RNModal>
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
