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

/* === Productos custom === */
import { ProductosCustomRepository } from "../infrastructure/repositories/ProductosCustomRepository";
import { ProductosCustomService } from "../application/services/ProductosCustomService";
import type { IProductosCustomService } from "../application/interfaces/IProductosCustomService";
import type {
  ProductoCustom,
  AcumularProgresoCustomRequest,
  CanjearProgresoCustomRequest,
  GetProgresoCustomParams,
  ProgresoCustomDto,
} from "../application/interfaces/IProductosCustomService";

const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const Pressable = styled(RNPressable);
const Safe = styled(SafeAreaView);
const KeyboardAvoidingView = styled(RNKeyboardAvoidingView);
const ScrollView = styled(RNScrollView);
const Image = styled(RNImage);

/* ========================= Helpers ========================= */
const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    isNaN(n) ? 0 : n
  );

const onlyDigits = (s: string) => s.replace(/\D/g, "");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Sanitiza teléfono: sólo dígitos */
const sanitizePhone = (raw: string) => onlyDigits(raw);

/** Sanitiza monto: dígitos + un solo punto decimal (opcional) */
const sanitizeAmount = (raw: string) => {
  const cleaned = raw.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length <= 2) return cleaned;
  return `${parts[0]}.${parts.slice(1).join("")}`;
};

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

const MIN_LOOKUP_MS = 800;

