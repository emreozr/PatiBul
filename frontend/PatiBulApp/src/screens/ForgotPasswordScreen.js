import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import KeyboardSafeView from '../components/KeyboardSafeView';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import Colors from '../styles/colors';
import config from '../config';

const API_URL = config.API_URL;

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('Hata', 'Lütfen e-posta adresinizi girin.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Hata', 'Geçerli bir e-posta adresi girin.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Hata', data.error || 'İstek başarısız oldu.');
        return;
      }

      // Kod doğrulama ekranına geç
      navigation.navigate('ResetPassword', { email: email.trim() });

    } catch (error) {
      Alert.alert('Hata', 'Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
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
        <Text style={styles.emoji}>🔐</Text>
        <Text style={styles.title}>Şifremi Unuttum</Text>
        <Text style={styles.subtitle}>
          E-posta adresinizi girin, size 6 haneli doğrulama kodu göndereceğiz.
        </Text>
      </View>

      <View style={styles.formContainer}>
        <InputField
          label="E-posta"
          placeholder="E-posta adresinizi girin"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.button} />
        ) : (
          <CustomButton
            title="Kod Gönder"
            onPress={handleSendCode}
            style={styles.button}
          />
        )}

        <CustomButton
          title="Geri Dön"
          type="secondary"
          onPress={() => navigation.goBack()}
        />
      </View>
    </KeyboardSafeView>
  );
};

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  emoji: {
    fontSize: 52,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  formContainer: {
    width: '100%',
  },
  button: {
    marginTop: 20,
    marginBottom: 10,
  },
});

export default ForgotPasswordScreen;