import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CustomButton from '../components/CustomButton';
import Colors from '../styles/colors';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>PatiBul Anasayfa</Text>
      <Text style={styles.subtitle}>Hoşgeldiniz!</Text>

      <View style={styles.buttonContainer}>
        <CustomButton 
          title="Çıkış Yap" 
          type="secondary"
          onPress={() => navigation.replace('Login')} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textLight,
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  }
});

export default HomeScreen;
