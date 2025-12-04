import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
  Platform,
  StatusBar,
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
  // Un poco más ancho para que se vea más premium
  const drawerWidth = Math.min(width * 0.82, 340);

  const tx = useRef(new Animated.Value(-drawerWidth)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    tx.setValue(-drawerWidth);
  }, [drawerWidth, tx]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(tx, {
        toValue: open ? 0 : -drawerWidth,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: open ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [open, drawerWidth, tx, fadeAnim]);

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
        transform: [{ translateX: tx }],
        shadowColor: "#000",
        shadowOffset: { width: 5, height: 0 },
        shadowOpacity: open ? 0.3 : 0,
        shadowRadius: 15,
        elevation: open ? 20 : 0,
      },
    ],
    [drawerWidth, tx, open]
  );

  const overlayStyle = useMemo(
    () => [
      styles.overlay, 
      { 
        opacity: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.4]
        }) 
      }
    ],
    [fadeAnim]
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
      <StatusBar barStyle={open ? "light-content" : "dark-content"} />
      
      {/* Botón flotante (Hamburguesa) */}
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.fab,
          {
            top: Platform.OS === 'android' ? insets.top + 12 : insets.top + 2,
            zIndex: open ? 1 : 60,
            opacity: open ? 0 : 1,
            pointerEvents: open ? "none" : "auto",
            transform: [{ scale: pressed ? 0.95 : 1 }]
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Abrir menú"
      >
        <MaterialCommunityIcons name="menu" size={24} color="#2563EB" />
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
        {/* Fondo Gradiente Azul "Super Pro" */}
        <LinearGradient
          colors={["#2563EB", "#1E40AF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Decoración de fondo */}
        <View style={[styles.bubble, { top: -60, right: -60, width: 200, height: 200, opacity: 0.08 }]} />
        <View style={[styles.bubble, { bottom: 120, left: -40, width: 140, height: 140, opacity: 0.05 }]} />

        {/* 🔵 HEADER */}
        <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 20, paddingBottom: 30 }}>
            {/* Botón cerrar */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 }}>
                 <Pressable 
                    onPress={() => setOpen(false)} 
                    style={({pressed}) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
                 >
                    <MaterialCommunityIcons name="close" size={20} color="#fff" />
                 </Pressable>
            </View>

            <View style={styles.profileContainer}>
                {/* LOGO ORIGINAL RESTAURADO */}
                <View style={styles.brandLogoContainer}>
                    <Image
                        source={Logo}
                        style={styles.brandLogo}
                        resizeMode="contain"
                    />
                </View>
                
                <View style={{ marginTop: 16 }}>
                    <Text numberOfLines={1} style={styles.greeting}>Hola,</Text>
                    <Text numberOfLines={1} style={styles.title}>
                        {user?.nombre ?? "Mi cuenta"}
                    </Text>
                    {!!user?.telefono && (
                        <View style={styles.phoneBadge}>
                            <MaterialCommunityIcons name="phone" size={12} color="#fff" style={{ marginRight: 4 }} />
                            <Text numberOfLines={1} style={styles.subtitle}>
                                {user.telefono}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </View>

        <View style={styles.separator} />

        {/* MENÚ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NAVEGACIÓN</Text>

          <MenuItem 
            icon="home-variant-outline" 
            label="Inicio" 
            onPress={() => goTab("Home")} 
            active={true}
          />

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

        {/* Footer */}
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
          <Pressable
            onPress={goLogout}
            style={({ pressed }) => [
              styles.logoutBtn,
              pressed && { backgroundColor: "rgba(255,255,255,0.2)" },
            ]}
          >
            <View style={styles.logoutIconBg}>
                <MaterialCommunityIcons name="logout" size={18} color="#fff" />
            </View>
            <Text style={styles.logoutText}>
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
  active = false
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable 
        onPress={onPress} 
        style={({pressed}) => [
            styles.item, 
            (pressed || active) && styles.itemActive
        ]}
    >
      <View style={[styles.itemIcon, active && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
        <MaterialCommunityIcons name={icon} size={22} color="#FFFFFF" />
      </View>
      <Text style={[styles.itemText, active && { fontWeight: '700' }]}>{label}</Text>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color="rgba(255,255,255,0.5)"
        style={{ marginLeft: "auto" }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // FAB
  fab: {
    position: "absolute",
    left: 20,
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  overlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: "#000" 
  },
  drawer: { 
    position: "absolute", 
    left: 0, 
    top: 0, 
    bottom: 0, 
    zIndex: 49,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  bubble: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  profileContainer: {
    marginTop: 0,
  },
  // ESTILOS ORIGINALES DEL LOGO RESTAURADOS 👇
  brandLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#ffffffee", // Fondo blanco sólido/casi sólido
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  brandLogo: {
    width: 36, // Tamaño original
    height: 36,
  },
  // ----------------------------------------
  closeBtn: {
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  title: { 
    color: "#fff", 
    fontWeight: "800", 
    fontSize: 22,
    letterSpacing: -0.5,
    marginVertical: 2,
  },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  subtitle: { 
    color: "#fff", 
    fontSize: 13, 
    fontWeight: "600" 
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  section: { 
    paddingHorizontal: 16,
    flex: 1,
  },
  sectionLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 12,
  },
  item: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  itemActive: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: { 
    color: "#fff", 
    marginLeft: 14, 
    fontSize: 16, 
    fontWeight: "500" 
  },
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
  },
  logoutBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  logoutIconBg: {
    marginRight: 12,
  },
  logoutText: { 
    color: "#FFFFFF", 
    fontSize: 15, 
    fontWeight: "700" 
  },
  versionText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
  },
});