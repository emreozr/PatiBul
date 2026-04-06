import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const UserProfileScreen = () => (
  <View style={styles.container}>
    <Text style={styles.icon}>👤</Text>
    <Text style={styles.title}>Profilim</Text>
    <Text style={styles.subtitle}>Bu ekran yakında gelecek!</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  icon: {
    fontSize: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
  },
});

export default UserProfileScreen;