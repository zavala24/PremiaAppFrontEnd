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

/* ======== NUEVO: WhatsApp con bloque de promoción (opcional) ======== */
const buildWhatsAppMessage = ({
  businessName,
  customerName,
  article,
  amount,
  applied,
  total,
  saldoAntes,
  saldoDespues,
  // <<< nuevo >>>
  isCustom = false,
  promoNombre,
  accion,
  porcentaje,
  estado,
  cantidadPromo,
  cartItems,
}: {
  businessName: string;
  customerName?: string | null;
  article?: string | null;
  amount: number;
  applied: number;
  total: number;
  saldoAntes: number;
  saldoDespues: number;
  // custom
  isCustom?: boolean;
  promoNombre?: string | null;
  accion?: "acumular" | "canjear" | null;
  porcentaje?: number | null;
  estado?: string | null;
  cantidadPromo?: number | null;
  cartItems?: { articulo?: string | null; cantidad: number; monto: number }[];
}) => {
  const base = [
    `Hola ${customerName ?? ""} 👋`,
    ``,
    `Gracias por tu compra en *${businessName}*.`,
    ``,
    `🧾 *Detalle de la compra*`,
  ];

  if (cartItems && cartItems.length) {
    cartItems.forEach((it, i) => {
      base.push(`• ${i + 1}. ${it.articulo ?? "-"} x ${it.cantidad} = ${currency(it.monto * it.cantidad)}`);
    });
    base.push("", `• Subtotal: ${currency(amount)}`);
  } else {
    base.push(
      `• Artículo: ${article?.trim() || "-"}`,
      `• Monto: ${currency(amount)}`
    );
  }

  base.push(`• Puntos aplicados: ${currency(applied)}`, `• Total cobrado: ${currency(total)}`, ``);

  if (isCustom) {
    base.push(
      ``,
      `🎯 *Promoción personalizada*`,
      `• Promoción: ${promoNombre ?? "-"}`,
      `• Acción: ${accion === "canjear" ? "Canjeado" : "Acumulado"}`,
      ...(typeof cantidadPromo === "number" ? [`• Cantidad: ${cantidadPromo}`] : []),
      ...(typeof porcentaje === "number" || estado
        ? [`• Avance: ${porcentaje ?? 0}%${estado ? ` • ${estado}` : ""}`]
        : [])
    );
  }

  base.push("", "¡Gracias por tu preferencia! 💙");
  return base.join("\n");
};

async function sendWhatsApp(toPhone: string, text: string) {
  const phone = formatPhoneForWhatsApp(toPhone);
  const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(text)}`;
  const can = await Linking.canOpenURL(url);
  if (can) await Linking.openURL(url);
  else await Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`);
}

/* ======== TYPES LOCALES (para el carrito y insertMany) ======== */
type CartItem = {
  id: string; // local id
  articulo: string;
  descripcion?: string | null;
  monto: number; // unitario
  cantidad: number;
};

