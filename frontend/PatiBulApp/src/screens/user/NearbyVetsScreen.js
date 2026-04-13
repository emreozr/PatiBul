// SCRUM-30: Yakındaki Veterinerler Harita Ekranı
// Kullanıcının konumuna göre yakındaki veteriner kliniklerini haritada gösteren ekran
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
  Dimensions,
} from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../styles/colors';
import config from '../../config';

const API_URL = config.API_URL;

const { width, height } = Dimensions.get('window');
const radiusOptions = [5, 10, 25, 50];

export default function NearbyVetsScreen() {
  const { token } = useAuth();
  const mapRef = useRef(null);

  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const [radius, setRadius] = useState(10);
  const [selectedVet, setSelectedVet] = useState(null);

  const requestLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError(true);
        Alert.alert('Konum İzni Gerekli', 'Yakındaki veterinerleri görmek için konum iznine ihtiyaç var.');
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      setLocationError(false);
      return loc.coords;
    } catch (e) {
      setLocationError(true);
      return null;
    }
  }, []);

  const fetchVets = useCallback(async (coords, selectedRadius) => {
    setLoading(true);
    try {
      let url = `${config.API_URL}/api/user/vets`;
      if (coords) {
        url += `?lat=${coords.latitude}&lon=${coords.longitude}&radius=${selectedRadius}`;
      }
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setVets(data.vets || []);
      }
    } catch (e) {
      setVets([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    (async () => {
      const coords = await requestLocation();
      await fetchVets(coords, radius);
    })();
  }, []);

  const handleRadiusChange = async (newRadius) => {
    setRadius(newRadius);
    setSelectedVet(null);
    await fetchVets(location, newRadius);
  };

  const handleMarkerPress = (vet) => {
    setSelectedVet(vet);
  };

  const handleCenterMap = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 500);
    }
  };

  const vetsWithLocation = vets.filter(v => v.latitude && v.longitude);

  const initialRegion = location ? {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  } : {
    // Varsayılan: İstanbul
    latitude: 41.0082,
    longitude: 28.9784,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <View style={styles.container}>
      {/* Harita */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Kullanıcı konum çevresi */}
        {location && (
          <Circle
            center={{ latitude: location.latitude, longitude: location.longitude }}
            radius={radius * 1000}
            strokeColor={Colors.primary + '66'}
            fillColor={Colors.primary + '11'}
            strokeWidth={1.5}
          />
        )}

        {/* Veteriner markerları */}
        {vetsWithLocation.map(vet => (
          <Marker
            key={vet.id}
            coordinate={{ latitude: vet.latitude, longitude: vet.longitude }}
            onPress={() => handleMarkerPress(vet)}
          >
            <View style={[
              styles.markerContainer,
              selectedVet?.id === vet.id && styles.markerContainerSelected
            ]}>
              <Text style={styles.markerEmoji}>🏥</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Konuma git butonu */}
      <TouchableOpacity style={styles.centerBtn} onPress={handleCenterMap}>
        <Text style={styles.centerBtnText}>📍</Text>
      </TouchableOpacity>

      {/* Mesafe Filtresi */}
      <View style={styles.filterBar}>
        <Text style={styles.filterLabel}>Mesafe:</Text>
        {radiusOptions.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
            onPress={() => handleRadiusChange(r)}
          >
            <Text style={[styles.radiusBtnText, radius === r && styles.radiusBtnTextActive]}>
              {r} km
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Seçili Veteriner Kartı */}
      {selectedVet && (
        <View style={styles.vetCard}>
          <TouchableOpacity style={styles.vetCardClose} onPress={() => setSelectedVet(null)}>
            <Text style={styles.vetCardCloseText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.vetCardHeader}>
            <Text style={styles.vetCardEmoji}>🏥</Text>
            <View style={styles.vetCardInfo}>
              <Text style={styles.vetCardName}>{selectedVet.clinic_name || selectedVet.name}</Text>
              {selectedVet.distance_km && (
                <Text style={styles.vetCardDistance}>📏 {selectedVet.distance_km} km uzakta</Text>
              )}
            </View>
          </View>
          {selectedVet.clinic_address ? (
            <Text style={styles.vetCardDetail}>📍 {selectedVet.clinic_address}</Text>
          ) : null}
          {selectedVet.clinic_hours ? (
            <Text style={styles.vetCardDetail}>🕐 {selectedVet.clinic_hours}</Text>
          ) : null}
          {selectedVet.phone ? (
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Linking.openURL(`tel:${selectedVet.phone}`)}
            >
              <Text style={styles.callBtnText}>📞 Ara</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Alt Liste */}
      {!selectedVet && (
        <View style={styles.bottomSheet}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Veterinerler aranıyor...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.bottomSheetTitle}>
                {vets.length > 0
                  ? `${radius} km içinde ${vets.length} veteriner bulundu`
                  : `${radius} km içinde veteriner bulunamadı`}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {vets.map(vet => (
                  <TouchableOpacity
                    key={vet.id}
                    style={styles.vetChip}
                    onPress={() => {
                      setSelectedVet(vet);
                      if (vet.latitude && vet.longitude && mapRef.current) {
                        mapRef.current.animateToRegion({
                          latitude: vet.latitude,
                          longitude: vet.longitude,
                          latitudeDelta: 0.02,
                          longitudeDelta: 0.02,
                        }, 500);
                      }
                    }}
                  >
                    <Text style={styles.vetChipName} numberOfLines={1}>
                      🏥 {vet.clinic_name || vet.name}
                    </Text>
                    {vet.distance_km && (
                      <Text style={styles.vetChipDistance}>{vet.distance_km} km</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      )}

      {/* Konum Hatası */}
      {locationError && (
        <View style={styles.locationErrorBar}>
          <Text style={styles.locationErrorText}>⚠️ Konum alınamadı</Text>
          <TouchableOpacity onPress={async () => {
            const coords = await requestLocation();
            if (coords) fetchVets(coords, radius);
          }}>
            <Text style={styles.locationErrorRetry}>Tekrar dene</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width, height },
  centerBtn: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: Colors.white, borderRadius: 30,
    width: 44, height: 44, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  centerBtnText: { fontSize: 22 },
  filterBar: {
    position: 'absolute', top: 16, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.white, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  filterLabel: { fontSize: 12, color: Colors.textLight, fontWeight: '600' },
  radiusBtn: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
  },
  radiusBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  radiusBtnText: { fontSize: 11, color: Colors.textLight, fontWeight: '500' },
  radiusBtnTextActive: { color: Colors.white, fontWeight: '700' },
  markerContainer: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 6,
    borderWidth: 2, borderColor: Colors.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  markerContainerSelected: {
    backgroundColor: Colors.primary,
    transform: [{ scale: 1.2 }],
  },
  markerEmoji: { fontSize: 20 },
  vetCard: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
    backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 8,
  },
  vetCardClose: { position: 'absolute', top: 12, right: 12, padding: 4 },
  vetCardCloseText: { fontSize: 16, color: Colors.textLight },
  vetCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  vetCardEmoji: { fontSize: 32 },
  vetCardInfo: { flex: 1 },
  vetCardName: { fontSize: 16, fontWeight: '700', color: Colors.textDark },
  vetCardDistance: { fontSize: 12, color: Colors.success, fontWeight: '600', marginTop: 2 },
  vetCardDetail: { fontSize: 13, color: Colors.textLight, marginBottom: 4 },
  callBtn: {
    backgroundColor: Colors.primary, borderRadius: 10,
    padding: 12, alignItems: 'center', marginTop: 8,
  },
  callBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 16, paddingBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 8,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { color: Colors.textLight, fontSize: 14 },
  bottomSheetTitle: { fontSize: 13, fontWeight: '600', color: Colors.textDark, marginBottom: 12 },
  vetChip: {
    backgroundColor: Colors.background, borderRadius: 12, padding: 10,
    marginRight: 10, borderWidth: 1, borderColor: Colors.border, minWidth: 120,
  },
  vetChipName: { fontSize: 13, fontWeight: '600', color: Colors.textDark },
  vetChipDistance: { fontSize: 11, color: Colors.success, marginTop: 2 },
  locationErrorBar: {
    position: 'absolute', bottom: 100, left: 16, right: 16,
    backgroundColor: '#FFF3CD', borderRadius: 10, padding: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  locationErrorText: { fontSize: 13, color: '#856404' },
  locationErrorRetry: { fontSize: 13, color: '#856404', fontWeight: '700' },
});
