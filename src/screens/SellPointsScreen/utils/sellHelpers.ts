// src/presentation/screens/SellPoints/utils/sellHelpers.ts
import { Linking } from "react-native";
import { WhatsAppContext } from "../types";

export const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    isNaN(n) ? 0 : n
  );

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

export const sanitizePhone = (raw: string) => onlyDigits(raw);

export const sanitizeAmount = (raw: string) => {
  const cleaned = raw.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length <= 2) return cleaned;
  return `${parts[0]}.${parts.slice(1).join("")}`;
};

const DEFAULT_COUNTRY_CODE = "52";
export const formatPhoneForWhatsApp = (raw: string) => {
  const digits = onlyDigits(raw);
  return digits.startsWith(DEFAULT_COUNTRY_CODE)
    ? digits
    : DEFAULT_COUNTRY_CODE + digits;
};

export const buildWhatsAppMessage = ({
  businessName,
  customerName,
  article,
  amount,
  applied,
  total,
  isCustom = false,
  promoNombre,
  accion,
  porcentaje,
  estado,
  cantidadPromo,
  cartItems,
}: WhatsAppContext) => {
  const base = [
    `Hola ${customerName ?? ""} 👋`,
    ``,
    `Gracias por tu compra en *${businessName}*.`,
    ``,
    `🧾 *Detalle de la compra*`,
  ];

  if (cartItems && cartItems.length) {
    cartItems.forEach((it, i) => {
      base.push(
        `• ${i + 1}. ${it.articulo ?? "-"} x ${it.cantidad} = ${currency(
          it.monto * it.cantidad
        )}`
      );
    });
    base.push("", `• Subtotal: ${currency(amount)}`);
  } else {
    base.push(
      `• Artículo: ${article?.trim() || "-"}`,
      `• Monto: ${currency(amount)}`
    );
  }

  base.push(
    `• Puntos aplicados: ${currency(applied)}`,
    `• Total cobrado: ${currency(total)}`,
    ``
  );

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

export async function sendWhatsApp(toPhone: string, text: string) {
  const phone = formatPhoneForWhatsApp(toPhone);
  const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(text)}`;
  const can = await Linking.canOpenURL(url);
  if (can) await Linking.openURL(url);
  else await Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`);
}