// src/presentation/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../../domain/entities/User";
import { setAuthToken } from "../../infrastructure/http/api";

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_USER = "@auth_user";
const STORAGE_TOKEN = "@auth_token";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehidratar sesión al iniciar la app
  useEffect(() => {
    (async () => {
      try {
        const [u, t] = await Promise.all([
          AsyncStorage.getItem(STORAGE_USER),
          AsyncStorage.getItem(STORAGE_TOKEN),
        ]);
        if (u && t) {
          const parsed: User = JSON.parse(u);
          setUser(parsed);
          setToken(t);
          setAuthToken(t); // ← pone Authorization: Bearer <t> en axios
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (userData: User, jwtToken: string) => {
    setUser(userData);
    setToken(jwtToken);
    setAuthToken(jwtToken); // ← habilita Bearer global

    await Promise.all([
      AsyncStorage.setItem(STORAGE_USER, JSON.stringify(userData)),
      AsyncStorage.setItem(STORAGE_TOKEN, jwtToken),
    ]);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    setAuthToken(undefined); // ← limpia el header Authorization

    await Promise.all([
      AsyncStorage.removeItem(STORAGE_USER),
      AsyncStorage.removeItem(STORAGE_TOKEN),
    ]);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
