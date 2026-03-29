import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import CustomButton from '../components/CustomButton';
import Colors from '../styles/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topSection}>
          <View style={[styles.circleRing, styles.ringOuter]}>
            <View style={[styles.circleRing, styles.ringInner]}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoIcon}>🐾</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>PatiBul'a</Text>
          <Text style={styles.subtitle}>Hoş Geldiniz</Text>
        </View>

        <View style={styles.buttonContainer}>
          <CustomButton
            title="Giriş Yap"
            onPress={() => navigation.navigate('Login')}
          />
          <CustomButton
            title="Kayıt Ol"
            type="secondary"
            onPress={() => navigation.navigate('Register')}
            style={styles.registerButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    marginTop: 40,
  },
  circleRing: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
  },
  ringOuter: {
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  ringInner: {
    width: width * 0.55,
    height: width * 0.55,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  logoContainer: {
    width: 120,
    height: 120,
    backgroundColor: Colors.white,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 60,
  },
  textContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2B4036',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  registerButton: {
  }
});

export default WelcomeScreen;
