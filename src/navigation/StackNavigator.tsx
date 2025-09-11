import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import TabNavigator from "./TabNavigator";
import RegisterScreen from "../screens/RegisterScreen";
import BusinessDetailScreen from "../screens/BusinessDetailScreen";

export type RootStackParamList = {
  Login: { fromRegister?: boolean; registeredPhone?: string } | undefined;
  Register: undefined;
  Tabs: undefined;
  SellPoints: undefined; 
  BusinessDetail: {
    business: {
      id: number;
      name: string;
      category?: string | null;
      logoUrl?: string | null;
      facebook?: string | null;
      instagram?: string | null;
      sitioWeb?: string | null;
      direccion?: string | null;
      descripcion?: string | null;
    };
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function StackNavigator() {
  return (
    <Stack.Navigator
      id={undefined} // ✅ Agregado para TypeScript
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="BusinessDetail" component={BusinessDetailScreen} />
    </Stack.Navigator>
  );
}
