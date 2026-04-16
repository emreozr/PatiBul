// SCRUM-31: AllReportsScreen — Koordinatsız İlan Uyarısı
// Konum bilgisi olmayan ilanlar için uyarı göstergesi eklendi

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import config from '../../config';
import useApi from '../../hooks/useApi';
import ErrorScreen from '../../components/ErrorScreen';
import { ErrorBanner } from '../../components/ErrorScreen';

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

const radiusOptions = [5, 10, 25, 50];

// SCRUM-31: Koordinatsız ilan uyarı bileşeni
const NoLocationWarning = () => (
  <View style={styles.noLocationWarning}>
    <Text style={styles.noLocationIcon}>⚠️</Text>
    <Text style={styles.noLocationText}>Konum bilgisi yok</Text>
  </View>
);

const ReportCard = ({ item, onPress }) => {
  const type = typeConfig[item.report_type] || typeConfig.kayip;
  const status = statusConfig[item.status] || statusConfig.beklemede;
  const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;

  // SCRUM-31: Koordinat kontrolü
  const hasLocation = item.latitude !== null && item.latitude !== undefined
    && item.longitude !== null && item.longitude !== undefined;

  return (
    <TouchableOpacity style={styles.reportCard} onPress={() => onPress(item)}>
      {firstImage && (
        <Image
          source={{ uri: `${API_URL}${firstImage.image_url}` }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.cardContent}>
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
          {hasLocation ? (
            <Text style={styles.reportLocation} numberOfLines={1}>
              📍 {item.location_desc || 'Konum mevcut'}
            </Text>
          ) : (
            // SCRUM-31: Koordinatsız ilan için uyarı
            <NoLocationWarning />
          )}
          {item.distance_km !== null && item.distance_km !== undefined && (
            <Text style={styles.distanceBadge}>📏 {item.distance_km} km</Text>
          )}
        </View>

        <View style={styles.reportBottom}>
          <Text style={styles.reportUser}>👤 {item.user_name}</Text>
          <Text style={styles.reportTime}>
            {new Date(item.created_at).toLocaleDateString('tr-TR')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const AllReportsScreen = ({ navigation }) => {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('tumu');
  const [location, setLocation] = useState(null);
  const [radius, setRadius] = useState(10);
  const [locationEnabled, setLocationEnabled] = useState(false);

  const { loading, error, execute, retry } = useApi();

  const getLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Konum İzni', 'Yakınındaki ilanları görmek için konum iznine ihtiyaç var.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      setLocationEnabled(true);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    let endpoint = '/api/reports/';
    const params = new URLSearchParams();

    if (activeTab !== 'tumu') params.append('type', activeTab);
    if (locationEnabled && location) {
      params.append('lat', location.latitude);
      params.append('lon', location.longitude);
      params.append('radius', radius);
    }

    const queryString = params.toString();
    if (queryString) endpoint += `?${queryString}`;

    const result = await execute(endpoint, { token });
    if (result) {
      setReports(result.reports || []);
    }
  }, [activeTab, token, location, locationEnabled, radius, execute]);

  useEffect(() => { getLocation(); }, []);
  useEffect(() => { fetchReports(); }, [fetchReports]);

  const tabs = [
    { key: 'tumu', label: 'Tümü' },
    { key: 'kayip', label: '🚨 Kayıp' },
    { key: 'bulunan', label: '🐕 Bulunan' },
    { key: 'yarali', label: '🏥 Yaralı' },
  ];

  // SCRUM-31: Koordinatsız ilan sayısı gösterimi
  const noLocationCount = reports.filter(r =>
    r.latitude === null || r.latitude === undefined
  ).length;

  if (error && reports.length === 0) {
    return (
      <View style={styles.container}>
        <ErrorScreen errorType={error.type} onRetry={fetchReports} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && reports.length > 0 && (
        <ErrorBanner errorType={error.type} onRetry={fetchReports} />
      )}

      {/* SCRUM-31: Koordinatsız ilan uyarı banner'ı */}
      {noLocationCount > 0 && (
        <View style={styles.noLocationBanner}>
          <Text style={styles.noLocationBannerText}>
            ⚠️ {noLocationCount} ilanın konum bilgisi eksik
          </Text>
        </View>
      )}

      {/* Konum Filtresi */}
      <View style={styles.locationBar}>
        <TouchableOpacity
          style={[styles.locationToggle, locationEnabled && styles.locationToggleActive]}
          onPress={() => locationEnabled ? setLocationEnabled(false) : getLocation()}
        >
          <Text style={[styles.locationToggleText, locationEnabled && styles.locationToggleTextActive]}>
            {locationEnabled ? '📍 Konuma Göre Açık' : '📍 Konuma Göre Filtrele'}
          </Text>
        </TouchableOpacity>

        {locationEnabled && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.radiusScroll}>
            {radiusOptions.map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
                onPress={() => setRadius(r)}
              >
                <Text style={[styles.radiusBtnText, radius === r && styles.radiusBtnTextActive]}>
                  {r} km
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Tür Sekmeleri */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
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
          data={reports}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <ReportCard
              item={item}
              onPress={r => navigation.navigate('ReportDetail', { report: r })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>
                {locationEnabled ? `${radius} km çevresinde ilan yok` : 'Bu kategoride ilan yok'}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchReports}
          refreshing={loading}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  // SCRUM-31: Koordinatsız banner
  noLocationBanner: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#FFE69C',
  },
  noLocationBannerText: { fontSize: 13, color: '#856404', fontWeight: '600' },
  // SCRUM-31: Kart içi uyarı
  noLocationWarning: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFF3CD', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, alignSelf: 'flex-start',
  },
  noLocationIcon: { fontSize: 12 },
  noLocationText: { fontSize: 12, color: '#856404', fontWeight: '600' },
  locationBar: {
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  locationToggle: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#ddd', alignSelf: 'flex-start', marginBottom: 8,
  },
  locationToggleActive: { borderColor: '#4CAF50', backgroundColor: '#4CAF5011' },
  locationToggleText: { fontSize: 13, fontWeight: '600', color: '#444' },
  locationToggleTextActive: { color: '#4CAF50' },
  radiusScroll: { flexGrow: 0 },
  radiusBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: '#ddd', marginRight: 8, backgroundColor: '#f5f5f5',
  },
  radiusBtnActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  radiusBtnText: { fontSize: 12, color: '#666', fontWeight: '500' },
  radiusBtnTextActive: { color: '#fff', fontWeight: '700' },
  tabsContainer: {
    paddingHorizontal: 16, paddingVertical: 10, flexGrow: 0, flexShrink: 0,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8,
    backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#e0e0e0',
  },
  tabActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  tabText: { fontSize: 13, color: '#666', fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  loader: { marginTop: 40 },
  listContent: { padding: 16, paddingBottom: 30 },
  reportCard: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, overflow: 'hidden',
  },
  cardImage: { width: '100%', height: 180 },
  cardContent: { padding: 16 },
  reportCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  typeBadgeIcon: { fontSize: 12, marginRight: 4 },
  typeBadgeText: { fontSize: 12, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  reportAnimal: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4 },
  reportDesc: { fontSize: 13, color: '#555', marginBottom: 10 },
  reportFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reportLocation: { fontSize: 12, color: '#888', flex: 1 },
  distanceBadge: { fontSize: 12, color: '#4CAF50', fontWeight: '600', marginLeft: 8 },
  reportBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  reportUser: { fontSize: 12, color: '#4CAF50', fontWeight: '500' },
  reportTime: { fontSize: 12, color: '#aaa' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#aaa' },
});

export default AllReportsScreen;
