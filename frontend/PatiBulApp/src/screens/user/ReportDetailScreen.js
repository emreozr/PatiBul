// SCRUM-32: Veteriner yanıtı uygulama içi bildirimi
// SCRUM-55: Bildirim düzenleme butonu eklendi

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  Image, Animated, TouchableOpacity,
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

const InAppNotification = ({ visible, message, onDismiss }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
      const timer = setTimeout(() => {
        Animated.timing(slideAnim, { toValue: -100, duration: 300, useNativeDriver: true }).start(onDismiss);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible]);
  if (!visible) return null;
  return (
    <Animated.View style={[styles.notification, { transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.notificationIcon}>🏥</Text>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>Yeni Veteriner Yanıtı</Text>
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
  const prevResponseCount = useRef(0);
  const isFirstLoad = useRef(true);

  const type = typeConfig[report.report_type] || typeConfig.kayip;
  const status = statusConfig[report.status] || statusConfig.beklemede;
  const { loading, error, execute } = useApi();

  const fetchResponses = useCallback(async () => {
    const result = await execute(`/api/reports/${report.id}/responses`, { token });
    if (result) {
      const newResponses = result.responses || [];
      if (!isFirstLoad.current && newResponses.length > prevResponseCount.current) {
        setNotification({ visible: true, message: newResponses[0]?.message || 'Yeni yanıt geldi' });
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

  // SCRUM-55: Kullanıcı kendi ilanını mı görüyor?
  const canEdit = user && String(report.user_id) === String(user.id);

  return (
    <View style={styles.wrapper}>
      <InAppNotification
        visible={notification.visible}
        message={notification.message}
        onDismiss={() => setNotification({ visible: false, message: '' })}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Tip Banner */}
        <View style={[styles.typeBanner, { backgroundColor: type.color + '22', borderColor: type.color }]}>
          <Text style={styles.typeBannerIcon}>{type.icon}</Text>
          <Text style={[styles.typeBannerText, { color: type.color }]}>{type.label}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '22' }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        {/* SCRUM-55: Düzenle butonu - sadece ilan sahibine göster */}
        {canEdit && (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditReport', { report })}
          >
            <Text style={styles.editBtnText}>✏️ Bildirimi Düzenle</Text>
          </TouchableOpacity>
        )}

        {/* Fotoğraflar */}
        {report.images && report.images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
            {report.images.map(img => (
              <Image key={img.id} source={{ uri: `${API_URL}${img.image_url}` }}
                style={styles.reportImage} resizeMode="cover" />
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
          <Text style={styles.value}>{new Date(report.created_at).toLocaleDateString('tr-TR')}</Text>
        </View>

        {/* Veteriner Yanıtları */}
        <View style={styles.responsesHeader}>
          <Text style={styles.sectionTitle}>Veteriner Yanıtları</Text>
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
            <Text style={styles.noResponseText}>Henüz veteriner yanıtı yok</Text>
            <Text style={styles.noResponseSubtext}>Bildiriminiz veterinerler tarafından inceleniyor</Text>
          </View>
        ) : (
          responses.map(r => (
            <View key={r.id} style={styles.responseCard}>
              <View style={styles.responseHeader}>
                <Text style={styles.responseVet}>🏥 {r.vet_clinic || r.vet_name}</Text>
                <Text style={styles.responseTime}>{new Date(r.created_at).toLocaleDateString('tr-TR')}</Text>
              </View>
              <Text style={styles.responseMessage}>{r.message}</Text>
            </View>
          ))
        )}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  notification: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999,
    backgroundColor: '#1a1a2e', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10,
  },
  notificationIcon: { fontSize: 24, marginRight: 12 },
  notificationContent: { flex: 1 },
  notificationTitle: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 2 },
  notificationMessage: { fontSize: 12, color: '#aaa' },
  notificationClose: { fontSize: 16, color: '#888', padding: 4 },
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
  typeBanner: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 12,
  },
  typeBannerIcon: { fontSize: 24, marginRight: 8 },
  typeBannerText: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  editBtn: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5,
    borderColor: '#1a1a2e', padding: 10, alignItems: 'center', marginBottom: 16,
  },
  editBtnText: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  imagesScroll: { marginBottom: 16 },
  reportImage: { width: 280, height: 200, borderRadius: 12, marginRight: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  label: { fontSize: 12, color: '#aaa', fontWeight: '600', marginTop: 12, marginBottom: 4 },
  value: { fontSize: 15, color: '#333' },
  responsesHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e' },
  responsesCountBadge: { backgroundColor: '#007AFF', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  responsesCount: { fontSize: 12, color: '#fff', fontWeight: '700' },
  loader: { marginTop: 20 },
  inlineError: { flex: 0, paddingVertical: 40 },
  noResponseCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 24, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  noResponseIcon: { fontSize: 36, marginBottom: 10 },
  noResponseText: { fontSize: 15, fontWeight: '600', color: '#555', marginBottom: 6 },
  noResponseSubtext: { fontSize: 12, color: '#aaa', textAlign: 'center' },
  responseCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    borderLeftWidth: 4, borderLeftColor: '#007AFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  responseHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  responseVet: { fontSize: 13, fontWeight: '700', color: '#007AFF' },
  responseTime: { fontSize: 12, color: '#aaa' },
  responseMessage: { fontSize: 14, color: '#333', lineHeight: 20 },
  bottomSpace: { height: 40 },
});

export default ReportDetailScreen;
