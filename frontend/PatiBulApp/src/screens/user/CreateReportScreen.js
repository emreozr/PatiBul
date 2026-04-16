import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { apiFetch, ApiError, ERROR_TYPES, ERROR_MESSAGES } from '../../services/api';

const typeConfig = {
  kayip: { label: 'Kayıp İlanı', icon: '🚨', color: '#FF6B6B' },
  bulunan: { label: 'Bulunan Hayvan', icon: '🐕', color: '#4ECDC4' },
  yarali: { label: 'Yaralı Hayvan', icon: '🏥', color: '#FFE66D' },
};

const animalTypes = ['Kedi', 'Köpek', 'Kuş', 'Tavşan', 'Diğer'];

const CreateReportScreen = ({ route, navigation }) => {
  const { type = 'kayip' } = route?.params || {};
  const { token } = useAuth();

  const [animalType, setAnimalType] = useState('');
  const [description, setDescription] = useState('');
  const [locationDesc, setLocationDesc] = useState('');
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const config_type = typeConfig[type];

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri iznine ihtiyaç var.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf çekmek için kamera iznine ihtiyaç var.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const getLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Konum eklemek için konum iznine ihtiyaç var.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);

      // Adres bilgisini al
      const address = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (address.length > 0) {
        const addr = address[0];
        const addressStr = [addr.district, addr.city].filter(Boolean).join(', ');
        setLocationDesc(addressStr);
      }
    } catch (e) {
      Alert.alert('Hata', 'Konum alınamadı.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!animalType || !description) {
      Alert.alert('Hata', 'Lütfen hayvan türü ve açıklama alanlarını doldurun.');
      return;
    }

    setLoading(true);
    try {
      // 1. Bildirimi oluştur
      const { data } = await apiFetch('/api/reports/', {
        method: 'POST',
        token,
        body: {
          report_type: type,
          animal_type: animalType,
          description,
          location_desc: locationDesc,
          latitude: location?.latitude,
          longitude: location?.longitude,
        },
      });

      const reportId = data.report.id;

      // 2. Fotoğraf varsa yükle
      if (image) {
        const formData = new FormData();
        const ext = image.uri.split('.').pop();
        formData.append('image', {
          uri: image.uri,
          name: `photo.${ext}`,
          type: `image/${ext}`,
        });

        await apiFetch(`/api/reports/${reportId}/upload-image`, {
          method: 'POST',
          token,
          body: formData,
          isFormData: true,
          timeout: 30000,
        });
      }

      Alert.alert('Başarılı', 'Bildiriminiz oluşturuldu!', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.type === ERROR_TYPES.CLIENT) {
          Alert.alert('Hata', error.data?.error || error.message);
        } else {
          const errorInfo = ERROR_MESSAGES[error.type] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
          Alert.alert(errorInfo.title, errorInfo.message);
        }
      } else {
        Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamıyor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Tip Banner */}
      <View style={[styles.typeBanner, { backgroundColor: config_type.color + '22', borderColor: config_type.color }]}>
        <Text style={styles.typeBannerIcon}>{config_type.icon}</Text>
        <Text style={[styles.typeBannerText, { color: config_type.color }]}>{config_type.label}</Text>
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
      <TouchableOpacity
        style={styles.locationBtn}
        onPress={getLocation}
        disabled={locationLoading}
      >
        {locationLoading ? (
          <ActivityIndicator size="small" color="#4CAF50" />
        ) : (
          <Text style={styles.locationBtnText}>
            {location ? '✅ Konum Alındı' : '📍 Konumumu Kullan'}
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

      {/* Fotoğraf */}
      <Text style={styles.sectionLabel}>Fotoğraf</Text>
      <View style={styles.photoRow}>
        <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
          <Text style={styles.photoBtnIcon}>🖼️</Text>
          <Text style={styles.photoBtnText}>Galeriden Seç</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
          <Text style={styles.photoBtnIcon}>📷</Text>
          <Text style={styles.photoBtnText}>Fotoğraf Çek</Text>
        </TouchableOpacity>
      </View>

      {image && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: image.uri }} style={styles.imagePreview} />
          <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImage(null)}>
            <Text style={styles.removeImageText}>✕ Kaldır</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Gönder */}
      {loading ? (
        <ActivityIndicator size="large" color={config_type.color} style={styles.loader} />
      ) : (
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: config_type.color }]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitBtnText}>Bildirimi Gönder</Text>
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
  typeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
  },
  typeBannerIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  typeBannerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  animalTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  animalTypeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  animalTypeBtnActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF5011',
  },
  animalTypeBtnText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  animalTypeBtnTextActive: {
    color: '#4CAF50',
    fontWeight: '700',
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
    marginBottom: 20,
  },
  locationBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  locationBtnText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
    fontSize: 14,
    color: '#333',
    marginBottom: 20,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    padding: 14,
    alignItems: 'center',
  },
  photoBtnIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  photoBtnText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  imagePreviewContainer: {
    marginBottom: 20,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  removeImageBtn: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  removeImageText: {
    color: '#FF6B6B',
    fontWeight: '600',
    fontSize: 13,
  },
  loader: {
    marginTop: 20,
  },
  submitBtn: {
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

export default CreateReportScreen;