import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
  BackHandler,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import type { RootStackParamList } from "../navigation/StackNavigator";
import type { TabParamList } from "../navigation/TabNavigator";
import { useAuth } from "../presentation/context/AuthContext";

type Props = { show?: boolean };

export default function GlobalHamburger({ show = true }: Props) {
  // --- Hooks siempre arriba (evita errores de orden) ---
  const { user } = useAuth();
  const role = (user?.role ?? "").toUpperCase();
  const isAdmin = role === "ADMIN" || role === "SUPERADMIN";

  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const width = Dimensions.get("window").width;
  const drawerWidth = Math.min(width * 0.8, 320);

  // Animación abrir/cerrar
  useEffect(() => {
    Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [open, anim]);

  // Back (Android) cierra el panel
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (open) {
        setOpen(false);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [open]);

  // Estilos animados memorizados
  const drawerStyle = useMemo(
    () => [
      styles.drawer,
      {
        width: drawerWidth,
        paddingTop: insets.top + 12,
        transform: [
          {
            translateX: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [-drawerWidth, 0],
            }),
          },
        ],
      },
    ],
    [anim, drawerWidth, insets.top]
  );

  const overlayStyle = useMemo(
    () => [
      styles.overlay,
      {
        opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.28] }),
      },
    ],
    [anim]
  );

  const goTab = (screen: keyof TabParamList) => {
    setOpen(false);
    navigation.navigate("Tabs", { screen }); // navega a la pestaña
  };

  // No lo muestres en Login/Register
  if (!show || !user) return null;

  return (
    <>
      {/* Botón hamburguesa arriba-derecha */}
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.fab, { top: insets.top + 10 }]}
        accessibilityRole="button"
        accessibilityLabel="Abrir menú"
      >
        <MaterialCommunityIcons name="menu" size={20} color="#1D4ED8" />
      </Pressable>

      {/* Tocar fuera -> cerrar */}
      <Animated.View
        pointerEvents={open ? "auto" : "none"}
        style={overlayStyle}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
      </Animated.View>

      {/* Drawer izquierdo */}
      <Animated.View
        style={drawerStyle}
        pointerEvents={open ? "auto" : "none"}
      >
        {/* Fondo con gradiente + “burbujas” */}
        <LinearGradient
          colors={["#1E40AF", "#2563EB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Burbujas */}
        <View style={[styles.bubble, { top: 80, left: -40, opacity: 0.12 }]} />
        <View style={[styles.bubble, { bottom: 100, right: -50, opacity: 0.09 }]} />

        {/* Header simple (nombre / teléfono) */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account" color="#fff" size={22} />
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text numberOfLines={1} style={styles.title}>
                {user?.nombre ?? "Mi cuenta"}
              </Text>
              {!!user?.telefono && (
                <Text numberOfLines={1} style={styles.subtitle}>
                  {user.telefono}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <SectionLabel>MENÚ</SectionLabel>

          <MenuItem
            icon="home-outline"
            label="Home"
            onPress={() => goTab("Home")}
          />

          {isAdmin && (
            <MenuItem
              icon="account-plus-outline"
              label="Crear usuario"
              onPress={() => goTab("CreateUser")}
            />
          )}

          <MenuItem
            icon="cog-outline"
            label="Configuración"
            onPress={() => goTab("Configuration")}
          />
        </View>

        {/* Logout anclado abajo */}
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
            onPress={() => goTab("Logout")}
            hitSlop={10}
            android_ripple={{ color: "rgba(255,255,255,0.15)" }}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            style={({ pressed }) => [
            styles.logout,
            pressed && { opacity: 0.7 },
            ]}
        >
            <MaterialCommunityIcons name="logout" size={20} color="#FFFFFF" />
            <Text style={[styles.logoutText, { color: "#FFFFFF" }]}>
            Cerrar sesión
            </Text>
        </Pressable>
        </View>

      </Animated.View>
    </>
  );
}

/* ------------------ Subcomponentes ------------------ */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.item}>
      <MaterialCommunityIcons name={icon} size={20} color="#FFFFFF" />
      <Text style={styles.itemText}>{label}</Text>
      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color="#FFFFFF99"
        style={{ marginLeft: "auto" }}
      />
    </Pressable>
  );
}

/* ------------------ Estilos ------------------ */
const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 14,
    zIndex: 50,
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 49,
  },
  bubble: {
    position: "absolute",
    height: 160,
    width: 160,
    borderRadius: 80,
    backgroundColor: "#FFFFFF",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  avatar: {
    height: 34,
    width: 34,
    borderRadius: 17,
    backgroundColor: "#ffffff22",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { color: "#fff", fontWeight: "800", fontSize: 16 },
  subtitle: { color: "#ffffffbb", fontSize: 12, marginTop: 2 },
  section: { paddingHorizontal: 16, paddingTop: 8 },
  sectionLabel: {
    color: "#ffffff99",
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  itemText: { color: "#fff", marginLeft: 12, fontSize: 15, fontWeight: "600" },
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
  },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  logoutText: { color: "#FCA5A5", marginLeft: 12, fontSize: 15, fontWeight: "700" },
});
