import { useState, useEffect, useMemo, useRef } from "react";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";
import { useAuth } from "../../../presentation/context/AuthContext";

// Services
import { BusinessService } from "../../../application/services/BusinessService";
import { BusinessRepository } from "../../../infrastructure/repositories/BusinessRepository";
import { UserService } from "../../../application/services/UserServices";
import { UserRepository } from "../../../infrastructure/repositories/UserRepository";
import { SellRepository } from "../../../infrastructure/repositories/SellRepository";
import { SellService } from "../../../application/services/SellServices";
import { ProductosCustomService } from "../../../application/services/ProductosCustomService";
import { ProductosCustomRepository } from "../../../infrastructure/repositories/ProductosCustomRepository";

import { CartItem, WhatsAppContext } from "../types";
import { onlyDigits, sanitizeAmount, buildWhatsAppMessage, sendWhatsApp } from "../utils/sellHelpers";

const fixMoney = (n: number) => Math.round(n * 100) / 100;

export const useSellPointsViewModel = () => {
  const { user } = useAuth();

  // Instancias de Servicios
  const businessService = useMemo(() => new BusinessService(new BusinessRepository()), []);
  const userService = useMemo(() => new UserService(new UserRepository()), []);
  const sellService = useMemo(() => new SellService(new SellRepository()), []);
  const productosService = useMemo(() => new ProductosCustomService(new ProductosCustomRepository()), []);

  // UI State
  const [loading, setLoading] = useState({ business: true, lookup: false, submit: false, products: false });
  const [error, setError] = useState<string | null>(null);

  // Business Data
  const [business, setBusiness] = useState<any>(null);
  const [customProducts, setCustomProducts] = useState<any[]>([]);
  const [customer, setCustomer] = useState<{ name: string | null; balance: number; valid: boolean | null }>({
    name: null, balance: 0, valid: null
  });

  // Inputs
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [article, setArticle] = useState("");
  const [description, setDescription] = useState("");
  const [qty, setQty] = useState("1");
  
  const qtyNumber = useMemo(() => {
    const n = Number(qty.replace(",", "."));
    return isFinite(n) && n > 0 ? n : 1;
  }, [qty]);

  // Logic Flags
  const [wantsRedeem, setWantsRedeem] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Custom Product Logic
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"acumular" | "canjear" | null>(null);
  const [progress, setProgress] = useState<any | null>(null);

  // WhatsApp
  const [waModalVisible, setWaModalVisible] = useState(false);
  const [waContext, setWaContext] = useState<WhatsAppContext | null>(null);
  const waTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- EFECTOS ---
  useEffect(() => {
    let mounted = true;
    const fetchBusiness = async () => {
        if (!user?.telefono) return;
        try {
            const res = await businessService.getNegocioConfigByTelefono(user.telefono);
            if (!mounted) return;
            if (res.status === 200 && res.data) setBusiness(res.data);
            else setError(res.message || "Error cargando negocio");
        } catch (e: any) { if(mounted) setError(e.message); } 
        finally { if(mounted) setLoading(prev => ({ ...prev, business: false })); }
    };
    fetchBusiness();
    return () => { mounted = false; };
  }, [user?.telefono]);

  useEffect(() => {
    if (!business?.configuracion?.permitirConfiguracionPersonalizada || !business?.idNegocio) return;
    const loadProducts = async () => {
        setLoading(prev => ({ ...prev, products: true }));
        try {
            const { resp, data } = await productosService.getProductosByNegocio(business.idNegocio);
            if (resp.status === 200 && Array.isArray(data)) setCustomProducts(data.filter((p) => p.estado));
        } catch {} 
        finally { setLoading(prev => ({ ...prev, products: false })); }
    };
    loadProducts();
  }, [business]);

  useEffect(() => {
    if (selectedProduct) {
        setArticle(selectedProduct.nombreProducto);
        if (customer.valid && phone.length === 10) {
            // Traer progreso para mostrarlo visualmente
            const fetchProgress = async () => {
                try {
                    const params = { idNegocio: business.idNegocio, telefonoCliente: onlyDigits(phone), idProductoCustom: selectedProduct.idProductoCustom };
                    const { data } = await productosService.getProgresoCustom(params);
                    setProgress(data ?? null);
                } catch { setProgress(null); }
            };
            fetchProgress();
        }
    } else {
        setProgress(null);
    }
  }, [selectedProduct, customer.valid]); 

  // --- ACTIONS ---
  const handleLookup = async () => {
    const p = onlyDigits(phone);
    if (p.length < 10) return Toast.show({ type: "error", text1: "Teléfono inválido" });
    setLoading(prev => ({ ...prev, lookup: true }));
    setCustomer(prev => ({ ...prev, valid: null }));

    try {
        const { resp, user: u } = await userService.GetUserPuntosByPhoneNumber(p, business?.idNegocio ?? 0);
        if (resp.status === 201) setCustomer({ name: u?.nombre ?? "Usuario", balance: Number(u?.puntosAcumulados ?? 0), valid: true });
        else setCustomer({ name: null, balance: 0, valid: false });
    } catch (e: any) {
        setCustomer({ name: null, balance: 0, valid: false });
        Alert.alert("Error", e.message);
    } finally {
        setLoading(prev => ({ ...prev, lookup: false }));
    }
  };

  const addToCart = () => {
    if (customer.valid !== true) return Alert.alert("Error", "Valida usuario primero");
    const m = fixMoney(Number(amount.replace(",", ".")));
    if (!(m > 0) && !selectedProduct) return Toast.show({ type: "error", text1: "Monto inválido" });
    if (!article.trim()) return Toast.show({ type: "error", text1: "Ingresa el artículo" });

    // Si es custom, DEBE tener acción seleccionada
    if (selectedProduct && !actionType) {
        return Toast.show({ type: "error", text1: "Selecciona Acumular o Canjear" });
    }

    const newItem: CartItem = {
        id: Date.now().toString(),
        articulo: article.trim(),
        descripcion: description.trim() || null,
        monto: m,
        cantidad: qtyNumber,
        esCustom: !!selectedProduct,
        idProductoCustom: selectedProduct?.idProductoCustom ?? null,
        customAction: selectedProduct ? actionType : null // <--- GUARDAMOS LA ACCIÓN AQUÍ
    };

    setCart(prev => [...prev, newItem]);
    
    // Reset inputs
    setArticle(""); setDescription(""); setAmount(""); setQty("1");
    setSelectedProduct(null); setActionType(null);
  };

  const handleSubmit = async () => {
    const p = onlyDigits(phone);
    if (p.length !== 10 || customer.valid !== true) return Toast.show({ type: "error", text1: "Verifica usuario/teléfono" });
    if (cart.length === 0) return Toast.show({ type: "error", text1: "Carrito vacío" });

    // Validar monto solo si no son puras cosas gratis/custom
    const cartSubtotal = cart.reduce((s, i) => s + (i.monto * i.cantidad), 0);
    const displayedSubtotal = fixMoney(cartSubtotal);
    
    // Si el total es 0, permitimos continuar SOLO si hay items custom (ej. canjeo gratis)
    const hasCustomItems = cart.some(i => i.esCustom);
    if (displayedSubtotal <= 0 && !hasCustomItems) {
        return Toast.show({ type: "error", text1: "Monto inválido" });
    }

    const appliedAmount = wantsRedeem ? Math.min(customer.balance, displayedSubtotal) : 0;
    const totalToCharge = fixMoney(Math.max(0, displayedSubtotal - appliedAmount));
    const saldoDespues = fixMoney(customer.balance - appliedAmount);

    setLoading(prev => ({ ...prev, submit: true }));

    try {
        // 1. REGISTRAR VENTA MONETARIA / HISTORIAL
        // ----------------------------------------------------
        const payload = {
            TelefonoCliente: p,
            NegocioId: business.idNegocio,
            CreadoPor: user?.telefono ?? "",
            Ventas: cart.map(it => ({
                Articulo: it.articulo,
                Descripcion: it.descripcion,
                Monto: it.monto,
                Cantidad: it.cantidad,
                PuntosAplicados: wantsRedeem, 
                SaldoAntes: customer.balance,
                EsCustom: it.esCustom ?? false,
                IdProductoCustom: it.idProductoCustom ?? null,
                CustomAccion: it.customAction // Enviamos esto al back por si acaso
            }))
        };

        const { resp } = await (sellService as any).insertManySellsByUserPhoneNumber(payload);
        if (!resp?.success) throw new Error("Error registrando ventas");

        // 2. PROCESAR LÓGICA DE PUNTOS CUSTOM (Recuperada)
        // ----------------------------------------------------
        // Iteramos el carrito y llamamos a los servicios individuales
        const customPromises = cart
            .filter(it => it.esCustom && it.idProductoCustom) // Solo items custom
            .map(async (it) => {
                const reqBase = {
                    usuario: (user as any)?.usuarioNombre ?? "App",
                    usuarioOperacion: user?.telefono ?? "",
                    telefonoCliente: p,
                    idProductoCustom: it.idProductoCustom!,
                    cantidad: it.cantidad,
                    monto: it.monto,
                    descripcion: it.descripcion,
                    idNegocio: business.idNegocio
                };

                if (it.customAction === "acumular") {
                    // Ignoramos errores individuales para no bloquear el flujo completo, pero idealmente se loguean
                    return productosService.acumularProgresoCustom(reqBase as any).catch(e => console.log("Error acumular", e));
                } else if (it.customAction === "canjear") {
                    return productosService.canjearProgresoCustom(reqBase as any).catch(e => console.log("Error canjear", e));
                }
            });

        // Esperamos a que todas las operaciones custom terminen
        if (customPromises.length > 0) {
            await Promise.all(customPromises);
        }

        // 3. ÉXITO FINAL
        setWaContext({
            toPhone: p, businessName: business?.name, customerName: customer.name,
            article: null, amount: displayedSubtotal, applied: appliedAmount,
            total: totalToCharge, saldoAntes: customer.balance,
            saldoDespues: saldoDespues,
            cartItems: cart.map(c => ({ 
                articulo: c.articulo + (c.esCustom ? ` (${c.customAction})` : ""), 
                cantidad: c.cantidad, 
                monto: c.monto 
            }))
        });

        Toast.show({ type: "success", text1: "Venta registrada correctamente" });
        waTimerRef.current = setTimeout(() => setWaModalVisible(true), 1200);

    } catch (e: any) {
        Toast.show({ type: "error", text1: e.message || "Fallo el registro" });
    } finally {
        setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  const clearForm = () => {
    setPhone(""); setAmount(""); setArticle(""); setDescription(""); 
    setCart([]); setWantsRedeem(false); setCustomer({ name: null, balance: 0, valid: null });
    setSelectedProduct(null); setActionType(null); setProgress(null);
  };

  const handleSendWhatsApp = async () => {
      if (waContext) {
          const msg = buildWhatsAppMessage(waContext);
          await sendWhatsApp(waContext.toPhone, msg);
      }
      setWaModalVisible(false);
      clearForm();
  };

  const cartSubtotal = cart.reduce((acc, el) => acc + (el.monto * el.cantidad), 0);
  const currentAmount = fixMoney(cartSubtotal); 
  const appliedAmount = wantsRedeem ? Math.min(customer.balance, currentAmount) : 0;
  const totalToCharge = fixMoney(Math.max(0, currentAmount - appliedAmount));
  const availableBalanceDisplay = fixMoney(customer.balance - appliedAmount);

  return {
    state: {
        loading, error, business, customer, cart,
        inputs: { phone, amount, article, description, qty },
        totals: { currentAmount, appliedAmount, totalToCharge, availableBalanceDisplay },
        custom: { products: customProducts, selected: selectedProduct, actionType, progress },
        waModal: { visible: waModalVisible, context: waContext },
        wantsRedeem
    },
    actions: {
        setPhone, setAmount: (v: string) => setAmount(sanitizeAmount(v)),
        setArticle, setDescription, setQty, setWantsRedeem,
        setSelectedProduct, setActionType,
        handleLookup, addToCart, removeFromCart: (id: string) => setCart(prev => prev.filter(i => i.id !== id)),
        handleSubmit, handleSendWhatsApp, closeWaModal: () => { setWaModalVisible(false); clearForm(); },
        clearForm
    }
  };
};