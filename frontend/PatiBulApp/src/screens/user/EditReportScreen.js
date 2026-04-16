// SCRUM-55: Bildirim Düzenleme Ekranı
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../styles/colors';
import config from '../../config';

const animalTypes = ['Kedi', 'Köpek', 'Kuş', 'Tavşan', 'Diğer'];

const typeConfig = {
  kayip: { label: 'Kayıp İlanı', icon: '🚨', color: '#FF6B6B' },
  bulunan: { label: 'Bulunan Hayvan', icon: '🐕', color: '#4ECDC4' },
  yarali: { label: 'Yaralı Hayvan', icon: '🏥', color: '#FFE66D' },
};

export default function EditReportScreen({ route, navigation }) {
  const { report } = route.params;
  const { token } = useAuth();

  const [animalType, setAnimalType] = useState(report.animal_type || '');
  const [description, setDescription] = useState(report.description || '');
  const [locationDesc, setLocationDesc] = useState(report.location_desc || '');
  const [location, setLocation] = useState(
    report.latitude && report.longitude
      ? { latitude: report.latitude, longitude: report.longitude }
      : null
  );
  const [saving, setSaving] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const typeInfo = typeConfig[report.report_type] || typeConfig.kayip;

  const getLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Konum eklemek için konum izni gerekli.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      const address = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (address.length > 0) {
        const addr = address[0];
        setLocationDesc([addr.district, addr.city].filter(Boolean).join(', '));
      }
    } catch (e) {
      Alert.alert('Hata', 'Konum alınamadı.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSave = async () => {
    if (!animalType || !description.trim()) {
      Alert.alert('Uyarı', 'Hayvan türü ve açıklama zorunludur.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`${config.API_URL}/api/reports/${report.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          animal_type: animalType,
          description: description.trim(),
          location_desc: locationDesc.trim(),
          latitude: location?.latitude || null,
          longitude: location?.longitude || null,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Başarılı', 'Bildirim güncellendi.', [
          { text: 'Tamam', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Hata', data.error || 'Güncelleme başarısız.');
      }
    } catch (e) {
      Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Tip Banner */}
        <View style={[styles.typeBanner, { backgroundColor: typeInfo.color + '22', borderColor: typeInfo.color }]}>
          <Text style={styles.typeBannerIcon}>{typeInfo.icon}</Text>
          <Text style={[styles.typeBannerText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
        </View>

        {/* Hayvan Türü */}
        <Text style={styles.sectionLabel}>Hayvan Türü *</Text>
        <View style={styles.animalTypeRow}>
          {animalTypes.map(a => (
            <TouchableOpacity
              key={a}
              style={[styles.animalTypeBtn, animalType === a && styles.animalTypeBtnActive]}
              onPress={() => setAnimalType(a)}
            >
              <Text style={[styles.animalTypeBtnText, animalType === a && styles.animalTypeBtnTextActive]}>
                {a}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Açıklama */}
        <Text style={styles.sectionLabel}>Açıklama *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Hayvanı tanımlayın (renk, irk, ayırt edici özellikler...)"
          placeholderTextColor="#aaa"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Konum */}
        <Text style={styles.sectionLabel}>Konum</Text>
        <TouchableOpacity style={styles.locationBtn} onPress={getLocation} disabled={locationLoading}>
          {locationLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.locationBtnText}>
              {location ? '✅ Konum Güncelle' : '📍 Konumumu Kullan'}
            </Text>
          )}
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Konum açıklaması (Örn: Kadıköy Moda Parkı)"
          placeholderTextColor="#aaa"
          value={locationDesc}
          onChangeText={setLocationDesc}
        />

        {/* Kaydet */}
        {saving ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : (
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Değişiklikleri Kaydet</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
  typeBanner: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 24,
  },
  typeBannerIcon: { fontSize: 28, marginRight: 10 },
  typeBannerText: { fontSize: 18, fontWeight: 'bold' },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 10 },
  animalTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  animalTypeBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#ddd', backgroundColor: '#fff',
  },
  animalTypeBtnActive: { borderColor: '#4CAF50', backgroundColor: '#4CAF5011' },
  animalTypeBtnText: { fontSize: 13, color: '#666', fontWeight: '500' },
  animalTypeBtnTextActive: { color: '#4CAF50', fontWeight: '700' },
  textArea: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1,
    borderColor: '#e0e0e0', padding: 14, fontSize: 14, color: '#333',
    minHeight: 100, marginBottom: 20,
  },
  locationBtn: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5,
    borderColor: Colors.primary, padding: 12, alignItems: 'center', marginBottom: 10,
  },
  locationBtnText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  input: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1,
    borderColor: '#e0e0e0', padding: 14, fontSize: 14, color: '#333', marginBottom: 24,
  },
  loader: { marginTop: 20 },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
