import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Alert, ScrollView,
  ActivityIndicator, TouchableOpacity
} from 'react-native';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import Colors from '../styles/colors';
import config from '../config';

const API_URL = config.API_URL;

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
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: username,
          email: email,
          password: password,
          role: role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Hata', data.error || 'Kayıt başarısız.');
        return;
      }

      Alert.alert('Başarılı', 'Kayıt işlemi başarılı!', [
        { text: 'Tamam', onPress: () => navigation.navigate('Login') }
      ]);

    } catch (error) {
      Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamıyor. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Kayıt Ol</Text>
          <Text style={styles.subtitle}>Yeni bir hesap oluşturun</Text>
        </View>

        <View style={styles.formContainer}>

          {/* Rol Seçimi */}
          <Text style={styles.roleLabel}>Hesap Türü</Text>
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
                Kayıp ilanı ver, bildirim yap
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleButton, role === 'vet' && styles.roleButtonActive]}
              onPress={() => setRole('vet')}
            >
              <Text style={styles.roleIcon}>🏥</Text>
              <Text style={[styles.roleButtonText, role === 'vet' && styles.roleButtonTextActive]}>
                Veteriner Kliniği
              </Text>
              <Text style={[styles.roleButtonSub, role === 'vet' && styles.roleButtonSubActive]}>
                Bildirimleri yönet, yanıt ver
              </Text>
            </TouchableOpacity>
          </View>

          <InputField
            label="Ad Soyad"
            placeholder="Adınızı ve soyadınızı girin"
            value={username}
            onChangeText={setUsername}
          />
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
            <ActivityIndicator size="large" color={Colors.primary} style={styles.registerButton} />
          ) : (
            <CustomButton title="Kayıt Ol" onPress={handleRegister} style={styles.registerButton} />
          )}

          <CustomButton
            title="Zaten hesabın var mı? Giriş Yap"
            type="secondary"
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  title: {
    fontSize: 36,
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
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 10,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  roleButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '11',
  },
  roleIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  roleButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  roleButtonTextActive: {
    color: Colors.primary,
  },
  roleButtonSub: {
    fontSize: 10,
    color: '#aaa',
    textAlign: 'center',
  },
  roleButtonSubActive: {
    color: Colors.primary,
  },
  registerButton: {
    marginTop: 20,
    marginBottom: 10,
  },
});

export default RegisterScreen;