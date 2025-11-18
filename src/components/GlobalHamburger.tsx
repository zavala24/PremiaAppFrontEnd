// src/components/GlobalHamburger.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
  Image, // 👈 agregado
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import type { RootStackParamList } from "../navigation/StackNavigator";
import type { TabParamList } from "../navigation/TabNavigator";
import { useAuth } from "../presentation/context/AuthContext";

// 👇 importa tu logo
import Logo from "../../assets/Logo2.png";

type Props = { show?: boolean };

export default function GlobalHamburger({ show = true }: Props) {
  const { user } = useAuth();
  const isAdmin =
    (user?.role ?? "").toUpperCase() === "ADMIN" ||
    (user?.role ?? "").toUpperCase() === "SUPERADMIN";

  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [open, setOpen] = useState(false);

  const width = Dimensions.get("window").width;
  const drawerWidth = Math.min(width * 0.8, 320);

  const tx = useRef(new Animated.Value(-drawerWidth)).current;

  useEffect(() => {
    tx.setValue(-drawerWidth);
  }, [drawerWidth, tx]);

  useEffect(() => {
    Animated.timing(tx, {
      toValue: open ? 0 : -drawerWidth,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [open, drawerWidth, tx]);

  useEffect(() => {
    setOpen(false);
    tx.setValue(-drawerWidth);
  }, [user?.telefono, drawerWidth, tx]);

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

  const drawerStyle = useMemo(
    () => [
      styles.drawer,
      {
        width: drawerWidth,
        paddingTop: insets.top + 12,
        transform: [{ translateX: tx }],
        opacity: open ? 1 : 0.999,
      },
    ],
    [drawerWidth, insets.top, tx, open]
  );

  const overlayStyle = useMemo(
    () => [styles.overlay, { opacity: open ? 0.28 : 0 }],
    [open]
  );

  const goTab = (screen: keyof TabParamList) => {
    setOpen(false);
    navigation.navigate("Tabs", { screen });
  };
  const goCreateUser = () => {
    setOpen(false);
    navigation.navigate("CreateUser");
  };
  const goLogout = () => {
    setOpen(false);
    navigation.navigate("Logout");
  };

  if (!show || !user) return null;

  return (
    <>
      {/* Botón flotante */}
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.fab,
          {
            top: insets.top + 10,
            zIndex: open ? 1 : 60,
            opacity: open ? 0 : 1,
            pointerEvents: open ? "none" : "auto",
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Abrir menú"
      >
        <MaterialCommunityIcons name="menu" size={20} color="#1D4ED8" />
      </Pressable>

      {/* Overlay */}
      <Animated.View
        pointerEvents={open ? "auto" : "none"}
        style={overlayStyle}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setOpen(false)}
        />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={drawerStyle}
        pointerEvents={open ? "auto" : "none"}
      >
        <LinearGradient
          colors={["#1E40AF", "#2563EB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.bubble, { top: 80, left: -40, opacity: 0.12 }]} />
        <View
          style={[styles.bubble, { bottom: 100, right: -50, opacity: 0.09 }]}
        />

        {/* 🔵 HEADER con LOGO + usuario */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <View style={styles.headerRow}>
            {/* Logo / avatar */}
            <View style={styles.brandLogoContainer}>
              <Image
                source={Logo}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            </View>

            {/* Nombre + teléfono */}
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

            {/* Botón cerrar */}
            <Pressable onPress={() => setOpen(false)} style={styles.closeBtn}>
              <MaterialCommunityIcons
                name="chevron-left"
                size={22}
                color="#1D4ED8"
              />
            </Pressable>
          </View>
        </View>


        {/* MENÚ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MENÚ</Text>

          <MenuItem icon="home-outline" label="Home" onPress={() => goTab("Home")} />

          {isAdmin && (
            <MenuItem
              icon="account-plus-outline"
              label="Crear usuario"
              onPress={goCreateUser}
            />
          )}

          <MenuItem
            icon="cog-outline"
            label="Configuración"
            onPress={() => {
              setOpen(false);
              navigation.navigate("Configuration");
            }}
          />
        </View>

        {/* Footer Cerrar sesión */}
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={goLogout}
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

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    left: 14,
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
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#000" },
  drawer: { position: "absolute", left: 0, top: 0, bottom: 0, zIndex: 49 },
  bubble: {
    position: "absolute",
    height: 160,
    width: 160,
    borderRadius: 80,
    backgroundColor: "#FFFFFF",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  avatar: {
    height: 34,
    width: 34,
    borderRadius: 17,
    backgroundColor: "#ffffff22",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: {
    height: 34,
    width: 34,
    borderRadius: 17,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
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
  item: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  itemText: { color: "#fff", marginLeft: 12, fontSize: 15, fontWeight: "600" },
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
  },
  logout: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  logoutText: { marginLeft: 12, fontSize: 15, fontWeight: "700" },
  brandLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#ffffffee",
    justifyContent: "center",
    alignItems: "center",
  },
  brandLogo: {
    width: 36, // antes 30
    height: 36,
  },

});
