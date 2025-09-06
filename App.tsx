import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./src/screens/LoginScreen";
import TabNavigator from "./src/navigation/TabNavigator";
import Toast from "react-native-toast-message";
import { AuthProvider } from "./src/presentation/context/AuthContext";
import StackNavigator, { RootStackParamList } from "./src/navigation/StackNavigator";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StackNavigator/>
        <Toast />
      </NavigationContainer>
    </AuthProvider>
  );
}
