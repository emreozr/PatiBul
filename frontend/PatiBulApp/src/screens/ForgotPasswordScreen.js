import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Alert, ActivityIndicator,
  TouchableOpacity, TextInput,
} from 'react-native';
import KeyboardSafeView from '../components/KeyboardSafeView';
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
      navigation.navigate('ResetPassword', { email: email.trim() });
    } catch (error) {
      Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardSafeView
      backgroundColor="#3DAA6E"
      contentStyle={styles.content}
      useSafeArea={true}
    >
      {/* Dekoratif daireler */}
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />

      <View style={styles.headerContainer}>
        
        <Text style={styles.title}>Şifremi Unuttum</Text>
        <Text style={styles.subtitle}>
          E-posta adresinizi girin, size 6 haneli doğrulama kodu göndereceğiz.
        </Text>
      </View>

      <View style={styles.formContainer}>
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

        {loading ? (
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 16 }} />
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleSendCode}>
            <Text style={styles.primaryBtnText}>Kod Gönder</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryBtnText}>Geri Dön</Text>
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
  circleTopRight: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#4DBF7F',
    opacity: 0.3,
  },
  circleBottomLeft: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#4DBF7F',
    opacity: 0.25,
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
    fontSize: 28,
    fontWeight: '400',
    color: '#fff',
    marginBottom: 10,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
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
  primaryBtn: {
    backgroundColor: '#1a1a2e',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
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

export default ForgotPasswordScreen;