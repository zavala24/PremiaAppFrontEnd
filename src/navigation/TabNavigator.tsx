import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import ConfigurationScreen from "../screens/ConfigurationScreen";
import SellPointsScreen from "../screens/SellPointsScreen";
import { useAuth } from "../presentation/context/AuthContext";

export type TabParamList = {
  Home: undefined;
  SellPoints: undefined;
  Configuration: undefined; 
   CreateUser: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  const { user } = useAuth();
  const role = user?.role?.toUpperCase();
  const isAdmin = role === "ADMIN" || role === "SUPERADMIN";

  return (
    <Tab.Navigator
      id={undefined}
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#1D4ED8",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: { backgroundColor: "white", paddingVertical: 8 },
        tabBarIcon: ({ focused, color, size }) => {
          let icon: keyof typeof Ionicons.glyphMap = "ellipse";
          if (route.name === "Home") icon = focused ? "home" : "home-outline";
          if (route.name === "SellPoints") icon = focused ? "cash" : "cash-outline";
          if (route.name === "Configuration") icon = focused ? "settings" : "settings-outline";
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      {/* Home siempre visible */}
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />

      {/* Vender: sólo admin/superadmin */}
      {isAdmin && (
        <Tab.Screen
          name="SellPoints"
          component={SellPointsScreen}
          options={{ title: "Vender" }}
        />
      )}

      {/* Configuración: oculta el botón del Tab, pero permite navegar desde el menú */}
      <Tab.Screen
        name="Configuration"
        component={ConfigurationScreen}
        options={{
          title: "Configuración",
          tabBarButton: () => null, // 👈 Oculta del tab bar
        }}
      />
    </Tab.Navigator>
  );
}
