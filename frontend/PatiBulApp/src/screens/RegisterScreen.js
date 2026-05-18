import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Alert, ActivityIndicator,
  TouchableOpacity, TextInput,
} from 'react-native';
import KeyboardSafeView from '../components/KeyboardSafeView';
import Colors from '../styles/colors';
import { apiFetch, ApiError, ERROR_TYPES, ERROR_MESSAGES } from '../services/api';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: { name: username, email, password, role },
      });
      Alert.alert('Başarılı', 'Kayıt işlemi başarılı!', [
        { text: 'Tamam', onPress: () => navigation.navigate('Login') }
      ]);
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
        <Text style={styles.title}>Kayıt Ol</Text>
        <Text style={styles.subtitle}>Yeni bir hesap oluşturun</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Hesap Türü */}
        <Text style={styles.label}>Hesap Türü</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleButton, role === 'user' && styles.roleButtonActive]}
            onPress={() => setRole('user')}
          >
            <Text style={styles.roleIcon}>🐾</Text>
            <Text style={[styles.roleButtonText, role === 'user' && styles.roleButtonTextActive]}>
              Hayvan Sahibi
            </Text>
            <Text style={[styles.roleButtonSub, role === 'user' && styles.roleButtonSubActive]}>
              Kayıp ilanı ver
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleButton, role === 'vet' && styles.roleButtonActive]}
            onPress={() => setRole('vet')}
          >
            <Text style={styles.roleIcon}>🏥</Text>
            <Text style={[styles.roleButtonText, role === 'vet' && styles.roleButtonTextActive]}>
              Veteriner
            </Text>
            <Text style={[styles.roleButtonSub, role === 'vet' && styles.roleButtonSubActive]}>
              Bildirimleri yönet
            </Text>
          </TouchableOpacity>
        </View>

        {/* Ad Soyad */}
        <Text style={styles.label}>Ad Soyad</Text>
        <TextInput
          style={styles.input}
          placeholder="Adınızı ve soyadınızı girin"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={username}
          onChangeText={setUsername}
        />

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
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 16 }} />
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister}>
            <Text style={styles.primaryBtnText}>Kayıt Ol</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.secondaryBtnText}>Zaten hesabın var mı? Giriş Yap</Text>
        </TouchableOpacity>
      </View>
    </KeyboardSafeView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 28,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '400',
    color: '#fff',
    marginBottom: 6,
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
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  roleButtonActive: {
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  roleIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  roleButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 3,
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  roleButtonSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  roleButtonSubActive: {
    color: 'rgba(255,255,255,0.85)',
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
  },
  secondaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default RegisterScreen;