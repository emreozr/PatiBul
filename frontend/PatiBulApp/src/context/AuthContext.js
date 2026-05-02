import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('userData');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('AsyncStorage yükleme hatası:', error);
      } finally {
        // Minimum 2 saniye splash screen göster
        await new Promise(resolve => setTimeout(resolve, 2000));
        setLoading(false);
      }
    };

    loadStorageData();
  }, []);

  const login = async (accessToken, userData) => {
    try {
      await AsyncStorage.setItem('userToken', accessToken);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setToken(accessToken);
      setUser(userData);
    } catch (error) {
      console.error('Login AsyncStorage kaydetme hatası:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout AsyncStorage silme hatası:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}