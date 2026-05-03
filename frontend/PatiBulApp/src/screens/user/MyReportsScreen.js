// SCRUM-54: Bildirim silme özelliği
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';
import ErrorScreen from '../../components/ErrorScreen';
import { ErrorBanner } from '../../components/ErrorScreen';
import config from '../../config';

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

const MyReportCard = ({ item, onPress, onDelete, onFound, onClose }) => {
  const type = typeConfig[item.report_type] || typeConfig.kayip;
  const status = statusConfig[item.status] || statusConfig.beklemede;
  const isActive = item.report_type !== 'bulunan' && item.status !== 'tamamlandi';

  const handleDelete = () => {
    Alert.alert(
      'Bildirimi Sil',
      'Bu bildirimi silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => onDelete(item.id) },
      ]
    );
  };

  const handleClose = () => {
    Alert.alert(
      'İlanı Kapat',
      'Hayvanınız bulundu mu? Bu ilanı kapatmak istediğinize emin misiniz? İlan bulunan hayvanlar listesine taşınacak.',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Evet, Kapat', style: 'default', onPress: () => onClose(item.id) },
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.reportCard} onPress={() => onPress(item)}>
      <View style={styles.reportCardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: type.color + '22' }]}>
          <Text style={styles.typeBadgeIcon}>{type.icon}</Text>
          <Text style={[styles.typeBadgeText, { color: type.color }]}>{type.label}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '22' }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>🗑️</Text>
          </TouchableOpacity>
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

      {/* Aktif ilanlar için butonlar */}
      {isActive && (
        <View style={styles.actionRow}>
          {/* Buldum butonu */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.foundBtn]}
            onPress={() => onFound(item)}
          >
            <Text style={styles.foundBtnText}>🐾 Buldum!</Text>
          </TouchableOpacity>

          {/* İlanı Kapat butonu */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.closeBtn]}
            onPress={handleClose}
          >
            <Text style={styles.closeBtnText}>✅ Bulundu, Kapat</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const MyReportsScreen = ({ navigation }) => {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('aktif');
  const { loading, error, execute } = useApi();

  const fetchMyReports = useCallback(async () => {
    const result = await execute('/api/reports/my', { token });
    if (result) setReports(result.reports || []);
  }, [token, execute]);

  useEffect(() => { fetchMyReports(); }, [fetchMyReports]);

  const handleDelete = async (reportId) => {
    try {
      const response = await fetch(`${config.API_URL}/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setReports(prev => prev.filter(r => r.id !== reportId));
        Alert.alert('Başarılı', 'Bildirim silindi.');
      } else {
        const data = await response.json();
        Alert.alert('Hata', data.error || 'Silme işlemi başarısız.');
      }
    } catch (e) {
      Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
    }
  };

  const handleFound = (item) => {
    navigation.navigate('CreateReport', {
      type: 'bulunan',
      fromReport: {
        id: item.id,
        user_id: item.user_id,
        user_name: item.user_name,
        user_photo: item.user_photo,
        animal_type: item.animal_type,
      },
    });
  };

  const handleClose = async (reportId) => {
    try {
      const response = await fetch(`${config.API_URL}/api/reports/${reportId}/close`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        await fetchMyReports();
        Alert.alert('Başarılı', 'İlanınız kapatıldı ve bulunan hayvanlar listesine eklendi. 🎉');
      } else {
        const data = await response.json();
        Alert.alert('Hata', data.error || 'İşlem başarısız.');
      }
    } catch (e) {
      Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
    }
  };

  // Aktif ilanlar: kayip ve yarali, tamamlanmamış
  const activeReports = reports.filter(
    r => r.report_type !== 'bulunan' && r.status !== 'tamamlandi'
  );

  // Bulunan hayvanlar: bulunan tipindekiler veya tamamlananlar
  const foundReports = reports.filter(
    r => r.report_type === 'bulunan' || r.status === 'tamamlandi'
  );

  const displayReports = activeTab === 'aktif' ? activeReports : foundReports;

  const tabs = [
    { key: 'aktif', label: `Aktif İlanlar (${activeReports.length})` },
    { key: 'bulunan', label: `Bulunan Hayvanlarım (${foundReports.length})` },
  ];

  if (error && reports.length === 0) {
    return (
      <View style={styles.container}>
        <ErrorScreen errorType={error.type} onRetry={fetchMyReports} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && reports.length > 0 && (
        <ErrorBanner errorType={error.type} onRetry={fetchMyReports} />
      )}

      {/* Sekmeler */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
      >
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={displayReports}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <MyReportCard
              item={item}
              onPress={r => navigation.navigate('ReportDetail', { report: r })}
              onDelete={handleDelete}
              onFound={handleFound}
              onClose={handleClose}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>
                {activeTab === 'aktif' ? '📭' : '🐾'}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'aktif'
                  ? 'Aktif ilanınız yok'
                  : 'Henüz bulunan hayvanınız yok'}
              </Text>
              <Text style={styles.emptySubtext}>
                {activeTab === 'aktif'
                  ? 'Ana sayfadan bildirim oluşturabilirsiniz'
                  : 'Hayvanınız bulununca "Bulundu, Kapat" butonuna basın'}
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
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tabActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  tabText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    fontSize: 18,
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
    marginBottom: 10,
    backgroundColor: '#007AFF22',
    borderRadius: 8,
    padding: 8,
  },
  vetResponseBannerText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingVertical: 8,
    alignItems: 'center',
  },
  foundBtn: {
    backgroundColor: '#4ECDC411',
    borderColor: '#4ECDC4',
  },
  foundBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4ECDC4',
  },
  closeBtn: {
    backgroundColor: '#4CAF5011',
    borderColor: '#4CAF50',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4CAF50',
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
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});

export default MyReportsScreen;