/* ========================= Screen ========================= */
export default function SellPointsScreen() {
  const { user } = useAuth();
  const businessService: IBusinessService = new BusinessService(new BusinessRepository());
  const userService: IUserService = new UserService(new UserRepository());

  // ======== Estado del NEGOCIO ========
  const [bizLoading, setBizLoading] = useState(true);
  const [bizError, setBizError] = useState<string | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const businessId = business?.idNegocio ?? 0;
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

  // Dots animados para "Buscando…"
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

  /* === productos custom service === */
  const productosService: IProductosCustomService = new ProductosCustomService(
    new ProductosCustomRepository()
  );

  // === estado de UI para custom products ===
  const permitirCustom = business?.configuracion?.permitirConfiguracionPersonalizada === true;
  const [customProducts, setCustomProducts] = useState<ProductoCustom[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<ProductoCustom | null>(null);
  const [productPickerOpen, setProductPickerOpen] = useState(false);

  // Cantidad: admite decimales
  const [qty, setQty] = useState<string>("1");
  const qtyNumber = useMemo(() => {
    const n = Number((qty || "1").replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [qty]);

  // acción: acumular o canjear
  const [actionType, setActionType] = useState<"acumular" | "canjear" | null>(null);

  const isCustomFlow = !!selectedProduct;

  // === PROGRESO CUSTOM (UI local) ===
  const [progressLoading, setProgressLoading] = useState(false);
  const [progress, setProgress] = useState<ProgresoCustomDto | null>(null);

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

  // Cargar productos custom si está habilitado
  useEffect(() => {
    const usuarioNombre =
      (user as any)?.usuarioNombre || (user as any)?.username || user?.telefono || "";
    if (!permitirCustom || !usuarioNombre || !businessId) {
      setCustomProducts([]);
      setSelectedProduct(null);
      setActionType(null);
      return;
    }
    (async () => {
      try {
        setLoadingProducts(true);
        const { resp, data } = await productosService.getProductosByNegocio(businessId);
        if (resp.status === 200 && Array.isArray(data))
          setCustomProducts(data.filter((p) => p.estado));
        else setCustomProducts([]);
      } catch {
        setCustomProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    })();
  }, [permitirCustom, user?.telefono, businessId]);

  // Números / cálculos
  const amountNumber = useMemo(
    () => Number((amount || "0").replace(",", ".")) || 0,
    [amount]
  );
  const applied = isCustomFlow ? 0 : wantsRedeem ? Math.min(customerBalance, amountNumber) : 0;
  const totalAfterRedeem = Math.max(0, amountNumber - applied);

  // Consultar CLIENTE por teléfono
  const handleLookup = async () => {
    const p = onlyDigits(phone);
    if (p.length < 10) {
      Toast.show({
        type: "error",
        text1: "Teléfono inválido, ingresa 10 dígitos.",
        position: "top",
        visibilityTime: 2000,
      });
      return;
    }

    try {
      setLoadingLookup(true);
      setUserValid(null);

      const started = Date.now();
      const { resp, user: u } = await userService.GetUserPuntosByPhoneNumber(
        p,
        business?.idNegocio ?? 0
      );
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

  /* ===== Inputs controlados ===== */
  const onChangePhone = (v: string) => {
    setPhone((prev) => {
      const digits = sanitizePhone(v);
      if (digits.length <= 10) return digits;
      return prev;
    });
    // Reset de validación y progreso cuando cambie el teléfono
    setUserValid(null);
    setProgress(null);
  };

  const onChangeAmount = (v: string) => {
    setAmount(sanitizeAmount(v));
  };

  const clearForm = () => {
    setPhone("");
    setAmount("");
    setArticle("");
    setDescription("");
    setWantsRedeem(false);
    setCustomerName(null);
    setCustomerBalance(0);
    setUserValid(null);
    setSelectedProduct(null);
    setActionType(null);
    setQty("1");
    setProgress(null);
  };

  // ====== Submit ======
  const handleSubmit = async () => {
    if (userValid !== true) {
      Alert.alert("Usuario no válido", "Valida el usuario antes de continuar.");
      return;
    }
    const p = onlyDigits(phone);
    if (p.length !== 10) {
      Toast.show({
        type: "error",
        text1: "Teléfono inválido, ingresa 10 dígitos.",
        position: "top",
        visibilityTime: 2000,
      });
      return;
    }
    if (!(amountNumber > 0)) {
      Toast.show({
        type: "error",
        text1: "Monto inválido, el monto debe ser mayor a 0.",
        position: "top",
        visibilityTime: 2000,
      });
      return;
    }
    if (!businessId) {
      Toast.show({
        type: "error",
        text1: "Negocio no disponible.",
        position: "top",
        visibilityTime: 2000,
      });
      return;
    }

    try {
      setLoadingSubmit(true);

      // === FLUJO PERSONALIZADO ===
      if (isCustomFlow && selectedProduct) {
        const usuarioNombre =
          (user as any)?.usuarioNombre || (user as any)?.username || user?.telefono || "";
        if (!usuarioNombre) {
          Toast.show({
            type: "error",
            text1: "No se encontró el usuario para operar la promoción.",
            position: "top",
            visibilityTime: 2000,
          });
          setLoadingSubmit(false);
          return;
        }
        if (!actionType) {
          Toast.show({
            type: "error",
            text1: "Selecciona si deseas acumular o canjear la promoción.",
            position: "top",
            visibilityTime: 2000,
          });
          setLoadingSubmit(false);
          return;
        }

        const reqBase = {
          usuario: usuarioNombre,
          usuarioOperacion: user?.telefono ?? usuarioNombre,
          telefonoCliente: p,
          idProductoCustom: selectedProduct.idProductoCustom,
          cantidad: qtyNumber,
          monto: amountNumber,
          descripcion: description?.trim() || null,
          idNegocio: businessId,
        };

        if (actionType === "acumular") {
          const { resp } = await productosService.acumularProgresoCustom(
            reqBase as AcumularProgresoCustomRequest
          );
          if (!resp?.success) {
            Toast.show({
              type: "error",
              text1: resp?.message || "No se pudo acumular el progreso.",
              position: "top",
              visibilityTime: 2000,
            });
            setLoadingSubmit(false);
            return;
          }
          Toast.show({
            type: "success",
            text1: "Progreso acumulado correctamente.",
            position: "top",
            visibilityTime: 2000,
          });
        } else if (actionType === "canjear") {
          const { resp } = await productosService.canjearProgresoCustom(
            reqBase as CanjearProgresoCustomRequest
          );
          if (!resp?.success) {
            Toast.show({
              type: "error",
              text1: resp?.message || "No se pudo canjear la promoción.",
              position: "top",
              visibilityTime: 2000,
            });
            setLoadingSubmit(false);
            return;
          }
          Toast.show({
            type: "success",
            text1: "Promoción canjeada correctamente.",
            position: "top",
            visibilityTime: 2000,
          });
        }

        clearForm();
        setLoadingSubmit(false);
        return;
      }

      // === FLUJO NORMAL ===
      const payload: InsertSellPayload = {
        NegocioId: businessId,
        TelefonoCliente: p,
        CreadoPor: user?.telefono ?? "",
        Articulo: article.trim() || null,
        Descripcion: description.trim() || null,
        Monto: amountNumber, // precio unitario
        Cantidad: qtyNumber, // cantidad decimal
        PuntosAplicados: wantsRedeem,
        TotalCobrado: Math.max(
          0,
          amountNumber - (wantsRedeem ? Math.min(customerBalance, amountNumber) : 0)
        ),
        SaldoAntes: customerBalance,
        SaldoDespues:
          customerBalance - (wantsRedeem ? Math.min(customerBalance, amountNumber) : 0),
      };

      const { resp, result } = await sellService.insertSellByUserPhoneNumber(payload);
      if (!resp.success) {
        Toast.show({
          type: "error",
          text1: "No se pudo registrar la venta.",
          position: "top",
          visibilityTime: 2000,
        });
        setLoadingSubmit(false);
        return;
      }

      const totalCobrado =
        typeof result?.totalCobrado === "number" ? result.totalCobrado : payload.TotalCobrado;
      const saldoDespues =
        typeof result?.saldoDespues === "number" ? result.saldoDespues : payload.SaldoDespues;

      setWaContext({
        toPhone: p,
        businessName: business?.name ?? "Mi negocio",
        customerName,
        article: payload.Articulo || article,
        amount: amountNumber,
        applied: wantsRedeem ? Math.min(customerBalance, amountNumber) : 0,
        total: totalCobrado ?? 0,
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

      if (waTimerRef.current) clearTimeout(waTimerRef.current);
      waTimerRef.current = setTimeout(() => setWaModalVisible(true), 2000);
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Falló el registro.",
        position: "top",
        visibilityTime: 2000,
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  /* ==== Sincroniza ARTÍCULO con la promoción seleccionada ==== */
  useEffect(() => {
    if (selectedProduct) setArticle(selectedProduct.nombreProducto);
  }, [selectedProduct]);

  /* ==== Trae PROGRESO cuando: hay promo seleccionada + teléfono válido + negocio ==== */
  useEffect(() => {
    const p = onlyDigits(phone);
    if (!selectedProduct || userValid !== true || p.length !== 10 || !businessId) {
      setProgress(null);
      return;
    }
    const run = async () => {
      try {
        setProgressLoading(true);
        const params: GetProgresoCustomParams = {
          idNegocio: businessId,
          telefonoCliente: p,
          idProductoCustom: selectedProduct.idProductoCustom,
        };
        const { resp, data } = await productosService.getProgresoCustom(params);
        if (!resp?.status || resp.status >= 400) {
          setProgress(null);
          return;
        }
        setProgress(data ?? null);
      } catch {
        setProgress(null);
      } finally {
        setProgressLoading(false);
      }
    };
    run();
  }, [selectedProduct, userValid, phone, businessId]);

  /* ========================= Render ========================= */
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-blue-600"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Burbujas (fijas) */}
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
            className="flex-1"
          >
            {/* Header negocio */}
            {bizLoading ? (
              <View className="items-center py-6">
                <ActivityIndicator color="#1D4ED8" />
                <Text className="text-blue-800/70 mt-2">Cargando negocio…</Text>
              </View>
            ) : bizError ? (
              <View className="items-center py-4">
                <MaterialCommunityIcons
                  name="store-alert-outline"
                  size={28}
                  color="#EF4444"
                />
                <Text className="text-red-600 mt-2 text-center">{bizError}</Text>
              </View>
            ) : (
              <View className="items-center mb-4">
                <View className="h-24 w-24 rounded-full bg-blue-50 border border-blue-100 overflow-hidden items-center justify-center mb-3">
                  {bizLogoUrl ? (
                    <Image
                      source={{ uri: bizLogoUrl }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="storefront-outline"
                      size={38}
                      color="#2563EB"
                    />
                  )}
                </View>
                <Text className="text-lg font-extrabold text-blue-700">
                  {business?.name ?? "Mi negocio"}
                </Text>
              </View>
            )}

            {/* Teléfono del CLIENTE */}
            <Text className="text-gray-500 mb-2">
              Número de teléfono del cliente (obligatorio)
            </Text>

            {/* Row: icono + input + botón */}
            <View className="flex-row items-center rounded-2xl border border-gray-300 bg-white px-4 py-3">
              <MaterialCommunityIcons
                name="phone"
                size={20}
                color="#6B7280"
                style={{ marginRight: 8 }}
              />
              <TextInput
                value={phone}
                onChangeText={onChangePhone}
                placeholder="5512345678"
                placeholderTextColor="#9CA3AF"
                className="flex-1 text-base text-gray-800 mr-3"
                style={{
                  paddingVertical: 0,
                  ...(Platform.OS === "android"
                    ? { textAlignVertical: "center" as const }
                    : null),
                }}
                keyboardType="number-pad"
                inputMode="numeric"
                textContentType="telephoneNumber"
                autoComplete="tel"
                autoCorrect={false}
                maxLength={10}
                returnKeyType="done"
              />
              <Pressable
                onPress={handleLookup}
                className={`ml-3 px-4 py-2 rounded-xl ${
                  loadingLookup ? "bg-blue-200" : "bg-blue-600"
                } shrink-0`}
                disabled={loadingLookup || !!bizError || bizLoading}
              >
                {loadingLookup ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">Buscar</Text>
                )}
              </Pressable>
            </View>

            {loadingLookup && (
              <View className="flex-row items-center mt-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100">
                <MaterialCommunityIcons name="magnify" size={18} color="#2563EB" />
                <Text className="ml-2 text-blue-800 font-medium">
                  Buscando usuario{".".repeat(dots)}
                </Text>
              </View>
            )}

            {userValid !== null && !loadingLookup && (
              <Text className={`mt-2 ${userValid ? "text-green-600" : "text-red-600"}`}>
                {userValid ? "Usuario válido" : "Usuario no válido"}
              </Text>
            )}

            {customerName && userValid && !loadingLookup && (
              <View className="bg-blue-50 border border-blue-100 rounded-2xl p-3 mt-3">
                <Text className="text-blue-900 font-semibold">{customerName}</Text>
                <Text className="text-blue-700/70 mt-1">
                  Saldo disponible:{" "}
                  <Text className="font-semibold">{currency(customerBalance)}</Text>
                </Text>
              </View>
            )}

            {/* === Promoción personalizada (opcional) === */}
            {permitirCustom && (
              <View className="mt-5">
                <Text className="text-gray-500 mb-2">Promoción personalizada (opcional)</Text>

                {/* Dropdown "fake": press -> modal con lista */}
                <Pressable
                  onPress={() => (userValid ? setProductPickerOpen(true) : null)}
                  className={`rounded-2xl border px-4 py-3 flex-row items-center justify-between ${
                    userValid ? "bg-white border-gray-300" : "bg-gray-100 border-gray-200"
                  }`}
                  disabled={!userValid}
                >
                  <View className="flex-1 flex-row items-center justify-between">
                    <Text
                      className={`text-base ${
                        selectedProduct ? "text-gray-900" : userValid ? "text-gray-400" : "text-gray-400"
                      }`}
                    >
                      {selectedProduct
                        ? selectedProduct.nombreProducto
                        : loadingProducts
                        ? "Cargando promociones..."
                        : userValid
                        ? customProducts.length
                          ? "Selecciona una promoción"
                          : "No hay promociones"
                        : "Valida el teléfono para habilitar"}
                    </Text>

                    {/* Quitar promo */}
                    {selectedProduct ? (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(null);
                          setActionType(null);
                          setArticle("");
                          setWantsRedeem(false);
                          setProgress(null);
                        }}
                        className="ml-3 p-1 rounded-full bg-red-100"
                      >
                        <MaterialCommunityIcons name="close" size={18} color="#DC2626" />
                      </Pressable>
                    ) : (
                      <MaterialCommunityIcons
                        name="chevron-down"
                        size={22}
                        color={userValid ? "#6B7280" : "#9CA3AF"}
                      />
                    )}
                  </View>
                </Pressable>

                {/* Lista en modal */}
                <RNModal
                  visible={productPickerOpen}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setProductPickerOpen(false)}
                >
                  <View className="flex-1 bg-black/60 items-center justify-center px-6">
                    <View className="w-full max-w-md bg-white rounded-3xl p-5 border border-blue-100">
                      <Text className="text-lg font-extrabold text-slate-900">
                        Selecciona una promoción
                      </Text>
                      <View className="mt-3 max-h-80">
                        {loadingProducts ? (
                          <View className="items-center py-6">
                            <ActivityIndicator color="#2563EB" />
                          </View>
                        ) : customProducts.length === 0 ? (
                          <Text className="text-slate-500 mt-2">
                            No hay promociones disponibles.
                          </Text>
                        ) : (
                          customProducts.map((p) => (
                            <Pressable
                              key={p.idProductoCustom}
                              onPress={() => {
                                setSelectedProduct(p);
                                setArticle(p.nombreProducto);
                                setProductPickerOpen(false);
                              }}
                              className="py-3 px-3 rounded-xl border border-slate-200 mb-2"
                            >
                              <Text className="font-semibold text-slate-800">
                                {p.nombreProducto}
                              </Text>
                              <Text className="text-slate-500 text-xs mt-1">
                                Tipo: {p.tipoAcumulacion} · Meta: {p.meta} · % x compra:{" "}
                                {p.porcentajePorCompra}%
                              </Text>
                              {p.recompensa ? (
                                <Text className="text-emerald-600 text-xs mt-1">
                                  Recompensa: {p.recompensa}
                                </Text>
                              ) : null}
                            </Pressable>
                          ))
                        )}
                      </View>

                      <View className="flex-row gap-3 mt-3">
                        <Pressable
                          className="flex-1 py-3 rounded-2xl border border-slate-300 items-center"
                          onPress={() => setProductPickerOpen(false)}
                        >
                          <Text className="text-slate-700 font-semibold">Cerrar</Text>
                        </Pressable>
                        {selectedProduct && (
                          <Pressable
                            className="flex-1 py-3 rounded-2xl items-center bg-blue-600"
                            onPress={() => setProductPickerOpen(false)}
                          >
                            <Text className="text-white font-extrabold">Usar</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </View>
                </RNModal>

                {/* Selector de acción si hay producto */}
                {selectedProduct && (
                  <View className="flex-row gap-3 mt-4">
                    <Pressable
                      onPress={() => setActionType("acumular")}
                      className={`flex-1 py-3 rounded-2xl items-center border ${
                        actionType === "acumular"
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300"
                      }`}
                    >
                      <Text
                        className={`font-semibold ${
                          actionType === "acumular" ? "text-white" : "text-gray-700"
                        }`}
                      >
                        Acumular
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setActionType("canjear")}
                      className={`flex-1 py-3 rounded-2xl items-center border ${
                        actionType === "canjear"
                          ? "bg-green-600 border-green-600"
                          : "border-gray-300"
                      }`}
                    >
                      <Text
                        className={`font-semibold ${
                          actionType === "canjear" ? "text-white" : "text-gray-700"
                        }`}
                      >
                        Canjear
                      </Text>
                    </Pressable>
                  </View>
                )}
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

            {/* Cantidad (decimales) */}
            <Text className="text-gray-500 mt-5 mb-2">Cantidad</Text>
            <View className="rounded-2xl border border-gray-300 bg-white px-4 py-3">
              <TextInput
                value={qty}
                onChangeText={(v) => {
                  // permite vaciar mientras se edita
                  let s = v.replace(/,/g, ".").replace(/[^0-9.]/g, "");
                  const parts = s.split(".");
                  if (parts.length > 2) s = `${parts[0]}.${parts.slice(1).join("")}`;
                  setQty(s);
                }}
                onBlur={() => {
                  const n = Number((qty || "").replace(",", "."));
                  if (!Number.isFinite(n) || n <= 0) setQty("1");
                }}
                placeholder="1"
                placeholderTextColor="#9CA3AF"
                className="text-base text-gray-800"
                keyboardType="decimal-pad"
                inputMode="decimal"
              />
            </View>

            {/* Monto */}
            <Text className="text-gray-500 mt-5 mb-2">Monto de la compra</Text>
            <View className="rounded-2xl border border-gray-300 bg-white px-4 py-3">
              <TextInput
                value={amount}
                onChangeText={onChangeAmount}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                className="text-base text-gray-800"
                keyboardType="decimal-pad"
                inputMode="decimal"
                autoCorrect={false}
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
            <View className="mt-5">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 font-semibold">Aplicar puntos disponibles</Text>
                <Switch
                  value={isCustomFlow ? false : wantsRedeem}
                  onValueChange={(v) => {
                    if (isCustomFlow) return;
                    setWantsRedeem(v);
                  }}
                  disabled={isCustomFlow}
                />
              </View>
              {isCustomFlow && (
                <Text className="text-xs text-red-600 mt-1">
                  No disponible cuando hay una promoción personalizada seleccionada.
                </Text>
              )}
            </View>

            {/* Resumen */}
            <View className="bg-[#0b1220] border border-[#1e293b] rounded-2xl p-4 mt-5">
              <Row label="Monto" value={currency(amountNumber)} />
              <Row label="Total puntos en dinero" value={currency(customerBalance)} />

              {/* ===== Avance de promoción (solo si hay promo seleccionada y usuario válido) ===== */}
              {selectedProduct && userValid && (
                <View className="mt-3">
                  <Text className="text-gray-300 mb-2">
                    Avance de promoción{" "}
                    <Text className="text-gray-100 font-semibold">
                      ({selectedProduct.nombreProducto})
                    </Text>
                  </Text>

                  <View className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                    {/* barra */}
                    <View
                      className="h-full bg-emerald-500"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, progress?.porcentaje ?? 0)
                        )}%`,
                      }}
                    />
                  </View>

                  <View className="flex-row justify-between mt-2">
                    <Text className="text-gray-400 text-xs">
                      {progressLoading
                        ? "Cargando avance…"
                        : progress
                        ? `${progress.porcentaje}% • ${progress.estado}`
                        : "Sin progreso"}
                    </Text>
                    {progress?.ultimaActualizacion ? (
                      <Text className="text-gray-400 text-xs">
                        {new Date(progress.ultimaActualizacion).toLocaleString("es-MX")}
                      </Text>
                    ) : null}
                  </View>
                </View>
              )}

              <Row label="Monto aplicado" value={currency(totalAfterRedeem)} strong />
            </View>

            {/* Confirmar */}
            <Pressable
              onPress={handleSubmit}
              disabled={
                loadingSubmit ||
                bizLoading ||
                !!bizError ||
                userValid !== true ||
                (isCustomFlow && !actionType)
              }
              className={`mt-5 py-4 rounded-2xl items-center ${
                loadingSubmit || userValid !== true || (isCustomFlow && !actionType)
                  ? "bg-blue-300"
                  : "bg-green-500"
              }`}
            >
              {loadingSubmit ? (
                <ActivityIndicator color="#0b1220" />
              ) : (
                <Text className="text-[#0b1220] font-extrabold">Confirmar</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </Safe>

      {/* Modal WhatsApp (solo flujo normal) */}
      <RNModal
        visible={waModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setWaModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="w-full max-w-md bg-white rounded-3xl p-5 border border-blue-100">
            <View className="items-center mb-3">
              <View className="h-12 w-12 rounded-full bg-green-100 items-center justify-center">
                <MaterialCommunityIcons name="whatsapp" size={28} color="#16a34a" />
              </View>
              <Text className="text-xl font-extrabold text-slate-900">
                Enviar por WhatsApp
              </Text>
              <Text className="text-slate-600 mt-1 text-center">
                ¿Quieres enviar el comprobante de la venta al cliente por WhatsApp?
              </Text>
            </View>

            <View className="flex-row gap-3 mt-4">
              <Pressable
                className="flex-1 py-3 rounded-2xl border border-slate-300 items-center"
                onPress={() => {
                  setWaModalVisible(false);
                  clearForm();
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
                  clearForm();
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
      <Text className={`text-white ${strong ? "font-extrabold" : "font-semibold"}`}>
        {value}
      </Text>
    </View>
  );
}
