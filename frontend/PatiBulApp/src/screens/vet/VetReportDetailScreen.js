import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../styles/colors';
import { apiFetch, ApiError, ERROR_TYPES, ERROR_MESSAGES } from '../../services/api';

const statusConfig = {
  beklemede: { label: 'Beklemede', color: '#FF9500' },
  inceleniyor: { label: 'İnceleniyor', color: '#007AFF' },
  tamamlandi: { label: 'Tamamlandı', color: '#34C759' },
};

const VetReportDetailScreen = ({ route }) => {
  const { report } = route.params;
  const { token } = useAuth();

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(report.status);
  const [isMapVisible, setIsMapVisible] = useState(false);

  const currentStatus = statusConfig[status];

  const handleRespond = async () => {
    if (!message.trim()) {
      Alert.alert('Hata', 'Lütfen bir mesaj yazın.');
      return;
    }

    setLoading(true);
    try {
      await apiFetch(`/api/reports/${report.id}/respond`, {
        method: 'POST',
        token,
        body: { message },
      });

      setStatus('inceleniyor');
      setMessage('');
      Alert.alert('Başarılı', 'Yanıtınız gönderildi.');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.type === ERROR_TYPES.CLIENT) {
          Alert.alert('Hata', error.data?.error || error.message);
        } else {
          const errorInfo = ERROR_MESSAGES[error.type] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
          Alert.alert(errorInfo.title, errorInfo.message);
        }
      } else {
        Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamıyor.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async newStatus => {
    try {
      await apiFetch(`/api/reports/${report.id}/status`, {
        method: 'PUT',
        token,
        body: { status: newStatus },
      });

      setStatus(newStatus);
      Alert.alert('Başarılı', 'Durum güncellendi.');
    } catch (error) {
      if (error instanceof ApiError) {
        const errorInfo = ERROR_MESSAGES[error.type] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
        Alert.alert(errorInfo.title, errorInfo.message);
      } else {
        Alert.alert('Hata', 'Durum güncellenemedi.');
      }
    }
  };

  const typeLabel =
    report.report_type === 'kayip'
      ? '🚨 Kayıp'
      : report.report_type === 'yarali'
        ? '🏥 Yaralı'
        : '🐕 Bulunan';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Bildirim Bilgileri */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.animalType}>{report.animal_type}</Text>
          <View style={[styles.statusBadge, { backgroundColor: currentStatus.color + '22' }]}>
            <Text style={[styles.statusText, { color: currentStatus.color }]}>
              {currentStatus.label}
            </Text>
          </View>
        </View>

        <Text style={styles.label}>Bildirim Türü</Text>
        <Text style={styles.value}>{typeLabel}</Text>

        <Text style={styles.label}>Açıklama</Text>
        <Text style={styles.value}>{report.description}</Text>

        <Text style={styles.label}>Konum</Text>
        {report.location_desc ? (
          <Text style={[styles.value, { marginBottom: 8 }]}>
            <Text style={{ fontWeight: '600' }}>Konum Açıklaması: </Text>
            {report.location_desc}
          </Text>
        ) : null}

        {report.latitude && report.longitude ? (
          <TouchableOpacity
            style={styles.mapPreviewContainer}
            onPress={() => setIsMapVisible(true)}
            activeOpacity={0.9}
          >
            <MapView
              style={styles.mapPreview}
              provider={PROVIDER_DEFAULT}
              initialRegion={{
                latitude: report.latitude,
                longitude: report.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
              pointerEvents="none"
            >
              <Marker coordinate={{ latitude: report.latitude, longitude: report.longitude }} />
            </MapView>
            <View style={styles.mapOverlay}>
              <Text style={styles.mapOverlayText}>Büyütmek için dokunun</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <Text style={styles.value}>Konum belirtilmedi</Text>
        )}

        <Text style={styles.label}>Gönderen</Text>
        <Text style={styles.value}>{report.user_name}</Text>

        <Text style={styles.label}>Tarih</Text>
        <Text style={styles.value}>
          {new Date(report.created_at).toLocaleDateString('tr-TR')}
        </Text>
      </View>

      {/* Durum Güncelle */}
      <Text style={styles.sectionTitle}>Durum Güncelle</Text>
      <View style={styles.statusRow}>
        {Object.entries(statusConfig).map(([key, val]) => (
          <TouchableOpacity
            key={key}
            style={[styles.statusBtn, status === key && { backgroundColor: val.color }]}
            onPress={() => handleStatusUpdate(key)}
          >
            <Text style={[styles.statusBtnText, status === key && styles.statusBtnTextActive]}>
              {val.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Yanıt Gönder */}
      <Text style={styles.sectionTitle}>Yanıt Gönder</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Hayvan sahibine mesajınızı yazın..."
        placeholderTextColor="#aaa"
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} />
      ) : (
        <TouchableOpacity style={styles.submitBtn} onPress={handleRespond}>
          <Text style={styles.submitBtnText}>Yanıt Gönder</Text>
        </TouchableOpacity>
      )}

      <View style={styles.bottomSpace} />

      {report.latitude && report.longitude && (
        <Modal visible={isMapVisible} animationType="slide" transparent={false}>
          <View style={styles.fullScreenMapContainer}>
            <TouchableOpacity
              style={styles.closeMapBtn}
              onPress={() => setIsMapVisible(false)}
            >
              <Text style={styles.closeMapText}>✕</Text>
            </TouchableOpacity>
            <MapView
              style={styles.fullScreenMap}
              provider={PROVIDER_DEFAULT}
              initialRegion={{
                latitude: report.latitude,
                longitude: report.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker coordinate={{ latitude: report.latitude, longitude: report.longitude }} />
            </MapView>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 20,
  },
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  animalType: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  statusBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  statusBtnTextActive: {
    color: '#fff',
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpace: {
    height: 40,
  },
  mapPreviewContainer: {
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mapPreview: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 6,
    alignItems: 'center',
  },
  mapOverlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fullScreenMapContainer: {
    flex: 1,
  },
  fullScreenMap: {
    flex: 1,
  },
  closeMapBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  closeMapText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default VetReportDetailScreen;