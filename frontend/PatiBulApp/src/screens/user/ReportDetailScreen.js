import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import config from '../../config';

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

const ReportDetailScreen = ({ route }) => {
  const { report } = route.params;
  const { token } = useAuth();
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  const type = typeConfig[report.report_type] || typeConfig.kayip;
  const status = statusConfig[report.status] || statusConfig.beklemede;

  const fetchResponses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reports/${report.id}/responses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setResponses(data.responses || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [report.id, token]);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Tip Banner */}
      <View style={[styles.typeBanner, { backgroundColor: type.color + '22', borderColor: type.color }]}>
        <Text style={styles.typeBannerIcon}>{type.icon}</Text>
        <Text style={[styles.typeBannerText, { color: type.color }]}>{type.label}</Text>
        <View style={[styles.statusBadge, { backgroundColor: status.color + '22' }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

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

      {/* Veteriner Yanıtları */}
      <Text style={styles.sectionTitle}>Veteriner Yanıtları</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
      ) : responses.length === 0 ? (
        <View style={styles.noResponseCard}>
          <Text style={styles.noResponseIcon}>⏳</Text>
          <Text style={styles.noResponseText}>Henüz veteriner yanıtı yok</Text>
          <Text style={styles.noResponseSubtext}>
            Bildiriminiz veterinerler tarafından inceleniyor
          </Text>
        </View>
      ) : (
        responses.map(r => (
          <View key={r.id} style={styles.responseCard}>
            <View style={styles.responseHeader}>
              <Text style={styles.responseVet}>🏥 {r.vet_clinic || r.vet_name}</Text>
              <Text style={styles.responseTime}>
                {new Date(r.created_at).toLocaleDateString('tr-TR')}
              </Text>
            </View>
            <Text style={styles.responseMessage}>{r.message}</Text>
          </View>
        ))
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
  typeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  typeBannerIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  typeBannerText: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
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
  loader: {
    marginTop: 20,
  },
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
  noResponseIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  noResponseText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  noResponseSubtext: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
  },
  responseCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  responseVet: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007AFF',
  },
  responseTime: {
    fontSize: 12,
    color: '#aaa',
  },
  responseMessage: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  bottomSpace: {
    height: 40,
  },
});

export default ReportDetailScreen;