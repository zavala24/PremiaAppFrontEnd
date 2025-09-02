import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { styled } from "nativewind";

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg font-bold text-blue-600">
        ¡Hola con Tailwind en React Native!
      </Text>
      <StatusBar style="auto" />
    </View>
  );  
}
