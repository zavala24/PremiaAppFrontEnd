import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import PointsScreen from "../screens/PointsScreen";
import ConfigurationScreen from "../screens/ConfigurationScreen";
import CreateUserScreen from "../screens/CreateUserScreen";
import LogoutScreen from "../screens/LogoutScreen";
import SellPointsScreen from "../screens/SellPointsScreen"; // ⬅️ NUEVO
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../presentation/context/AuthContext";

export type TabParamList = {
  Home: undefined;
  SellPoints: undefined;   // ⬅️ NUEVO
  Points: undefined;
  Configuration: undefined;
  CreateUser: undefined;
  Logout: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  const { user } = useAuth();
  const role = user?.role?.toUpperCase(); // "ADMIN" | "SUPERADMIN" | "USER" | undefined
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
          let iconName: keyof typeof Ionicons.glyphMap;
          switch (route.name) {
            case "Home":
              iconName = focused ? "home" : "home-outline";
              break;
            case "SellPoints":
              iconName = focused ? "cash" : "cash-outline"; // ⬅️ icono del nuevo tab
              break;
            case "Points":
              iconName = focused ? "trophy" : "trophy-outline";
              break;
            case "Configuration":
              iconName = focused ? "settings" : "settings-outline";
              break;
            case "CreateUser":
              iconName = focused ? "person-add" : "person-add-outline";
              break;
            case "Logout":
              iconName = focused ? "log-out" : "log-out-outline";
              break;
            default:
              iconName = "ellipse";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {/* 1) Home para todos */}
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />

      {/* 2) SellPoints solo admin/superadmin (aparece enseguida de Home) */}
      {isAdmin && (
        <Tab.Screen
          name="SellPoints"
          component={SellPointsScreen}
          options={{ title: "Vender" }}
        />
      )}

      {/* 3) Resto de tabs */}
      <Tab.Screen name="Points" component={PointsScreen} options={{ title: "Puntos" }} />
      <Tab.Screen name="Configuration" component={ConfigurationScreen} options={{ title: "Configuración" }} />

      {/* 4) Crear Usuario solo para admin/superadmin */}
      {isAdmin && (
        <Tab.Screen name="CreateUser" component={CreateUserScreen} options={{ title: "Crear Usuario" }} />
      )}

      <Tab.Screen name="Logout" component={LogoutScreen} options={{ title: "Cerrar sesión" }} />
    </Tab.Navigator>
  );
}
