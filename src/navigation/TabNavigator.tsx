// src/navigation/TabNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import SellPointsScreen from "../screens/SellPointsScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import { useAuth } from "../presentation/context/AuthContext";

export type TabParamList = {
  Home: undefined;
  SellPoints: undefined;
  Promotions: undefined;
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
        // Reparte el ancho de forma pareja entre los tabs visibles
        tabBarItemStyle: { flex: 1 },
        tabBarStyle: { backgroundColor: "white", paddingVertical: 8 },
        tabBarLabelStyle: { fontSize: 12 },
        tabBarIconStyle: { marginTop: 2 },
        tabBarIcon: ({ focused, color, size }) => {
          let icon: keyof typeof Ionicons.glyphMap;
          switch (route.name) {
            case "Home":
              icon = focused ? "home" : "home-outline";
              break;
            case "SellPoints":
              icon = focused ? "cash" : "cash-outline";
              break;
            case "Promotions":
              // puedes cambiar por "gift" / "megaphone"
              icon = focused ? "pricetags" : "pricetags-outline";
              break;
            default:
              icon = "ellipse";
          }
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
      {isAdmin && (
        <Tab.Screen
          name="SellPoints"
          component={SellPointsScreen}
          options={{ title: "Vender" }}
        />
      )}
      <Tab.Screen
        name="Promotions"
        component={NotificationsScreen}
        options={{ title: "Promociones" }}
      />
      
    </Tab.Navigator>
  );
}
