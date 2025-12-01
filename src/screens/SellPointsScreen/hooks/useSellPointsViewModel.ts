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
    
    // Validación: Si es custom, permitimos monto 0 (ej. canjeo), si es normal, debe ser > 0
    if (!selectedProduct && !(m > 0)) return Toast.show({ type: "error", text1: "Monto inválido" });
    if (!article.trim()) return Toast.show({ type: "error", text1: "Ingresa el artículo" });

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
        customAction: selectedProduct ? actionType : null 
    };

    setCart(prev => [...prev, newItem]);
    
    // Reset inputs
    setArticle(""); setDescription(""); setAmount(""); setQty("1");
    setSelectedProduct(null); setActionType(null);
  };

  // --- LOGIC: Submit (SEPARACIÓN DE FLUJOS) ---
  const handleSubmit = async () => {
    const p = onlyDigits(phone);
    if (p.length !== 10 || customer.valid !== true) return Toast.show({ type: "error", text1: "Verifica usuario/teléfono" });
    if (cart.length === 0) return Toast.show({ type: "error", text1: "Carrito vacío" });

    // 1. SEPARAMOS LOS ÍTEMS
    const itemsVenta = cart.filter(it => !it.esCustom); // Normales (Dinero)
    const itemsCustom = cart.filter(it => it.esCustom); // Custom (Sellos)

    setLoading(prev => ({ ...prev, submit: true }));

    // Variables para totales (WhatsApp)
    let totalMonetario = 0;
    let totalDescuento = 0;
    let totalCobradoFinal = 0;
    let saldoFinalCliente = customer.balance;

    try {
        // ============================================
        // A. PROCESAR VENTAS NORMALES (DINERO / CASHBACK)
        // ============================================
        if (itemsVenta.length > 0) {
            const subtotalVenta = itemsVenta.reduce((s, i) => s + (i.monto * i.cantidad), 0);
            const subtotalDisplay = fixMoney(subtotalVenta);
            
            // Validar que la parte monetaria sea lógica
            if (!(subtotalDisplay > 0)) {
                setLoading(prev => ({ ...prev, submit: false }));
                return Toast.show({ type: "error", text1: "La venta normal debe tener monto > 0" });
            }

            // Aplicar puntos SOLO a la parte normal
            const applied = wantsRedeem ? Math.min(customer.balance, subtotalDisplay) : 0;
            const toCharge = fixMoney(Math.max(0, subtotalDisplay - applied));
            
            // Actualizamos variables globales para el ticket
            totalMonetario = subtotalDisplay;
            totalDescuento = applied;
            totalCobradoFinal = toCharge;
            saldoFinalCliente = fixMoney(customer.balance - applied);

            const payload = {
                TelefonoCliente: p,
                NegocioId: business.idNegocio,
                CreadoPor: user?.telefono ?? "",
                Ventas: itemsVenta.map(it => ({
                    Articulo: it.articulo,
                    Descripcion: it.descripcion,
                    Monto: it.monto,
                    Cantidad: it.cantidad,
                    PuntosAplicados: wantsRedeem, 
                    SaldoAntes: customer.balance
                }))
            };

            const { resp } = await (sellService as any).insertManySellsByUserPhoneNumber(payload);
            if (!resp?.success) throw new Error("Error registrando ventas normales");
        }

        // ============================================
        // B. PROCESAR VENTAS CUSTOM (SOLO ACUMULAR/CANJEAR)
        // ============================================
        // Estos ítems NO van a InsertMany, van directo a sus servicios.
        
        const customPromises = itemsCustom.map(async (it) => {
             // Opcional: Sumar al total del ticket visual si tienen monto, 
             // aunque no se guarden en ventas.
             totalMonetario += (it.monto * it.cantidad);
             totalCobradoFinal += (it.monto * it.cantidad);

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
                return productosService.acumularProgresoCustom(reqBase as any).catch(e => console.log("Err Acumular", e));
            } else if (it.customAction === "canjear") {
                return productosService.canjearProgresoCustom(reqBase as any).catch(e => console.log("Err Canjear", e));
            }
        });

        if (customPromises.length > 0) {
            await Promise.all(customPromises);
        }

        // ============================================
        // C. FINALIZAR
        // ============================================
        
        setWaContext({
            toPhone: p, businessName: business?.name, customerName: customer.name,
            article: null, 
            amount: fixMoney(totalMonetario), 
            applied: fixMoney(totalDescuento),
            total: fixMoney(totalCobradoFinal), 
            saldoAntes: customer.balance,
            saldoDespues: saldoFinalCliente,
            // En el ticket mostramos TODO junto
            cartItems: cart.map(c => ({ 
                articulo: c.articulo + (c.esCustom ? ` (${c.customAction})` : ""), 
                cantidad: c.cantidad, 
                monto: c.monto 
            }))
        });

        Toast.show({ type: "success", text1: "Operación realizada con éxito" });
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

  // --- CÁLCULOS VISUALES PARA LA PANTALLA ---
  // Nota: Para la pantalla, si quieres que el switch de "Aplicar Puntos" 
  // SOLO descuente dinero de los productos NO custom, debemos filtrar aquí también.
  
  const itemsVentaVisual = cart.filter(it => !it.esCustom);
  const itemsCustomVisual = cart.filter(it => it.esCustom);

  const subtotalVenta = itemsVentaVisual.reduce((acc, el) => acc + (el.monto * el.cantidad), 0);
  const subtotalCustom = itemsCustomVisual.reduce((acc, el) => acc + (el.monto * el.cantidad), 0); // Solo informativo

  const currentAmount = fixMoney(subtotalVenta + subtotalCustom); 
  
  // El descuento SOLO aplica sobre lo que es venta normal (subtotalVenta)
  const appliedAmount = wantsRedeem ? Math.min(customer.balance, fixMoney(subtotalVenta)) : 0;
  
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