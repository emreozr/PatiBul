import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import KeyboardSafeView from '../components/KeyboardSafeView';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import Colors from '../styles/colors';
import { useAuth } from '../context/AuthContext';
import { apiFetch, ApiError, ERROR_TYPES, ERROR_MESSAGES } from '../services/api';

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
      const { data } = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      login(data.access_token, data.user);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.type === ERROR_TYPES.CLIENT) {
          Alert.alert('Hata', error.data?.error || error.message);
        } else {
          const errorInfo = ERROR_MESSAGES[error.type] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
          Alert.alert(errorInfo.title, errorInfo.message);
        }
      } else {
        Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamıyor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardSafeView backgroundColor={Colors.background} contentStyle={styles.content}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>PatiBul</Text>
      </View>
      <View style={styles.formContainer}>
        <InputField label="E-posta" placeholder="E-posta adresinizi girin" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <InputField label="Şifre" placeholder="Şifrenizi girin" value={password} onChangeText={setPassword} secureTextEntry={true} />
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loginButton} />
        ) : (
          <CustomButton title="Giriş Yap" onPress={handleLogin} style={styles.loginButton} />
        )}
        <CustomButton title="Hesabın yok mu? Kayıt Ol" type="secondary" onPress={() => navigation.navigate('Register')} />
        <Text style={styles.forgotPasswordLink} onPress={() => navigation.navigate('ForgotPassword')}>
          Şifremi Unuttum?
        </Text>
      </View>
    </KeyboardSafeView>
  );
};

const styles = StyleSheet.create({
  content: { justifyContent: 'center', padding: 20 },
  headerContainer: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 42, fontWeight: 'bold', color: Colors.primary, marginBottom: 10 },
  formContainer: { width: '100%' },
  loginButton: { marginTop: 20, marginBottom: 10 },
  forgotPasswordLink: { color: Colors.primary, fontSize: 14, marginTop: 10, textAlign: 'right', textDecorationLine: 'underline' },
});

export default LoginScreen;