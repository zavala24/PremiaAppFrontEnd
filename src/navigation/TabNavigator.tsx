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
        tabBarHideOnKeyboard: true,

        // distribución pareja y centrada
        tabBarItemStyle: { flex: 1, alignItems: "center" },
        tabBarStyle: { backgroundColor: "white", paddingVertical: 6, justifyContent: "space-around" },
        tabBarLabelStyle: { fontSize: 12, marginBottom: 2 },
        tabBarIconStyle: { marginTop: 2 },

        tabBarIcon: ({ focused, color, size }) => {
          let icon: keyof typeof Ionicons.glyphMap = "ellipse";
          if (route.name === "Home")       icon = focused ? "home"      : "home-outline";
          if (route.name === "SellPoints") icon = focused ? "cash"      : "cash-outline";
          if (route.name === "Promotions") icon = focused ? "pricetags" : "pricetags-outline";
          return <Ionicons name={icon} size={20} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
      {isAdmin && (
        <Tab.Screen name="SellPoints" component={SellPointsScreen} options={{ title: "Vender" }} />
      )}
      <Tab.Screen name="Promotions" component={NotificationsScreen} options={{ title: "Promociones" }} />
    </Tab.Navigator>
  );
}
