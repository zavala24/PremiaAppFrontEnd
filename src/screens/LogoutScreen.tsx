import React, { useEffect } from "react";
import { styled } from "nativewind";
import { View as RNView, Text as RNText } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Styled components
const View = styled(RNView);
const Text = styled(RNText);

// Define el tipo de tu Stack Navigator
type StackParamList = {
  Login: undefined;
  Tabs: undefined;
};

type LogoutScreenNavigationProp = NativeStackNavigationProp<StackParamList, "Tabs">;

export default function LogoutScreen() {
  const navigation = useNavigation<LogoutScreenNavigationProp>();

  // Cuando se monta, redirige a Login
  useEffect(() => {
    navigation.replace("Login");
  }, []);

  return (
    <View className="flex-1 justify-center items-center bg-red-50">
      <Text className="text-red-700 font-bold text-lg">Cerrando sesión...</Text>
    </View>
  );
}
