// SCRUM-32: Veteriner yanıtı uygulama içi bildirimi
// SCRUM-55: Bildirim düzenleme butonu eklendi
// SCRUM-62: Bildirim paylaşma özelliği eklendi
// Kullanıcı veterinere mesaj gönderebilir

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Animated,
  TouchableOpacity,
  Share,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import config from '../../config';
import useApi from '../../hooks/useApi';
import ErrorScreen from '../../components/ErrorScreen';

const API_URL = config.API_URL;

const typeConfig = {
  kayip: { label: 'Kayıp İlanı', color: '#FF6B6B', icon: '🚨' },
  bulunan: { label: 'Bulunan Hayvan', color: '#4ECDC4', icon: '🐕' },
  yarali: { label: 'Yaralı Hayvan', color: '#FFE66D', icon: '🏥' },
};

const statusConfig = {
  beklemede: { label: 'Beklemede', color: '#FF9500' },
  inceleniyor: { label: 'İnceleniyor', color: '#007AFF' },
  tamamlandi: { label: 'Tamamlandı', color: '#34C759' },
};

const isUserMessage = (msg) => msg?.startsWith('👤 İlan Sahibi:');

const InAppNotification = ({ visible, message, onDismiss }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
      const timer = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(onDismiss);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.notification, { transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.notificationIcon}>🏥</Text>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>Yeni Mesaj</Text>
        <Text style={styles.notificationMessage} numberOfLines={1}>{message}</Text>
      </View>
      <TouchableOpacity onPress={onDismiss}>
        <Text style={styles.notificationClose}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ReportDetailScreen = ({ route, navigation }) => {
  const { report } = route.params;
  const { token, user } = useAuth();
  const [responses, setResponses] = useState([]);
  const [notification, setNotification] = useState({ visible: false, message: '' });
  const [userMessage, setUserMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const prevResponseCount = useRef(0);
  const isFirstLoad = useRef(true);

  const type = typeConfig[report.report_type] || typeConfig.kayip;
  const status = statusConfig[report.status] || statusConfig.beklemede;
  const { loading, error, execute } = useApi();

  const isOwner = user && String(report.user_id) === String(user.id);

  const fetchResponses = useCallback(async () => {
    const result = await execute(`/api/reports/${report.id}/responses`, { token });
    if (result) {
      const newResponses = result.responses || [];

      if (!isFirstLoad.current && newResponses.length > prevResponseCount.current) {
        const lastMsg = newResponses[newResponses.length - 1];
        // Sadece veteriner mesajı gelince bildirim göster
        if (!isUserMessage(lastMsg?.message)) {
          setNotification({
            visible: true,
            message: lastMsg?.message || 'Yeni mesaj geldi',
          });
        }
      }

      prevResponseCount.current = newResponses.length;
      isFirstLoad.current = false;
      setResponses(newResponses);
    }
  }, [report.id, token, execute]);

  useEffect(() => {
    fetchResponses();
    const interval = setInterval(fetchResponses, 30000);
    return () => clearInterval(interval);
  }, [fetchResponses]);

  const handleShare = async () => {
    const typeLabel = typeConfig[report.report_type]?.label || 'İlan';
    const typeIcon = typeConfig[report.report_type]?.icon || '🐾';
    const shareMessage = [
      `${typeIcon} ${typeLabel} — PatiBul`,
      ``,
      `🐾 Hayvan Türü: ${report.animal_type}`,
      `📝 Açıklama: ${report.description}`,
      `📍 Konum: ${report.location_desc || 'Belirtilmedi'}`,
      `👤 İlan Sahibi: ${report.user_name}`,
      `📅 Tarih: ${new Date(report.created_at).toLocaleDateString('tr-TR')}`,
      ``,
      `PatiBul uygulaması ile kayıp hayvanları birlikte bulalım! 🐾`,
    ].join('\n');
    try {
      await Share.share({ message: shareMessage, title: `${typeIcon} ${typeLabel} — PatiBul` });
    } catch (e) {
      console.error('Paylaşma hatası:', e);
    }
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim()) {
      Alert.alert('Hata', 'Lütfen bir mesaj yazın.');
      return;
    }
    setSendingMessage(true);
    try {
      const response = await fetch(`${API_URL}/api/reports/${report.id}/user-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage.trim() }),
      });
      const data = await response.json();
      if (response.ok) {
        setUserMessage('');
        fetchResponses();
      } else {
        Alert.alert('Hata', data.error || 'Mesaj gönderilemedi.');
      }
    } catch (e) {
      Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamıyor.');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <InAppNotification
        visible={notification.visible}
        message={notification.message}
        onDismiss={() => setNotification({ visible: false, message: '' })}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

          {/* Tip Banner */}
          <View style={[styles.typeBanner, { backgroundColor: type.color + '22', borderColor: type.color }]}>
            <Text style={styles.typeBannerIcon}>{type.icon}</Text>
            <Text style={[styles.typeBannerText, { color: type.color }]}>{type.label}</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.color + '22' }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          {/* Aksiyon butonları */}
          <View style={styles.actionRow}>
            {isOwner && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.editBtn]}
                onPress={() => navigation.navigate('EditReport', { report })}
              >
                <Text style={styles.editBtnText}>✏️ Düzenle</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, styles.shareBtn]}
              onPress={handleShare}
            >
              <Text style={styles.shareBtnText}>📤 Paylaş</Text>
            </TouchableOpacity>
          </View>

          {/* Fotoğraflar */}
          {report.images && report.images.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imagesScroll}
            >
              {report.images.map(img => (
                <Image
                  key={img.id}
                  source={{ uri: `${API_URL}${img.image_url}` }}
                  style={styles.reportImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          )}

          {/* Bildirim Bilgileri */}
          <View style={styles.card}>
            <Text style={styles.label}>Hayvan Türü</Text>
            <Text style={styles.value}>{report.animal_type}</Text>

            <Text style={styles.label}>Açıklama</Text>
            <Text style={styles.value}>{report.description}</Text>

            <Text style={styles.label}>Konum</Text>
            <Text style={styles.value}>{report.location_desc || 'Belirtilmedi'}</Text>

            <Text style={styles.label}>İlan Sahibi</Text>
            <Text style={styles.value}>{report.user_name}</Text>

            <Text style={styles.label}>Tarih</Text>
            <Text style={styles.value}>
              {new Date(report.created_at).toLocaleDateString('tr-TR')}
            </Text>
          </View>

          {/* Sohbet */}
          <View style={styles.responsesHeader}>
            <Text style={styles.sectionTitle}>Sohbet</Text>
            {responses.length > 0 && (
              <View style={styles.responsesCountBadge}>
                <Text style={styles.responsesCount}>{responses.length}</Text>
              </View>
            )}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
          ) : error ? (
            <ErrorScreen errorType={error.type} onRetry={fetchResponses} style={styles.inlineError} />
          ) : responses.length === 0 ? (
            <View style={styles.noResponseCard}>
              <Text style={styles.noResponseIcon}>⏳</Text>
              <Text style={styles.noResponseText}>Henüz mesaj yok</Text>
              <Text style={styles.noResponseSubtext}>
                Bildiriminiz veterinerler tarafından inceleniyor
              </Text>
            </View>
          ) : (
            responses.map(r => {
              const isUser = isUserMessage(r.message);
              return (
                <View
                  key={r.id}
                  style={[
                    styles.responseCard,
                    isUser ? styles.userResponseCard : styles.vetResponseCard,
                  ]}
                >
                  <View style={styles.responseHeader}>
                    <Text style={[
                      styles.responseVet,
                      isUser ? styles.userResponseVet : styles.vetResponseVetName,
                    ]}>
                      {isUser ? '👤 İlan Sahibi' : `🏥 ${r.vet_clinic || r.vet_name}`}
                    </Text>
                    <Text style={styles.responseTime}>
                      {new Date(r.created_at).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                  <Text style={styles.responseMessage}>
                    {isUser ? r.message.replace('👤 İlan Sahibi: ', '') : r.message}
                  </Text>
                </View>
              );
            })
          )}

          {/* Kullanıcı mesaj kutusu - sadece ilan sahibine ve mesaj varsa */}
          {isOwner && responses.length > 0 && (
            <View style={styles.messageBox}>
              <TextInput
                style={styles.messageInput}
                placeholder="Veterinere mesaj yaz..."
                placeholderTextColor="#aaa"
                value={userMessage}
                onChangeText={setUserMessage}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={styles.messageSendBtn}
                onPress={handleSendMessage}
                disabled={sendingMessage}
              >
                {sendingMessage ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.messageSendBtnText}>Gönder</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  notification: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: '#1a1a2e',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  notificationIcon: { fontSize: 24, marginRight: 12 },
  notificationContent: { flex: 1 },
  notificationTitle: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 2 },
  notificationMessage: { fontSize: 12, color: '#aaa' },
  notificationClose: { fontSize: 16, color: '#888', padding: 4 },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 20,
  },
  typeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  typeBannerIcon: { fontSize: 24, marginRight: 8 },
  typeBannerText: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 10,
    alignItems: 'center',
  },
  editBtn: {
    backgroundColor: '#fff',
    borderColor: '#1a1a2e',
  },
  editBtnText: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  shareBtn: {
    backgroundColor: '#4CAF5011',
    borderColor: '#4CAF50',
  },
  shareBtnText: { fontSize: 14, fontWeight: '700', color: '#4CAF50' },
  imagesScroll: { marginBottom: 16 },
  reportImage: { width: 280, height: 200, borderRadius: 12, marginRight: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  label: { fontSize: 12, color: '#aaa', fontWeight: '600', marginTop: 12, marginBottom: 4 },
  value: { fontSize: 15, color: '#333' },
  responsesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e' },
  responsesCountBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  responsesCount: { fontSize: 12, color: '#fff', fontWeight: '700' },
  loader: { marginTop: 20 },
  inlineError: { flex: 0, paddingVertical: 40 },
  noResponseCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  noResponseIcon: { fontSize: 36, marginBottom: 10 },
  noResponseText: { fontSize: 15, fontWeight: '600', color: '#555', marginBottom: 6 },
  noResponseSubtext: { fontSize: 12, color: '#aaa', textAlign: 'center' },
  responseCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  vetResponseCard: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  userResponseCard: {
    backgroundColor: '#4CAF5011',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  responseVet: { fontSize: 13, fontWeight: '700' },
  vetResponseVetName: { color: '#007AFF' },
  userResponseVet: { color: '#4CAF50' },
  responseTime: { fontSize: 12, color: '#aaa' },
  responseMessage: { fontSize: 14, color: '#333', lineHeight: 20 },
  messageBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 60,
    marginBottom: 10,
  },
  messageSendBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  messageSendBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  bottomSpace: { height: 40 },
});

export default ReportDetailScreen;