import React, { useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { useAuth } from "../presentation/context/AuthContext";

export default function LogoutScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        // Limpia sesión (borra @auth_user, @auth_token y header Authorization)
        await logout();
      } finally {
        // Resetea el stack padre (donde está Login/Tabs) hacia Login
        const root = navigation.getParent() ?? navigation;
        root.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Login" as never }],
          })
        );
      }
    })();
  }, [logout, navigation]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator />
      <Text style={{ marginTop: 8 }}>Cerrando sesión…</Text>
    </View>
  );
}
