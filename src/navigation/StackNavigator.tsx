// src/navigation/StackNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigatorScreenParams } from "@react-navigation/native";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import TabNavigator, { TabParamList } from "./TabNavigator";
import BusinessDetailScreen from "../screens/BusinessDetailScreen";
import CreateUserScreen from "../screens/CreateUserScreen";
import LogoutScreen from "../screens/LogoutScreen";
import ConfigurationScreen from "../screens/ConfigurationScreen";
import { useAuth } from "../presentation/context/AuthContext";

export type RootStackParamList = {
  Login: { fromRegister?: boolean; registeredPhone?: string } | undefined;
  Register: undefined;
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
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
  CreateUser: undefined;
  Logout: undefined;
  Configuration: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function StackNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Tabs" component={TabNavigator} />
          <Stack.Screen name="BusinessDetail" component={BusinessDetailScreen} />
          <Stack.Screen name="CreateUser" component={CreateUserScreen} />
          <Stack.Screen name="Logout" component={LogoutScreen} />
          <Stack.Screen name="Configuration" component={ConfigurationScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
