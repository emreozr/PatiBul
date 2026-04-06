import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import config from '../../config';

const API_URL = config.API_URL;

const typeConfig = {
  kayip: { label: 'Kayıp', color: '#FF6B6B', icon: '🚨' },
  bulunan: { label: 'Bulunan', color: '#4ECDC4', icon: '🐕' },
  yarali: { label: 'Yaralı', color: '#FFE66D', icon: '🏥' },
};

const statusConfig = {
  beklemede: { label: 'Beklemede', color: '#FF9500' },
  inceleniyor: { label: 'İnceleniyor', color: '#007AFF' },
  tamamlandi: { label: 'Tamamlandı', color: '#34C759' },
};

const MyReportCard = ({ item, onPress }) => {
  const type = typeConfig[item.report_type] || typeConfig.kayip;
  const status = statusConfig[item.status] || statusConfig.beklemede;

  return (
    <TouchableOpacity style={styles.reportCard} onPress={() => onPress(item)}>
      <View style={styles.reportCardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: type.color + '22' }]}>
          <Text style={styles.typeBadgeIcon}>{type.icon}</Text>
          <Text style={[styles.typeBadgeText, { color: type.color }]}>{type.label}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.color + '22' }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      <Text style={styles.reportAnimal}>{item.animal_type}</Text>
      <Text style={styles.reportDesc} numberOfLines={2}>{item.description}</Text>
      <View style={styles.reportFooter}>
        <Text style={styles.reportLocation}>📍 {item.location_desc || 'Konum belirtilmedi'}</Text>
        <Text style={styles.reportTime}>
          {new Date(item.created_at).toLocaleDateString('tr-TR')}
        </Text>
      </View>
      {item.status === 'inceleniyor' && (
        <View style={styles.vetResponseBanner}>
          <Text style={styles.vetResponseBannerText}>🏥 Veteriner yanıt verdi — detaya bak</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const MyReportsScreen = ({ navigation }) => {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reports/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setReports(data.reports || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMyReports();
  }, [fetchMyReports]);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <MyReportCard
              item={item}
              onPress={r => navigation.navigate('ReportDetail', { report: r })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>Henüz bildiriminiz yok</Text>
              <Text style={styles.emptySubtext}>
                Ana sayfadan bildirim oluşturabilirsiniz
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchMyReports}
          refreshing={loading}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loader: {
    marginTop: 40,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  reportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  typeBadgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportAnimal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  reportDesc: {
    fontSize: 13,
    color: '#555',
    marginBottom: 10,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reportLocation: {
    fontSize: 12,
    color: '#888',
  },
  reportTime: {
    fontSize: 12,
    color: '#aaa',
  },
  vetResponseBanner: {
    marginTop: 8,
    backgroundColor: '#007AFF22',
    borderRadius: 8,
    padding: 8,
  },
  vetResponseBannerText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#aaa',
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#bbb',
  },
});

export default MyReportsScreen;