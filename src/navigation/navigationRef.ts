// Navegación global para componentes fuera de pantallas
import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "./StackNavigator";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function nav<T extends keyof RootStackParamList>(
  name: T,
  params?: RootStackParamList[T]
) {
  if (navigationRef.isReady()) {
    // @ts-ignore (params pueden ser undefined)
    navigationRef.navigate(name, params);
  }
}
