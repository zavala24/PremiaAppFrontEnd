import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import ConfigurationScreen from "../screens/ConfigurationScreen";
import PointsScreen from "../screens/PointsScreen";
import { Ionicons } from "@expo/vector-icons";
import LogoutScreen from "../screens/LogoutScreen";

export type TabParamList = {
  Home: undefined;
  Configuration: undefined;
  Points: undefined;
  Logout: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  return (
<Tab.Navigator
    id={undefined}
    screenOptions={({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: "#1D4ED8",
    tabBarInactiveTintColor: "gray",
    tabBarStyle: { backgroundColor: "white", paddingVertical: 5 },
    tabBarIcon: ({ focused, color, size }) => {
      let iconName: string = "";

      if (route.name === "Home") iconName = focused ? "home" : "home-outline";
      else if (route.name === "Points") iconName = focused ? "trophy" : "trophy-outline";
      return <Ionicons name={iconName as any} size={size} color={color} />;
    },
  })}
>
  <Tab.Screen name="Home" component={HomeScreen} />
  <Tab.Screen name="Points" component={PointsScreen} options={{ title: "Puntos" }} />

</Tab.Navigator>

  );
}
