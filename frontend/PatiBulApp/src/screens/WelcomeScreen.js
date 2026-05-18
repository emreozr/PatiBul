import React from 'react';
import {
  View, Text, StyleSheet, Dimensions,
  Platform, TouchableOpacity,
} from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Splash ile BİREBİR AYNI PawPrint componenti
const PawPrint = ({ size = 1, color = '#3DAA6E' }) => (
  <Svg width={80 * size} height={80 * size} viewBox="0 0 60 60">
    <Ellipse cx="30" cy="42" rx="13" ry="11" fill={color} />
    <Ellipse cx="11" cy="24" rx="6" ry="8" fill={color} />
    <Ellipse cx="22" cy="17" rx="6" ry="8" fill={color} />
    <Ellipse cx="35" cy="15" rx="6" ry="8" fill={color} />
    <Ellipse cx="47" cy="21" rx="6" ry="8" fill={color} />
  </Svg>
);

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>

      {/* Dekoratif daireler - splash ile aynı */}
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />
      <View style={styles.circleLeft} />

      <View style={styles.content}>

        {/* Logo - splash ile BİREBİR AYNI boyut ve pati konumları */}
        <View style={styles.topSection}>
          <View style={styles.ringOuter}>
            <View style={styles.ringInner}>
              <View style={styles.logoContainer}>
                {/* Büyük pati - splash: top:14, left:10, size:1 */}
                <View style={styles.bigPaw}>
                  <PawPrint size={1} color="#3DAA6E" />
                </View>
                {/* Küçük pati - splash: bottom:10, right:8, size:0.7 */}
                <View style={styles.smallPaw}>
                  <PawPrint size={0.7} color="#3DAA6E" />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Yazılar */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>PatiBul'a</Text>
          <Text style={styles.subtitle}>Hoş Geldiniz</Text>
        </View>

        {/* Butonlar */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.primaryBtnText}>Giriş Yap</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.secondaryBtnText}>Kayıt Ol</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3DAA6E',
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
  circleLeft: {
    position: 'absolute',
    top: '25%',
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#5ACC8A',
    opacity: 0.18,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 20 : 60,
    paddingBottom: Platform.OS === 'ios' ? 20 : 40,
  },
  topSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  ringOuter: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: width * 0.375,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    width: width * 0.52,
    height: width * 0.52,
    borderRadius: width * 0.26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Splash ile BİREBİR AYNI logoContainer
  logoContainer: {
    width: 124,
    height: 124,
    backgroundColor: '#fff',
    borderRadius: 62,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  // Splash ile BİREBİR AYNI bigPaw
  bigPaw: {
    position: 'absolute',
    top: 14,
    left: 10,
  },
  // Splash ile BİREBİR AYNI smallPaw
  smallPaw: {
    position: 'absolute',
    bottom: 10,
    right: 8,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '400',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 26,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 10,
  },
  primaryBtn: {
    backgroundColor: '#1a1a2e',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
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
    width: '100%',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  secondaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WelcomeScreen;