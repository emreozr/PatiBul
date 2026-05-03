import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

const MapPickerModal = ({ visible, onClose, onConfirm, initialCoords }) => {
  const [selectedCoords, setSelectedCoords] = useState(
    initialCoords || { latitude: 41.0082, longitude: 28.9784 }
  );

  const handleMapPress = (e) => {
    setSelectedCoords(e.nativeEvent.coordinate);
  };

  const handleConfirm = () => {
    onConfirm(selectedCoords);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Üst bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>İptal</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Konum Seç</Text>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmBtnText}>Onayla</Text>
          </TouchableOpacity>
        </View>

        {/* Bilgi bandı */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            📍 Haritaya dokunarak konum seçin
          </Text>
        </View>

        {/* Harita */}
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={{
            latitude: selectedCoords.latitude,
            longitude: selectedCoords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onPress={handleMapPress}
          showsUserLocation
        >
          <Marker
            coordinate={selectedCoords}
            draggable
            onDragEnd={(e) => setSelectedCoords(e.nativeEvent.coordinate)}
          />
        </MapView>

        {/* Seçilen koordinat */}
        <View style={styles.coordBar}>
          <Text style={styles.coordText}>
            {selectedCoords.latitude.toFixed(5)}, {selectedCoords.longitude.toFixed(5)}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 50 : 14,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
  cancelBtn: {
    padding: 4,
  },
  cancelBtnText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
  },
  confirmBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
  },
  infoBanner: {
    backgroundColor: '#4CAF5011',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#4CAF5033',
  },
  infoBannerText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
  },
  map: {
    flex: 1,
    width,
  },
  coordBar: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  coordText: {
    fontSize: 13,
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default MapPickerModal;