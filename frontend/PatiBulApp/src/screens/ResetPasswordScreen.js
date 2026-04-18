import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import Colors from '../styles/colors';
import config from '../config';

const API_URL = config.API_URL;

const ResetPasswordScreen = ({ route, navigation }) => {
  const { token } = route.params || {};
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-reset-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        setTokenValid(true);
      } else {
        const data = await response.json();
        Alert.alert('Hata', data.error || 'Token geçersiz veya süresi dolmuş.');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Bağlantı Hatası', 'Token doğrulanamadı.');
      navigation.goBack();
    } finally {
      setVerifying(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalı.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, new_password: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Hata', data.error || 'Şifre sıfırlama başarısız oldu.');
        return;
      }

      Alert.alert(
        'Başarılı',
        'Şifreniz başarıyla sıfırlandı. Lütfen yeni şifrenizle giriş yapın.',
        [
          {
            text: 'Giriş Yap',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Bağlantı Hatası', 'Lütfen tekrar deneyiniz.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!tokenValid) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Yeni Şifre Belirle</Text>
        <Text style={styles.subtitle}>
          Lütfen yeni şifrenizi belirleyiniz.
        </Text>
      </View>

      <View style={styles.formContainer}>
        <InputField
          label="Yeni Şifre"
          placeholder="Yeni şifreniz"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
        />
        <InputField
          label="Şifre Onayla"
          placeholder="Şifrenizi tekrar girin"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={true}
        />

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : (
          <CustomButton
            title="Şifreyi Sıfırla"
            onPress={handleResetPassword}
            style={styles.button}
          />
        )}

        <CustomButton
          title="Geri Dön"
          type="secondary"
          onPress={() => navigation.goBack()}
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
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  button: {
    marginTop: 20,
    marginBottom: 10,
  },
});

export default ResetPasswordScreen;