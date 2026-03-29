import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import Colors from '../styles/colors';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }
    // TODO: Login işlemi için API'ye bağlanacak

    navigation.replace('Home');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>PatiBul</Text>
      </View>

      <View style={styles.formContainer}>
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

        <CustomButton title="Giriş Yap" onPress={handleLogin} style={styles.loginButton} />

        <CustomButton
          title="Hesabın yok mu? Kayıt Ol"
          type="secondary"
          onPress={() => navigation.navigate('Register')}
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
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
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
  loginButton: {
    marginTop: 20,
    marginBottom: 10,
  },
});

export default LoginScreen;
