import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./src/screens/LoginScreen";
import TabNavigator from "./src/navigation/TabNavigator";
import Toast from "react-native-toast-message";
import HeaderMenu from "./src/components/HeaderMenu";

export type RootStackParamList = {
  Login: undefined;
  Tabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <HeaderMenu title={""} />
      <Stack.Navigator screenOptions={{ headerShown: false }} {...({} as any)}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Tabs" component={TabNavigator} />
      </Stack.Navigator>
       <Toast />
    </NavigationContainer>
  );
}
