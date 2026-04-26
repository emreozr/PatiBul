import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import Colors from '../styles/colors';
import config from '../config';

const API_URL = config.API_URL;

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendReset = async () => {
    if (!email.trim()) {
      Alert.alert('Hata', 'Lütfen e-posta adresinizi girin.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      // Eğer sunucu hata verip HTML formatında bir sayfa dönerse burası hata fırlatıp catch bloğuna düşer.
      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Hata', data.error || 'İstek başarısız oldu.');
        return;
      }

      Alert.alert(
        'Başarılı',
        'Şifre sıfırlama bağlantısı e-postanıza gönderildi. Lütfen kontrol edin.',
        [
          {
            text: 'Tamam',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      // DÜZELTME BURADA YAPILDI: Gerçek hata konsola yazdırılıyor
      console.log("-----------------------------------------");
      console.log("🚨 ŞİFRE SIFIRLAMA HATASI DETAYI 🚨");
      console.log(error);
      console.log("-----------------------------------------");
      
      Alert.alert('Hata', 'İşlem sırasında bir sorun oluştu. Lütfen Expo terminalini kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Şifremi Unuttum</Text>
        <Text style={styles.subtitle}>
          E-posta adresinizi girin, size şifre sıfırlama bağlantısı göndereceğiz.
        </Text>
      </View>

      <View style={styles.formContainer}>
        <InputField
          label="E-posta"
          placeholder="E-posta adresiniz"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : (
          <CustomButton
            title="Sıfırlama Bağlantısı Gönder"
            onPress={handleSendReset}
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

export default ForgotPasswordScreen;