import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider } from "./src/presentation/context/AuthContext";
import StackNavigator from "./src/navigation/StackNavigator";
import GlobalHamburger from "./src/components/GlobalHamburger";
import Toast from "react-native-toast-message";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* 👇 Debe envolver TODO (opcional initialWindowMetrics evita un bug al arrancar en Android) */}
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <AuthProvider>
          {/* 👇 GlobalHamburger DEBE vivir dentro del NavigationContainer */}
          <NavigationContainer>
            <GlobalHamburger />
            <StackNavigator />
          </NavigationContainer>
          <Toast position="top" />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
