import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import Colors from '../styles/colors';
import { useAuth } from '../context/AuthContext';
import config from '../config';

const API_URL = config.API_URL;

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Hata', data.error || 'Giriş başarısız.');
        return;
      }

      // Token ve kullanıcı bilgisini AuthContext'e kaydet
      // navigation.replace('Home') KALDIRILDI — token set edilince app.js otomatik yönlendirir
      login(data.access_token, data.user);

    } catch (error) {
      Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamıyor. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>PatiBul</Text>
      </View>

      <View style={styles.formContainer}>
        <InputField
          label="E-posta"
          placeholder="E-posta adresinizi girin"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <InputField
          label="Şifre"
          placeholder="Şifrenizi girin"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
        />

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loginButton} />
        ) : (
          <CustomButton title="Giriş Yap" onPress={handleLogin} style={styles.loginButton} />
        )}

        <CustomButton
          title="Hesabın yok mu? Kayıt Ol"
          type="secondary"
          onPress={() => navigation.navigate('Register')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textLight,
  },
  formContainer: {
    width: '100%',
  },
  loginButton: {
    marginTop: 20,
    marginBottom: 10,
  },
});

export default LoginScreen;