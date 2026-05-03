// SCRUM-31: Koordinatsız ilan uyarısı
// SCRUM-56: Harita görünümü eklendi
// SCRUM-60: Arama çubuğu ve gelişmiş filtreleme eklendi

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert, Image, Dimensions,
  TextInput,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import config from '../../config';
import useApi from '../../hooks/useApi';
import ErrorScreen from '../../components/ErrorScreen';
import { ErrorBanner } from '../../components/ErrorScreen';

const API_URL = config.API_URL;
const { width } = Dimensions.get('window');

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
const animalTypeOptions = ['Tümü', 'Kedi', 'Köpek', 'Kuş', 'Tavşan', 'Diğer'];
const sortOptions = [
  { key: 'newest', label: 'En Yeni' },
  { key: 'oldest', label: 'En Eski' },
];

const NoLocationWarning = () => (
  <View style={styles.noLocationWarning}>
    <Text style={styles.noLocationIcon}>⚠️</Text>
    <Text style={styles.noLocationText}>Konum bilgisi yok</Text>
  </View>
);

const ReportCard = ({ item, onPress, onFound }) => {
  const type = typeConfig[item.report_type] || typeConfig.kayip;
  const status = statusConfig[item.status] || statusConfig.beklemede;
  const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;
  const hasLocation = item.latitude != null && item.longitude != null;

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
            <NoLocationWarning />
          )}
          {item.distance_km != null && (
            <Text style={styles.distanceBadge}>📏 {item.distance_km} km</Text>
          )}
        </View>
        <View style={styles.reportBottom}>
          <Text style={styles.reportUser}>👤 {item.user_name}</Text>
          <Text style={styles.reportTime}>
            {new Date(item.created_at).toLocaleDateString('tr-TR')}
          </Text>
        </View>

        {/* Buldum butonu */}
        <TouchableOpacity
          style={styles.foundBtn}
          onPress={() => onFound(item)}
        >
          <Text style={styles.foundBtnText}>🐾 Buldum!</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const MapViewComponent = ({ reports, location, onMarkerPress }) => {
  const [selectedReport, setSelectedReport] = useState(null);
  const reportsWithLocation = reports.filter(r => r.latitude != null && r.longitude != null);

  const initialRegion = location ? {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  } : {
    latitude: 41.0082,
    longitude: 28.9784,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <View style={styles.mapContainer}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
      >
        {reportsWithLocation.map(report => {
          const type = typeConfig[report.report_type] || typeConfig.kayip;
          return (
            <Marker
              key={report.id}
              coordinate={{ latitude: report.latitude, longitude: report.longitude }}
              onPress={() => setSelectedReport(report)}
            >
              <View style={[styles.mapMarker, { borderColor: type.color }]}>
                <Text style={styles.mapMarkerEmoji}>{type.icon}</Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {selectedReport && (
        <TouchableOpacity
          style={styles.mapPopup}
          onPress={() => { onMarkerPress(selectedReport); setSelectedReport(null); }}
        >
          <View style={styles.mapPopupHeader}>
            <Text style={styles.mapPopupType}>
              {typeConfig[selectedReport.report_type]?.icon} {typeConfig[selectedReport.report_type]?.label}
            </Text>
            <TouchableOpacity onPress={() => setSelectedReport(null)}>
              <Text style={styles.mapPopupClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.mapPopupAnimal}>{selectedReport.animal_type}</Text>
          <Text style={styles.mapPopupDesc} numberOfLines={2}>{selectedReport.description}</Text>
          <Text style={styles.mapPopupLink}>Detayı gör →</Text>
        </TouchableOpacity>
      )}

      {reportsWithLocation.length === 0 && (
        <View style={styles.mapEmpty}>
          <Text style={styles.mapEmptyText}>
            Haritada gösterilecek konum bilgisi olan ilan yok
          </Text>
        </View>
      )}
    </View>
  );
};

const AllReportsScreen = ({ navigation }) => {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('tumu');
  const [location, setLocation] = useState(null);
  const [radius, setRadius] = useState(10);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [searchText, setSearchText] = useState('');
  const [selectedAnimalType, setSelectedAnimalType] = useState('Tümü');
  const [sortOrder, setSortOrder] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const { loading, error, execute } = useApi();

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
    const qs = params.toString();
    if (qs) endpoint += `?${qs}`;
    const result = await execute(endpoint, { token });
    if (result) setReports(result.reports || []);
  }, [activeTab, token, location, locationEnabled, radius, execute]);

  useEffect(() => { getLocation(); }, []);
  useEffect(() => { fetchReports(); }, [fetchReports]);

  // Buldum butonuna basınca bulunan hayvan bildirimi sayfasına yönlendir
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

  const filteredReports = reports
    .filter(r => {
      const searchLower = searchText.toLowerCase();
      const matchesSearch =
        searchText === '' ||
        r.animal_type?.toLowerCase().includes(searchLower) ||
        r.description?.toLowerCase().includes(searchLower) ||
        r.location_desc?.toLowerCase().includes(searchLower) ||
        r.user_name?.toLowerCase().includes(searchLower);
      const matchesAnimalType =
        selectedAnimalType === 'Tümü' || r.animal_type === selectedAnimalType;
      return matchesSearch && matchesAnimalType;
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      return new Date(a.created_at) - new Date(b.created_at);
    });

  const activeFilterCount = [
    selectedAnimalType !== 'Tümü',
    sortOrder !== 'newest',
    locationEnabled,
  ].filter(Boolean).length;

  const tabs = [
    { key: 'tumu', label: 'Tümü' },
    { key: 'kayip', label: '🚨 Kayıp' },
    { key: 'bulunan', label: '🐕 Bulunan' },
    { key: 'yarali', label: '🏥 Yaralı' },
  ];

  const noLocationCount = reports.filter(r => r.latitude == null).length;

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

      {noLocationCount > 0 && viewMode === 'list' && (
        <View style={styles.noLocationBanner}>
          <Text style={styles.noLocationBannerText}>
            ⚠️ {noLocationCount} ilanın konum bilgisi eksik
          </Text>
        </View>
      )}

      {/* Arama çubuğu */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Hayvan türü, açıklama, konum ara..."
          placeholderTextColor="#aaa"
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
        />
        {searchText !== '' && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtre satırı */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterToggleBtn, showFilters && styles.filterToggleBtnActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={[styles.filterToggleBtnText, showFilters && styles.filterToggleBtnTextActive]}>
            ⚙️ Filtreler
          </Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeBadges}>
          {selectedAnimalType !== 'Tümü' && (
            <TouchableOpacity style={styles.activeBadge} onPress={() => setSelectedAnimalType('Tümü')}>
              <Text style={styles.activeBadgeText}>{selectedAnimalType} ✕</Text>
            </TouchableOpacity>
          )}
          {sortOrder !== 'newest' && (
            <TouchableOpacity style={styles.activeBadge} onPress={() => setSortOrder('newest')}>
              <Text style={styles.activeBadgeText}>En Eski ✕</Text>
            </TouchableOpacity>
          )}
          {locationEnabled && (
            <TouchableOpacity style={styles.activeBadge} onPress={() => setLocationEnabled(false)}>
              <Text style={styles.activeBadgeText}>📍 {radius} km ✕</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Filtre paneli */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>Hayvan Türü</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {animalTypeOptions.map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.filterChip, selectedAnimalType === type && styles.filterChipActive]}
                onPress={() => setSelectedAnimalType(type)}
              >
                <Text style={[styles.filterChipText, selectedAnimalType === type && styles.filterChipTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterLabel}>Sıralama</Text>
          <View style={styles.sortRow}>
            {sortOptions.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sortBtn, sortOrder === opt.key && styles.sortBtnActive]}
                onPress={() => setSortOrder(opt.key)}
              >
                <Text style={[styles.sortBtnText, sortOrder === opt.key && styles.sortBtnTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Konum Filtresi</Text>
          <TouchableOpacity
            style={[styles.locationToggle, locationEnabled && styles.locationToggleActive]}
            onPress={() => locationEnabled ? setLocationEnabled(false) : getLocation()}
          >
            <Text style={[styles.locationToggleText, locationEnabled && styles.locationToggleTextActive]}>
              {locationEnabled ? '📍 Konuma Göre Açık' : '📍 Konuma Göre Filtrele'}
            </Text>
          </TouchableOpacity>
          {locationEnabled && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.radiusScroll, { marginTop: 8 }]}>
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
      )}

      {/* Liste/Harita geçiş */}
      <View style={styles.topBar}>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.viewToggleBtnText, viewMode === 'list' && styles.viewToggleBtnTextActive]}>
              ☰ Liste
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'map' && styles.viewToggleBtnActive]}
            onPress={() => setViewMode('map')}
          >
            <Text style={[styles.viewToggleBtnText, viewMode === 'map' && styles.viewToggleBtnTextActive]}>
              🗺️ Harita
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.resultCount}>{filteredReports.length} ilan</Text>
      </View>

      {viewMode === 'map' ? (
        <MapViewComponent
          reports={filteredReports}
          location={location}
          onMarkerPress={r => navigation.navigate('ReportDetail', { report: r })}
        />
      ) : (
        <>
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
              data={filteredReports}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <ReportCard
                  item={item}
                  onPress={r => navigation.navigate('ReportDetail', { report: r })}
                  onFound={handleFound}
                />
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>📭</Text>
                  <Text style={styles.emptyText}>
                    {searchText !== ''
                      ? `"${searchText}" için sonuç bulunamadı`
                      : locationEnabled
                      ? `${radius} km çevresinde ilan yok`
                      : 'Bu kategoride ilan yok'}
                  </Text>
                  {searchText !== '' && (
                    <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearSearchBtn}>
                      <Text style={styles.clearSearchBtnText}>Aramayı Temizle</Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onRefresh={fetchReports}
              refreshing={loading}
            />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  noLocationBanner: {
    backgroundColor: '#FFF3CD', paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#FFE69C',
  },
  noLocationBannerText: { fontSize: 13, color: '#856404', fontWeight: '600' },
  noLocationWarning: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFF3CD', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, alignSelf: 'flex-start',
  },
  noLocationIcon: { fontSize: 12 },
  noLocationText: { fontSize: 12, color: '#856404', fontWeight: '600' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 12, marginBottom: 8, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#e0e0e0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },
  searchClear: { fontSize: 14, color: '#aaa', paddingHorizontal: 4 },
  filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  filterToggleBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#ddd', backgroundColor: '#fff', marginRight: 8,
  },
  filterToggleBtnActive: { borderColor: '#4CAF50', backgroundColor: '#4CAF5011' },
  filterToggleBtnText: { fontSize: 13, color: '#666', fontWeight: '600' },
  filterToggleBtnTextActive: { color: '#4CAF50' },
  filterBadge: {
    backgroundColor: '#4CAF50', borderRadius: 10, width: 18, height: 18,
    justifyContent: 'center', alignItems: 'center', marginLeft: 6,
  },
  filterBadgeText: { fontSize: 11, color: '#fff', fontWeight: 'bold' },
  activeBadges: { flexGrow: 0, flexShrink: 1 },
  activeBadge: {
    backgroundColor: '#4CAF5022', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    marginRight: 6, borderWidth: 1, borderColor: '#4CAF50',
  },
  activeBadgeText: { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
  filterPanel: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: '#e0e0e0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  filterLabel: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 8, marginTop: 4 },
  filterScroll: { flexGrow: 0, marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#ddd', marginRight: 8, backgroundColor: '#f5f5f5',
  },
  filterChipActive: { borderColor: '#4CAF50', backgroundColor: '#4CAF5011' },
  filterChipText: { fontSize: 13, color: '#666', fontWeight: '500' },
  filterChipTextActive: { color: '#4CAF50', fontWeight: '700' },
  sortRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  sortBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5,
    borderColor: '#ddd', alignItems: 'center', backgroundColor: '#f5f5f5',
  },
  sortBtnActive: { borderColor: '#4CAF50', backgroundColor: '#4CAF5011' },
  sortBtnText: { fontSize: 13, color: '#666', fontWeight: '600' },
  sortBtnTextActive: { color: '#4CAF50', fontWeight: '700' },
  locationToggle: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#ddd', alignSelf: 'flex-start',
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
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  viewToggle: {
    flexDirection: 'row', backgroundColor: '#f5f5f5', borderRadius: 10, padding: 3, alignSelf: 'flex-start',
  },
  viewToggleBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
  viewToggleBtnActive: {
    backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  viewToggleBtnText: { fontSize: 13, color: '#888', fontWeight: '500' },
  viewToggleBtnTextActive: { color: '#1a1a2e', fontWeight: '700' },
  resultCount: { fontSize: 13, color: '#888', fontWeight: '500' },
  mapContainer: { flex: 1 },
  map: { width, flex: 1 },
  mapMarker: {
    backgroundColor: '#fff', borderRadius: 20, padding: 6, borderWidth: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  mapMarkerEmoji: { fontSize: 18 },
  mapPopup: {
    position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: '#fff',
    borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 8,
  },
  mapPopupHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  mapPopupType: { fontSize: 13, fontWeight: '700', color: '#555' },
  mapPopupClose: { fontSize: 16, color: '#aaa' },
  mapPopupAnimal: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  mapPopupDesc: { fontSize: 13, color: '#666', marginBottom: 8 },
  mapPopupLink: { fontSize: 13, color: '#007AFF', fontWeight: '600' },
  mapEmpty: { position: 'absolute', top: '40%', left: 20, right: 20, alignItems: 'center' },
  mapEmptyText: {
    fontSize: 14, color: '#888', textAlign: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12,
  },
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
  reportFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  reportLocation: { fontSize: 12, color: '#888', flex: 1 },
  distanceBadge: { fontSize: 12, color: '#4CAF50', fontWeight: '600', marginLeft: 8 },
  reportBottom: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  reportUser: { fontSize: 12, color: '#4CAF50', fontWeight: '500' },
  reportTime: { fontSize: 12, color: '#aaa' },
  foundBtn: {
    backgroundColor: '#4ECDC411',
    borderWidth: 1.5,
    borderColor: '#4ECDC4',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  foundBtnText: { fontSize: 14, fontWeight: '700', color: '#4ECDC4' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#aaa', textAlign: 'center', paddingHorizontal: 20 },
  clearSearchBtn: {
    marginTop: 12, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#4CAF50', borderRadius: 20,
  },
  clearSearchBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

export default AllReportsScreen;