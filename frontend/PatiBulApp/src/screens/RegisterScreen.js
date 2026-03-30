import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import Colors from '../styles/colors';

const API_URL = 'http://192.168.1.125:5000';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: username,
          email: email,
          password: password,
          role: 'user',
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
          <InputField
            label="Kullanıcı Adı"
            placeholder="Kullanıcı adınızı girin"
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
    marginBottom: 40,
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
  registerButton: {
    marginTop: 20,
    marginBottom: 10,
  },
});

export default RegisterScreen;