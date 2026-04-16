import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { ERROR_TYPES, ERROR_MESSAGES } from '../services/api';

const { width } = Dimensions.get('window');

const ErrorScreen = ({ errorType = ERROR_TYPES.UNKNOWN, onRetry, message, style }) => {
  const errorInfo = ERROR_MESSAGES[errorType] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
  const displayMessage = message || errorInfo.message;

  const getSecondaryIcon = () => {
    switch (errorType) {
      case ERROR_TYPES.NETWORK:
        return '🌐';
      case ERROR_TYPES.SERVER:
        return '🖥️';
      case ERROR_TYPES.TIMEOUT:
        return '⏳';
      default:
        return '❗';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.mainIcon}>{errorInfo.icon}</Text>
          </View>
          <View style={styles.secondaryIconCircle}>
            <Text style={styles.secondaryIcon}>{getSecondaryIcon()}</Text>
          </View>
        </View>

        <Text style={styles.title}>{errorInfo.title}</Text>
        <Text style={styles.message}>{displayMessage}</Text>

        <View style={styles.errorTypeBadge}>
          <Text style={styles.errorTypeText}>
            {errorType === ERROR_TYPES.NETWORK && 'Bağlantı yok'}
            {errorType === ERROR_TYPES.SERVER && 'Sunucu yanıt vermiyor'}
            {errorType === ERROR_TYPES.TIMEOUT && 'Bağlantı zaman aşımı'}
            {errorType === ERROR_TYPES.UNKNOWN && 'Bilinmeyen hata'}
          </Text>
        </View>

        {onRetry && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonIcon}>🔄</Text>
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.hint}>
          Sorun devam ederse uygulamayı kapatıp açmayı deneyin.
        </Text>
      </View>
    </View>
  );
};

export const ErrorBanner = ({ errorType = ERROR_TYPES.UNKNOWN, onRetry, message, style }) => {
  const errorInfo = ERROR_MESSAGES[errorType] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];

  const bgColor = errorType === ERROR_TYPES.SERVER
    ? '#FDECEA'
    : errorType === ERROR_TYPES.NETWORK
      ? '#FFF3CD'
      : '#FFF3CD';

  const textColor = errorType === ERROR_TYPES.SERVER
    ? '#C62828'
    : '#856404';

  const borderColor = errorType === ERROR_TYPES.SERVER
    ? '#F5B7B1'
    : '#FFE69C';

  return (
    <View style={[styles.bannerContainer, { backgroundColor: bgColor, borderColor: borderColor }, style]}>
      <View style={styles.bannerContent}>
        <Text style={styles.bannerIcon}>{errorInfo.icon}</Text>
        <View style={styles.bannerTextContainer}>
          <Text style={[styles.bannerTitle, { color: textColor }]}>
            {errorInfo.title}
          </Text>
          <Text style={[styles.bannerMessage, { color: textColor }]}>
            {message || errorInfo.message}
          </Text>
        </View>
      </View>
      {onRetry && (
        <TouchableOpacity
          style={[styles.bannerRetryBtn, { borderColor: textColor }]}
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <Text style={[styles.bannerRetryText, { color: textColor }]}>Tekrar Dene</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  content: {
    alignItems: 'center',
    maxWidth: width * 0.85,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 28,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  mainIcon: {
    fontSize: 44,
  },
  secondaryIconCircle: {
    position: 'absolute',
    bottom: -4,
    right: -8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#F5F7FA',
  },
  secondaryIcon: {
    fontSize: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a2e',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  errorTypeBadge: {
    backgroundColor: '#FFE8E0',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 28,
  },
  errorTypeText: {
    fontSize: 12,
    color: '#C0392B',
    fontWeight: '700',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  hint: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
  },

  bannerContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  bannerMessage: {
    fontSize: 12,
  },
  bannerRetryBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  bannerRetryText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ErrorScreen;
