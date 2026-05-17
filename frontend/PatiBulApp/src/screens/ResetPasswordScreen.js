import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import KeyboardSafeView from '../components/KeyboardSafeView';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import Colors from '../styles/colors';
import config from '../config';

const API_URL = config.API_URL;

const ResetPasswordScreen = ({ route, navigation }) => {
  const { email } = route.params;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: kod gir, 2: şifre belirle

  const inputRefs = useRef([]);

  const handleCodeChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Sonraki kutuya geç
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      Alert.alert('Hata', 'Lütfen 6 haneli kodu eksiksiz girin.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-reset-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: fullCode, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Hata', data.error || 'Kod geçersiz.');
        return;
      }

      setStep(2);
    } catch (error) {
      Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Hata', 'Yeni şifrenizi girin.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: code.join(''),
          email,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Hata', data.error || 'Şifre güncellenemedi.');
        return;
      }

      Alert.alert(
        '✅ Başarılı',
        'Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.',
        [{ text: 'Giriş Yap', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setCode(['', '', '', '', '', '']);
      Alert.alert('Başarılı', 'Yeni kod e-postanıza gönderildi.');
    } catch (e) {
      Alert.alert('Hata', 'Kod gönderilemedi.');
    }
  };

  return (
    <KeyboardSafeView
      backgroundColor={Colors.background}
      contentStyle={styles.content}
      useSafeArea={true}
    >
      {step === 1 ? (
        <>
          <View style={styles.headerContainer}>
            <Text style={styles.emoji}>📬</Text>
            <Text style={styles.title}>Kodu Girin</Text>
            <Text style={styles.subtitle}>
              <Text style={styles.emailText}>{email}</Text> adresine gönderilen 6 haneli kodu girin.
            </Text>
          </View>

          {/* 6 haneli kod inputları */}
          <View style={styles.codeRow}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => inputRefs.current[index] = ref}
                style={[styles.codeInput, digit ? styles.codeInputFilled : null]}
                value={digit}
                onChangeText={text => handleCodeChange(text.replace(/[^0-9]/g, '').slice(-1), index)}
                onKeyPress={e => handleCodeKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 24 }} />
          ) : (
            <CustomButton
              title="Kodu Doğrula"
              onPress={handleVerifyCode}
              style={styles.button}
            />
          )}

          <TouchableOpacity onPress={handleResendCode} style={styles.resendBtn}>
            <Text style={styles.resendText}>Kodu tekrar gönder</Text>
          </TouchableOpacity>

          <CustomButton
            title="Geri Dön"
            type="secondary"
            onPress={() => navigation.goBack()}
          />
        </>
      ) : (
        <>
          <View style={styles.headerContainer}>
            <Text style={styles.emoji}>🔑</Text>
            <Text style={styles.title}>Yeni Şifre</Text>
            <Text style={styles.subtitle}>
              Hesabınız için yeni bir şifre belirleyin.
            </Text>
          </View>

          <InputField
            label="Yeni Şifre"
            placeholder="En az 6 karakter"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? '👁️' : '👁️‍🗨️'}
            onPressRightIcon={() => setShowPassword(!showPassword)}
          />
          <InputField
            label="Yeni Şifre Tekrar"
            placeholder="Şifreyi tekrar girin"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
          />

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 24 }} />
          ) : (
            <CustomButton
              title="Şifremi Güncelle"
              onPress={handleResetPassword}
              style={styles.button}
            />
          )}
        </>
      )}
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
    marginBottom: 32,
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
  emailText: {
    fontWeight: '700',
    color: Colors.primary,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  codeInput: {
    width: 46,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
    textAlign: 'center',
  },
  codeInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '11',
  },
  button: {
    marginTop: 8,
    marginBottom: 10,
  },
  resendBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  resendText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default ResetPasswordScreen;