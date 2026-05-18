import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Alert, ActivityIndicator,
  TouchableOpacity, TextInput,
} from 'react-native';
import KeyboardSafeView from '../components/KeyboardSafeView';
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
    <KeyboardSafeView
      backgroundColor={Colors.background}
      contentStyle={styles.content}
      useSafeArea={true}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.title}>PatiBul</Text>
        <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>
      </View>

      <View style={styles.formContainer}>
        {/* E-posta */}
        <Text style={styles.label}>E-posta</Text>
        <TextInput
          style={styles.input}
          placeholder="E-posta adresinizi girin"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Şifre */}
        <Text style={styles.label}>Şifre</Text>
        <TextInput
          style={styles.input}
          placeholder="Şifrenizi girin"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#fff" style={styles.loginButton} />
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}>
            <Text style={styles.primaryBtnText}>Giriş Yap</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.secondaryBtnText}>Hesabın yok mu? Kayıt Ol</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotBtn}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotBtnText}>Şifremi Unuttum?</Text>
        </TouchableOpacity>
      </View>
    </KeyboardSafeView>
  );
};

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    padding: 28,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: '400',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '300',
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#fff',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  loginButton: {
    marginTop: 20,
    marginBottom: 10,
  },
  primaryBtn: {
    backgroundColor: '#1a1a2e',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    marginBottom: 16,
  },
  secondaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  forgotBtn: {
    alignItems: 'flex-end',
  },
  forgotBtnText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;