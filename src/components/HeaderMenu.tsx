// src/components/HeaderMenu.tsx
import React, { useState, useRef } from "react";
import {
  View as RNView,
  Text as RNText,
  Pressable as RNPressable,
  Animated,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { styled } from "nativewind";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../presentation/context/AuthContext";

const View = styled(RNView);
const Text = styled(RNText);
const Pressable = styled(RNPressable);
const AnimatedView = Animated.createAnimatedComponent(View);

interface HeaderMenuProps {
  title: string;
}

export default function HeaderMenu({ title }: HeaderMenuProps) {
  const navigation = useNavigation();
  const { logout } = useAuth(); // 🔑 hook para cerrar sesión

  const [menuOpen, setMenuOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    if (menuOpen) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setMenuOpen(false));
    } else {
      setMenuOpen(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleLogout = () => {
    console.log("LOGOUT");
    logout(); // Limpia usuario y token
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" as never }],
    }); // Navega a login y limpia historial
  };

  return (
    <View className="w-full bg-blue-600 px-4 py-3 flex-row justify-between items-center mt-12">
      <Text className="text-white text-lg font-bold">{title}</Text>

      <Pressable onPress={toggleMenu}>
        <Ionicons name="menu" size={28} color="white" />
      </Pressable>

      {/* Menú desplegable */}
      <AnimatedView
        className="absolute top-20 right-4 bg-white rounded-xl shadow-lg w-48 overflow-hidden"
        style={{ opacity: fadeAnim }}
        pointerEvents={menuOpen ? "auto" : "none"} // 🔑 permite tocar solo si está abierto
      >
        <Pressable className="flex-row items-center px-4 py-3 border-b border-gray-200">
          <Ionicons name="settings-outline" size={20} color="#1D4ED8" />
          <Text className="ml-2 text-blue-700 font-semibold">Configuración</Text>
        </Pressable>

        <Pressable className="flex-row items-center px-4 py-3 border-b border-gray-200">
          <MaterialIcons name="person-add" size={20} color="#1D4ED8" />
          <Text className="ml-2 text-blue-700 font-semibold">Crear Usuario</Text>
        </Pressable>

        <Pressable
          className="flex-row items-center px-4 py-3"
          onPress={handleLogout} // 🔑 cerrar sesión
        >
          <MaterialIcons name="logout" size={20} color="#1D4ED8" />
          <Text className="ml-2 text-blue-700 font-semibold">Cerrar Sesión</Text>
        </Pressable>
      </AnimatedView>
    </View>
  );
}