type InsertManySellsPayload = {
  TelefonoCliente: string;
  NegocioId: number;
  CreadoPor: string;
  Ventas: {
    Articulo?: string | null;
    Descripcion?: string | null;
    Monto: number;
    Cantidad: number;
    PuntosAplicados: boolean;
    SaldoAntes: number;
  }[];
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

  // carrito
  const [cart, setCart] = useState<CartItem[]>([]);

  // ===== Modal de WhatsApp =====
  const [waModalVisible, setWaModalVisible] = useState(false);
  const [waContext, setWaContext] = useState<any | null>(null);

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

  // ======= CALCULOS DEL CARRITO =======
  const cartSubtotal = useMemo(() => {
    return cart.reduce((s, it) => s + it.monto * it.cantidad, 0);
  }, [cart]);

  // Si el carrito está vacío usamos el campo amount como monto único (legacy)
  const displayedSubtotal = cart.length > 0 ? cartSubtotal : Number((amount || "0").replace(",", ".")) || 0;

  // applied = puntos aplicados cuando switch ON (aplica sobre el subtotal mostrado)
  const appliedAmount = useMemo(() => {
    if (!wantsRedeem) return 0;
    return Math.min(customerBalance, displayedSubtotal);
  }, [wantsRedeem, customerBalance, displayedSubtotal]);

  const totalToCharge = Math.max(0, displayedSubtotal - appliedAmount);

  // Números / cálculos (legacy kept)
  const amountNumber = useMemo(
    () => Number((amount || "0").replace(",", ".")) || 0,
    [amount]
  );

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

  const clearFormAndCart = () => {
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
    setCart([]);
  };

  // ====== CARRITO: agregar, eliminar ======
  const addToCart = () => {
    // Validaciones mínimas
    if (userValid !== true) {
      Alert.alert("Usuario no válido", "Valida el usuario antes de añadir al carrito.");
      return;
    }
    const mont = Number((amount || "0").replace(",", "."));
    if (!(mont > 0)) {
      Toast.show({ type: "error", text1: "Monto inválido", position: "top", visibilityTime: 1600 });
      return;
    }
    const cant = Number((qty || "1").replace(",", "."));
    if (!Number.isFinite(cant) || cant <= 0) {
      Toast.show({ type: "error", text1: "Cantidad inválida", position: "top", visibilityTime: 1600 });
      return;
    }
    if (!article.trim()) {
      Toast.show({ type: "error", text1: "Agrega el nombre del artículo", position: "top", visibilityTime: 1600 });
      return;
    }

    const newItem: CartItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      articulo: article.trim(),
      descripcion: description.trim() || null,
      monto: mont,
      cantidad: cant,
    };

    setCart((prev) => [...prev, newItem]);

    // limpiar inputs de item (pero mantener teléfono/cliente)
    setArticle("");
    setDescription("");
    setAmount("");
    setQty("1");
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((it) => it.id !== id));
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

    // determine amount to validate > 0: use displayedSubtotal
    if (!(displayedSubtotal > 0)) {
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

      // === FLUJO PERSONALIZADO (si se seleccionó un producto personalizado) ===
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

        let ok = false;
        if (actionType === "acumular") {
          const { resp } = await productosService.acumularProgresoCustom(
            reqBase as AcumularProgresoCustomRequest
          );
          ok = !!resp?.success;
        } else if (actionType === "canjear") {
          const { resp } = await productosService.canjearProgresoCustom(
            reqBase as CanjearProgresoCustomRequest
          );
          ok = !!resp?.success;
        }

        if (!ok) {
          Toast.show({
            type: "error",
            text1: "No se pudo registrar la operación.",
            position: "top",
            visibilityTime: 2000,
          });
          setLoadingSubmit(false);
          return;
        }

        // Traer progreso actualizado para el mensaje
        let porcentaje: number | null = null;
        let estado: string | null = null;
        try {
          const params: GetProgresoCustomParams = {
            idNegocio: businessId,
            telefonoCliente: p,
            idProductoCustom: selectedProduct.idProductoCustom,
          };
          const { data } = await productosService.getProgresoCustom(params);
          porcentaje = data?.porcentaje ?? null;
          estado = data?.estado ?? null;
        } catch {
          // ignore
        }

        Toast.show({
          type: "success",
          text1: actionType === "canjear" ? "Promoción canjeada." : "Progreso acumulado.",
          position: "top",
          visibilityTime: 2000,
        });

        setWaContext({
          toPhone: p,
          businessName: business?.name ?? "Mi negocio",
          customerName,
          article: selectedProduct.nombreProducto,
          amount: amountNumber,
          applied: 0,
          total: amountNumber,
          saldoAntes: customerBalance,
          saldoDespues: customerBalance,
          isCustom: true,
          promoNombre: selectedProduct.nombreProducto,
          accion: actionType,
          porcentaje,
          estado,
          cantidadPromo: qtyNumber,
          cartItems: [],
        });

        if (waTimerRef.current) clearTimeout(waTimerRef.current);
        waTimerRef.current = setTimeout(() => setWaModalVisible(true), 1200);

        setLoadingSubmit(false);
        return;
      }

      // === FLUJO MULTI-VENTAS si cart.length > 0 ===
      if (cart.length > 0) {
        // Construir payload InsertManySellsPayload
        const ventas = cart.map((it) => ({
          Articulo: it.articulo || null,
          Descripcion: it.descripcion || null,
          Monto: it.monto,
          Cantidad: it.cantidad,
          PuntosAplicados: wantsRedeem, // aplicamos flag por item (backend puede decidir)
          SaldoAntes: customerBalance,
        }));

        const payload: InsertManySellsPayload = {
          TelefonoCliente: p,
          NegocioId: businessId,
          CreadoPor: user?.telefono ?? "",
          Ventas: ventas,
        };

        const { resp, result } = await (sellService as any).insertManySellsByUserPhoneNumber(
          payload
        );

        if (!resp?.success) {
          Toast.show({
            type: "error",
            text1: "No se pudieron registrar las ventas.",
            position: "top",
            visibilityTime: 2000,
          });
          setLoadingSubmit(false);
          return;
        }

        // build whatsapp context from cart
        setWaContext({
          toPhone: p,
          businessName: business?.name ?? "Mi negocio",
          customerName,
          article: null,
          amount: displayedSubtotal,
          applied: appliedAmount,
          total: totalToCharge,
          saldoAntes: customerBalance,
          saldoDespues: Math.max(0, customerBalance - appliedAmount),
          cartItems: cart.map((c) => ({ articulo: c.articulo, cantidad: c.cantidad, monto: c.monto })),
        });

        Toast.show({
          type: "success",
          text1: resp.message || "Ventas registradas con éxito.",
          position: "top",
          visibilityTime: 2000,
        });

        if (waTimerRef.current) clearTimeout(waTimerRef.current);
        waTimerRef.current = setTimeout(() => setWaModalVisible(true), 1200);

        setLoadingSubmit(false);
        return;
      }

      // === FLUJO NORMAL cuando no hay carrito ===
      const payloadSingle: InsertSellPayload = {
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

      const { resp, result } = await sellService.insertSellByUserPhoneNumber(payloadSingle);
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
        typeof result?.totalCobrado === "number" ? result.totalCobrado : payloadSingle.TotalCobrado;
      const saldoDespues =
        typeof result?.saldoDespues === "number" ? result.saldoDespues : payloadSingle.SaldoDespues;

      setWaContext({
        toPhone: p,
        businessName: business?.name ?? "Mi negocio",
        customerName,
        article: payloadSingle.Articulo || article,
        amount: amountNumber,
        applied: wantsRedeem ? Math.min(customerBalance, amountNumber) : 0,
        total: totalCobrado ?? 0,
        saldoAntes: customerBalance,
        saldoDespues: saldoDespues ?? 0,
        cartItems: [],
      });

      Toast.show({
        type: "success",
        text1: resp.message || "¡Venta registrada con éxito!",
        position: "top",
        visibilityTime: 2000,
        autoHide: true,
      });

      if (waTimerRef.current) clearTimeout(waTimerRef.current);
      waTimerRef.current = setTimeout(() => setWaModalVisible(true), 1200);
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
            <Text className="text-gray-500 mt-5 mb-2">Monto unitario</Text>
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
            <Text className="text-gray-500 mt-5 mb-2">Descripción (opcional)</Text>
            <View className="rounded-2xl border border-gray-300 bg-white px-4 py-3">
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Ej. Con refresco incluido"
                placeholderTextColor="#9CA3AF"
                className="text-base text-gray-800"
              />
            </View>

            {/* Botón añadir al carrito */}
            <View className="mt-4">
              <Pressable
                onPress={addToCart}
                className="py-3 rounded-2xl items-center bg-blue-600"
              >
                <Text className="text-white font-extrabold">Añadir al carrito</Text>
              </Pressable>
            </View>

            {/* Cart list */}
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
                        <Text className="text-xs text-slate-500">
                          {it.descripcion ?? ""}
                        </Text>
                        <Text className="text-xs text-slate-600 mt-1">
                          {it.cantidad} × {currency(it.monto)} = {currency(it.monto * it.cantidad)}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => removeFromCart(it.id)}
                        className="ml-3 p-2 rounded-full bg-red-100"
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#DC2626" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Switch aplicar saldo */}
            <View className="mt-5">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 font-semibold">Aplicar cashback disponibles</Text>
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
              <Row label="Monto" value={currency(displayedSubtotal)} />
              <Row label="Total cashback" value={currency(customerBalance)} />
              {selectedProduct && userValid && (
                <View className="mt-3">
                  <Text className="text-gray-300 mb-2">
                    Avance de promoción{" "}
                    <Text className="text-gray-100 font-semibold">
                      ({selectedProduct.nombreProducto})
                    </Text>
                  </Text>

                  <View className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-emerald-500"
                      style={{
                        width: `${Math.max(0, Math.min(100, progress?.porcentaje ?? 0))}%`,
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

              <Row label="Monto aplicado" value={currency(appliedAmount)} strong />
              <Row label="Total a cobrar" value={currency(totalToCharge)} />
            </View>

            {/* Acción: Confirmar o Limpiar carrito */}
            <View className="flex-row gap-3 mt-5">
              <Pressable
                onPress={() => {
                  // Confirmar -> submit
                  handleSubmit();
                }}
                disabled={
                  loadingSubmit ||
                  bizLoading ||
                  !!bizError ||
                  userValid !== true ||
                  (isCustomFlow && !actionType)
                }
                className={`flex-1 py-4 rounded-2xl items-center ${
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

              <Pressable
                onPress={() => {
                  // limpiar sólo el carrito y campos de item
                  setCart([]);
                  setArticle("");
                  setAmount("");
                  setQty("1");
                  setDescription("");
                }}
                className="flex-0 py-4 px-4 rounded-2xl items-center bg-gray-200"
              >
                <Text className="text-gray-800 font-semibold">Limpiar carrito</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Safe>

      {/* Modal WhatsApp (ahora para ambos flujos) */}
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
                ¿Quieres enviar el comprobante al cliente por WhatsApp?
              </Text>
            </View>

            <View className="max-h-64 mb-3 overflow-y-auto">
              {/* resumen rápido en el modal */}
              <View className="mb-2">
                {waContext?.cartItems && waContext.cartItems.length ? (
                  waContext.cartItems.map((it: any, i: number) => (
                    <View key={i} className="flex-row justify-between py-1">
                      <Text className="text-slate-700">{`${i + 1}. ${it.articulo} x ${it.cantidad}`}</Text>
                      <Text className="text-slate-700">{currency(it.monto * it.cantidad)}</Text>
                    </View>
                  ))
                ) : waContext?.article ? (
                  <View className="flex-row justify-between py-1">
                    <Text className="text-slate-700">{waContext.article}</Text>
                    <Text className="text-slate-700">{currency(waContext.amount)}</Text>
                  </View>
                ) : (
                  <Text className="text-slate-500">Sin detalles</Text>
                )}
              </View>

              <View className="flex-row justify-between mt-2">
                <Text className="text-slate-700">Subtotal</Text>
                <Text className="text-slate-700">{currency(waContext?.amount ?? displayedSubtotal)}</Text>
              </View>
              <View className="flex-row justify-between mt-2">
                <Text className="text-slate-700">Cashback aplicados</Text>
                <Text className="text-slate-700">{currency(waContext?.applied ?? appliedAmount)}</Text>
              </View>
              <View className="flex-row justify-between mt-2">
                <Text className="font-extrabold">Total</Text>
                <Text className="font-extrabold">{currency(waContext?.total ?? totalToCharge)}</Text>
              </View>
            </View>

            <View className="flex-row gap-3 mt-4">
              <Pressable
                className="flex-1 py-3 rounded-2xl border border-slate-300 items-center"
                onPress={() => {
                  setWaModalVisible(false);
                  // después de NO → limpiar formulario y carrito si se enviaron (porque ya se hizo el submit)
                  clearFormAndCart();
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
                      // custom
                      isCustom: waContext.isCustom,
                      promoNombre: waContext.promoNombre,
                      accion: waContext.accion ?? null,
                      porcentaje: waContext.porcentaje ?? null,
                      estado: waContext.estado ?? null,
                      cantidadPromo: waContext.cantidadPromo ?? null,
                      cartItems: waContext.cartItems ?? [],
                    });
                    await sendWhatsApp(waContext.toPhone, msg);
                  }
                  setWaModalVisible(false);
                  clearFormAndCart();
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
