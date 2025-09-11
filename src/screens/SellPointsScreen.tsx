import React, { useMemo, useState } from "react";
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
  Image,
} from "react-native";
import { styled } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// === Nativewind wrappers ===
const View = styled(RNView);
const Text = styled(RNText);
const TextInput = styled(RNTextInput);
const Pressable = styled(RNPressable);
const Safe = styled(SafeAreaView);
const KeyboardAvoidingView = styled(RNKeyboardAvoidingView);
const ScrollView = styled(RNScrollView);

// ==== Helpers ====
const currency = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(isNaN(n) ? 0 : n);
const onlyDigits = (s: string) => s.replace(/\D/g, "");

// ==== Mock Endpoints (reemplaza por tu API real) ====
async function fetchUserByPhone(phone: string): Promise<{ name: string; balance: number; hasBusiness: boolean }> {
  await new Promise((r) => setTimeout(r, 600));
  if (phone === "6441900765") return { name: "Cliente Paletita", balance: 10, hasBusiness: true };
  return { name: "Cliente", balance: 0, hasBusiness: true };
}

async function postTransaction(payload: {
  phone: string;
  amount: number;
  applied: number;
  balance: number;
  article?: string;
  description?: string;
}): Promise<{ ok: boolean; id: string; newBalance: number }> {
  await new Promise((r) => setTimeout(r, 700));
  const earned = (payload.amount - payload.applied) * 0.01;
  const newBalance = Math.max(0, payload.balance + earned - payload.applied);
  return { ok: true, id: "tx_" + Date.now(), newBalance };
}

export default function SellPointsScreen() {
  // Logo fijo por mientras (puedes cambiarlo por el de tu negocio en Cloudinary)
  const businessLogoUrl =
    "https://res.cloudinary.com/demo/image/upload/w_300,h_300,c_pad,b_white/dog.png";

  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [article, setArticle] = useState("");
  const [description, setDescription] = useState("");
  const [userName, setUserName] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);

  const [wantsRedeem, setWantsRedeem] = useState(false);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const amountNumber = useMemo(() => Number((amount || "0").replace(",", ".")) || 0, [amount]);
  const applied = wantsRedeem ? Math.min(balance, amountNumber) : 0;
  const totalAfterRedeem = Math.max(0, amountNumber - applied);

  const handleLookup = async () => {
    const p = onlyDigits(phone);
    if (p.length < 10) return Alert.alert("Teléfono inválido", "Ingresa al menos 10 dígitos.");
    try {
      setLoadingLookup(true);
      const res = await fetchUserByPhone(p);
      if (!res.hasBusiness) Alert.alert("Sin negocio", "El usuario no tiene un negocio registrado.");
      setUserName(res.name);
      setBalance(res.balance);
    } catch {
      Alert.alert("Error", "No se pudo consultar al usuario.");
    } finally {
      setLoadingLookup(false);
    }
  };

  const handleSubmit = async () => {
    const p = onlyDigits(phone);
    if (p.length < 10) return Alert.alert("Teléfono inválido", "Ingresa al menos 10 dígitos.");
    if (!(amountNumber > 0)) return Alert.alert("Monto inválido", "El monto debe ser mayor a 0.");
    try {
      setLoadingSubmit(true);
      const res = await postTransaction({
        phone: p,
        amount: amountNumber,
        applied,
        balance,
        article: article.trim() || undefined,
        description: description.trim() || undefined,
      });
      if (res.ok) {
        Alert.alert(
          "Venta registrada",
          `ID: ${res.id}\nMonto final: ${currency(totalAfterRedeem)}\nNuevo saldo: ${currency(res.newBalance)}`
        );
        setBalance(res.newBalance);
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

  return (
    <KeyboardAvoidingView className="flex-1 bg-blue-600" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Fondo decorativo */}
      <View pointerEvents="none" className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-400/25" />
      <View pointerEvents="none" className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-blue-800/25" />

      <Safe className="flex-1 px-4">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingVertical: 12 }}>
          <View className="bg-white rounded-3xl p-6 border border-blue-100 shadow-2xl">
            {/* Logo del negocio */}
            <View className="items-center mb-4">
              <Image
                source={{ uri: businessLogoUrl }}
                style={{ width: 120, height: 120, resizeMode: "contain", marginBottom: 12 }}
              />
              <Text className="text-gray-500 text-center">
                Ingresa el teléfono, el artículo y el monto. Aplica el saldo si el cliente lo desea.
              </Text>
            </View>

            {/* Teléfono */}
            <Text className="text-gray-500 mb-2">Número de teléfono (obligatorio)</Text>
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
                disabled={loadingLookup}
              >
                {loadingLookup ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Consultar</Text>}
              </Pressable>
            </View>

            {userName && (
              <View className="bg-blue-50 border border-blue-100 rounded-2xl p-3 mt-3">
                <Text className="text-blue-900 font-semibold">{userName}</Text>
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
              disabled={loadingSubmit}
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
