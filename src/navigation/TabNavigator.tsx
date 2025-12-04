import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Platform, View, StyleSheet, Text } from "react-native";

import HomeScreen from "../screens/HomeScreen";
import SellPointsScreen from "../screens/SellPointsScreen/SellPointsScreen";
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
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: false,

        // ESTILO FLOTANTE "CÁPSULA"
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          elevation: 5,
          backgroundColor: '#ffffff',
          borderRadius: 24, 
          height: 64, // Un poco más de altura para que respire
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        
        // Alineación del item dentro de la barra
        tabBarItemStyle: {
          height: 64, 
          // En iOS a veces se necesita un pequeño ajuste de padding superior para centrar visualmente con el notch inferior
          paddingTop: Platform.OS === 'ios' ? 12 : 0, 
        },

        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "ellipse";
          let label = "";

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
            label = "Inicio";
          } else if (route.name === "SellPoints") {
            iconName = focused ? "storefront" : "storefront-outline"; 
            label = "Vender";
          } else if (route.name === "Promotions") {
            iconName = focused ? "pricetags" : "pricetags-outline";
            label = "Promos";
          }

          return (
            <View style={styles.iconContainer}>
              <Ionicons name={iconName} size={24} color={color} />
              
              <Text 
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{ 
                  color: color, 
                  fontSize: 10, 
                  fontWeight: focused ? '700' : '500',
                  marginTop: 4,
                  textAlign: 'center',
                  width: '100%', // Ocupa el ancho real del contenedor
              }}>
                {label}
              </Text>

              {/* Indicador de activo */}
              {focused && <View style={styles.activeDot} />}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      {isAdmin && (
        <Tab.Screen name="SellPoints" component={SellPointsScreen} />
      )}
      <Tab.Screen name="Promotions" component={NotificationsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    //justifyContent: 'center', // Centrado vertical puro
    width: '100%', // Usar todo el ancho disponible del tab item
    height: '100%',
    paddingBottom: Platform.OS === 'ios' ? 12 : 0, // Compensar el padding superior del item en iOS
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2563EB',
    position: 'absolute',
    bottom: 8, // Posición fija desde abajo
  }
});