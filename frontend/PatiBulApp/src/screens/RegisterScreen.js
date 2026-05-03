import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import KeyboardSafeView from '../components/KeyboardSafeView';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
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
    <KeyboardSafeView backgroundColor={Colors.background} contentStyle={styles.content}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Kayıt Ol</Text>
        <Text style={styles.subtitle}>Yeni bir hesap oluşturun</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.roleLabel}>Hesap Türü</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleButton, role === 'user' && styles.roleButtonActive]}
            onPress={() => setRole('user')}
          >
            <Text style={styles.roleIcon}>🐾</Text>
            <Text style={[styles.roleButtonText, role === 'user' && styles.roleButtonTextActive]}>Hayvan Sahibi</Text>
            <Text style={[styles.roleButtonSub, role === 'user' && styles.roleButtonSubActive]}>Kayıp ilanı ver, bildirim yap</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, role === 'vet' && styles.roleButtonActive]}
            onPress={() => setRole('vet')}
          >
            <Text style={styles.roleIcon}>🏥</Text>
            <Text style={[styles.roleButtonText, role === 'vet' && styles.roleButtonTextActive]}>Veteriner Kliniği</Text>
            <Text style={[styles.roleButtonSub, role === 'vet' && styles.roleButtonSubActive]}>Bildirimleri yönet, yanıt ver</Text>
          </TouchableOpacity>
        </View>

        <InputField label="Ad Soyad" placeholder="Adınızı ve soyadınızı girin" value={username} onChangeText={setUsername} />
        <InputField label="E-posta" placeholder="E-posta adresinizi girin" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <InputField label="Şifre" placeholder="Şifrenizi girin" value={password} onChangeText={setPassword} secureTextEntry={true} />

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.registerButton} />
        ) : (
          <CustomButton title="Kayıt Ol" onPress={handleRegister} style={styles.registerButton} />
        )}
        <CustomButton title="Zaten hesabın var mı? Giriş Yap" type="secondary" onPress={() => navigation.navigate('Login')} />
      </View>
    </KeyboardSafeView>
  );
};

const styles = StyleSheet.create({
  content: { padding: 20, justifyContent: 'center' },
  headerContainer: { alignItems: 'center', marginBottom: 30, marginTop: 20 },
  title: { fontSize: 36, fontWeight: 'bold', color: Colors.primary, marginBottom: 10 },
  subtitle: { fontSize: 18, color: Colors.textLight },
  formContainer: { width: '100%' },
  roleLabel: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 10 },
  roleContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  roleButton: { flex: 1, borderWidth: 2, borderColor: '#e0e0e0', borderRadius: 14, padding: 14, alignItems: 'center', backgroundColor: '#fff' },
  roleButtonActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '11' },
  roleIcon: { fontSize: 28, marginBottom: 6 },
  roleButtonText: { fontSize: 13, fontWeight: '700', color: '#666', textAlign: 'center', marginBottom: 4 },
  roleButtonTextActive: { color: Colors.primary },
  roleButtonSub: { fontSize: 10, color: '#aaa', textAlign: 'center' },
  roleButtonSubActive: { color: Colors.primary },
  registerButton: { marginTop: 20, marginBottom: 10 },
});

export default RegisterScreen;