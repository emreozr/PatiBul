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
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../styles/colors';
import config from '../../config';

const API_URL = config.API_URL;

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

  const currentStatus = statusConfig[status];

  const handleRespond = async () => {
    if (!message.trim()) {
      Alert.alert('Hata', 'Lütfen bir mesaj yazın.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reports/${report.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Hata', data.error || 'Yanıt gönderilemedi.');
        return;
      }

      setStatus('inceleniyor');
      setMessage('');
      Alert.alert('Başarılı', 'Yanıtınız gönderildi.');
    } catch (e) {
      Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamıyor.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async newStatus => {
    try {
      const response = await fetch(`${API_URL}/api/reports/${report.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setStatus(newStatus);
        Alert.alert('Başarılı', 'Durum güncellendi.');
      }
    } catch (e) {
      Alert.alert('Hata', 'Durum güncellenemedi.');
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
        <Text style={styles.value}>{report.location_desc || 'Belirtilmedi'}</Text>

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
});

export default VetReportDetailScreen;