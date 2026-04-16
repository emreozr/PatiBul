import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('⛔ ErrorBoundary yakaladı:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>🐾</Text>
            </View>

            <Text style={styles.title}>Bir Sorun Oluştu</Text>
            <Text style={styles.message}>
              Beklenmeyen bir hata meydana geldi. Endişelenmeyin, verileriniz güvende.
            </Text>

            <View style={styles.errorBadge}>
              <Text style={styles.errorBadgeText}>Uygulama hatası</Text>
            </View>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleRetry}
              activeOpacity={0.8}
            >
              <Text style={styles.retryIcon}>🔄</Text>
              <Text style={styles.retryText}>Tekrar Dene</Text>
            </TouchableOpacity>

            <Text style={styles.hint}>
              Sorun devam ederse uygulamayı kapatıp tekrar açın.
            </Text>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

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
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  icon: {
    fontSize: 44,
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
  errorBadge: {
    backgroundColor: '#FFE8E0',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 28,
  },
  errorBadgeText: {
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
  retryIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  retryText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  hint: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
  },
});

export default ErrorBoundary;
