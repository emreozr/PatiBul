import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Colors from '../styles/colors';

const CustomButton = ({ title, onPress, type = 'primary', style }) => {
  const isPrimary = type === 'primary';
  const buttonStyle = isPrimary ? styles.primaryButton : styles.secondaryButton;
  const textStyle = isPrimary ? styles.primaryText : styles.secondaryText;

  return (
    <TouchableOpacity style={[styles.button, buttonStyle, style]} onPress={onPress}>
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: Colors.white,
  },
  secondaryText: {
    color: Colors.primary,
  },
});

export default CustomButton;
