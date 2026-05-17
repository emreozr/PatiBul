import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Ellipse, Line, G } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const PawPrint = ({ size = 1, color = '#3DAA6E' }) => (
  <Svg width={80 * size} height={80 * size} viewBox="0 0 60 60">
    {/* Ana topuk */}
    <Ellipse cx="30" cy="42" rx="13" ry="11" fill={color} />
    {/* Parmak uçları - aralarında boşluk */}
    <Ellipse cx="11" cy="24" rx="6" ry="8" fill={color} />
    <Ellipse cx="22" cy="17" rx="6" ry="8" fill={color} />
    <Ellipse cx="35" cy="15" rx="6" ry="8" fill={color} />
    <Ellipse cx="47" cy="21" rx="6" ry="8" fill={color} />
  </Svg>
);

const SplashScreen = () => {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(dotsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>

      {/* Arka plan dekoratif daireler */}
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />
      <View style={styles.circleLeft} />

      {/* Logo dairesi */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        {/* Büyük pati */}
        <View style={styles.bigPaw}>
          <PawPrint size={1} color="#3DAA6E" />
        </View>
        {/* Küçük pati */}
        <View style={styles.smallPaw}>
          <PawPrint size={0.7} color="#3DAA6E" />
        </View>
      </Animated.View>

      {/* PatiBul yazısı */}
      <Animated.Text style={[styles.title, { opacity: textOpacity }]}>
        PatiBul
      </Animated.Text>

      {/* Nokta süsü */}
      <Animated.View style={[styles.dotsRow, { opacity: textOpacity }]}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </Animated.View>

      {/* Alt başlık */}
      <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
        KAYIP HAYVAN TAKİP
      </Animated.Text>

      {/* Separator */}
      <Animated.View style={[styles.separator, { opacity: subtitleOpacity }]} />

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: subtitleOpacity }]}>
        Kayıp patileri birlikte buluyoruz
      </Animated.Text>

      {/* Loading dots */}
      <Animated.View style={[styles.loadingDots, { opacity: dotsOpacity }]}>
        <View style={[styles.loadingDot, { opacity: 0.9 }]} />
        <View style={[styles.loadingDot, { opacity: 0.45 }]} />
        <View style={[styles.loadingDot, { opacity: 0.2 }]} />
      </Animated.View>

      {/* Versiyon */}
      <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3DAA6E',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Arka plan dekorasyonu
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
    top: height * 0.2,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#5ACC8A',
    opacity: 0.18,
  },

  // Logo
  logoContainer: {
    width: 124,
    height: 124,
    backgroundColor: '#fff',
    borderRadius: 62,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  bigPaw: {
    position: 'absolute',
    top: 14,
    left: 10,
  },
  smallPaw: {
    position: 'absolute',
    bottom: 10,
    right: 8,
  },

  // Yazılar
  title: {
    fontSize: 54,
    fontWeight: '400',
    color: '#fff',
    letterSpacing: 3,
    marginBottom: 8,
    fontFamily: 'System',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  subtitle: {
    fontSize: 13.5,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 3,
    marginBottom: 12,
  },
  separator: {
    width: 90,
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginBottom: 12,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 60,
  },

  // Loading
  loadingDots: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
    gap: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  version: {
    position: 'absolute',
    bottom: 36,
    fontSize: 11,
    color: 'rgba(255,255,255,0.28)',
  },
});

export default SplashScreen;