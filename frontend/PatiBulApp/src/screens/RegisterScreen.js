import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import Colors from '../styles/colors';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    if (!username || !email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }
    // TODO: Kayıt işlemi için API'ye bağlanılacak
    Alert.alert('Başarılı', 'Kayıt işlemi başarılı!', [
      { text: 'Tamam', onPress: () => navigation.navigate('Login') }
    ]);
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

          <CustomButton title="Kayıt Ol" onPress={handleRegister} style={styles.registerButton} />
          
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
