import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../styles/colors';
import config from '../../config';

const API_URL = config.API_URL;

const typeConfig = {
  kayip: { label: 'Kayıp', color: '#FF6B6B', icon: '🚨' },
  yarali: { label: 'Yaralı', color: '#FFE66D', icon: '🏥' },
  bulunan: { label: 'Bulunan', color: '#4ECDC4', icon: '🐕' },
};

const statusConfig = {
  beklemede: { label: 'Beklemede', color: '#FF9500' },
  inceleniyor: { label: 'İnceleniyor', color: '#007AFF' },
  tamamlandi: { label: 'Tamamlandı', color: '#34C759' },
};

const ReportCard = ({ item, onPress }) => {
  const type = typeConfig[item.report_type] || typeConfig.kayip;
  const status = statusConfig[item.status] || statusConfig.beklemede;
  const isCreatedRecently = (new Date() - new Date(item.created_at)) < 24 * 60 * 60 * 1000;
  const isNew = item.status === 'beklemede' && isCreatedRecently;

  return (
    <TouchableOpacity
      style={[
        styles.reportCard,
        isNew && { borderColor: '#FF9500', borderWidth: 1 }
      ]}
      onPress={() => onPress(item)}
    >
      <View style={styles.reportCardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: type.color + '22' }]}>
          <Text style={styles.typeBadgeIcon}>{type.icon}</Text>
          <Text style={[styles.typeBadgeText, { color: type.color }]}>{type.label}</Text>
        </View>
        <View style={styles.rightBadgesContainer}>
          {isNew && (
            <View style={styles.newBadgeInline}>
              <Text style={styles.newBadgeInlineText}>YENİ</Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: status.color + '22' }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.reportAnimal}>{item.animal_type}</Text>
      <Text style={styles.reportDesc} numberOfLines={2}>{item.description}</Text>
      <View style={styles.reportFooter}>
        <Text style={styles.reportLocation}>📍 {item.location_desc || 'Konum belirtilmedi'}</Text>
        <Text style={styles.reportTime}>{new Date(item.created_at).toLocaleDateString('tr-TR')}</Text>
      </View>
      <Text style={styles.reportUser}>Gönderen: {item.user_name}</Text>
    </TouchableOpacity>
  );
};

const VetHomeScreen = ({ navigation }) => {
  const { user, logout, token } = useAuth();
  const [activeTab, setActiveTab] = useState('beklemede');
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reports/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setAllReports(data.reports || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const tabs = [
    { key: 'beklemede', label: 'Bekleyenler' },
    { key: 'inceleniyor', label: 'İncelenenler' },
    { key: 'tamamlandi', label: 'Tamamlananlar' },
    { key: 'tumu', label: 'Tümü' },
  ];

  const stats = [
    { key: 'tumu', label: 'Toplam', value: allReports.length, color: '#fff' },
    { key: 'beklemede', label: 'Bekleyen', value: allReports.filter(r => r.status === 'beklemede').length, color: '#FF9500' },
    { key: 'inceleniyor', label: 'İncelenen', value: allReports.filter(r => r.status === 'inceleniyor').length, color: '#007AFF' },
    { key: 'tamamlandi', label: 'Tamamlanan', value: allReports.filter(r => r.status === 'tamamlandi').length, color: '#34C759' },
  ];

  const filteredReports = activeTab === 'tumu'
    ? allReports
    : allReports.filter(r => r.status === activeTab);

  const yaraliReports = filteredReports.filter(r => r.report_type === 'yarali').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const otherReports = filteredReports.filter(r => r.report_type !== 'yarali').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const displayReports = [...yaraliReports, ...otherReports];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Veteriner Paneli 🏥</Text>
          <Text style={styles.headerName}>{user?.clinic_name || user?.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => navigation.navigate('VetProfile')}
        >
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
        </TouchableOpacity>
      </View>

      {/* İstatistikler */}
      <View style={styles.statsRow}>
        {stats.map(s => (
          <TouchableOpacity
            key={s.label}
            style={[
              styles.statBox,
              activeTab === s.key && { backgroundColor: 'rgba(255,255,255,0.3)', borderWidth: 1, borderColor: s.color }
            ]}
            onPress={() => setActiveTab(s.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.statNumber, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
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

        {/* Liste */}
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={displayReports}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <ReportCard
                item={item}
                onPress={r => navigation.navigate('VetReportDetail', { report: r })}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>Bu kategoride bildirim yok</Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onRefresh={fetchReports}
            refreshing={loading}
          />
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerGreeting: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  headerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderBadgeContainer: {
    position: 'relative',
    marginRight: 16,
    padding: 4,
  },
  placeholderBadgeIcon: {
    fontSize: 24,
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    backgroundColor: '#FF3B30',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
    flexGrow: 0,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
    paddingHorizontal: 16,
    paddingBottom: 20,
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
  newBadgeInline: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 6,
  },
  newBadgeInlineText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rightBadgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  reportUser: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
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
    fontSize: 15,
    color: '#aaa',
  },
  logoutButton: {
    margin: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  logoutText: {
    color: '#FF6B6B',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default VetHomeScreen;