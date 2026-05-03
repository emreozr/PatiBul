import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import KeyboardSafeView from '../../components/KeyboardSafeView';
import MapPickerModal from '../../components/MapPickerModal';
import { useAuth } from '../../context/AuthContext';
import { apiFetch, ApiError, ERROR_TYPES, ERROR_MESSAGES } from '../../services/api';
import config from '../../config';

const API_URL = config.API_URL;

const typeConfig = {
  kayip: { label: 'Kayıp İlanı', icon: '🚨', color: '#FF6B6B' },
  bulunan: { label: 'Bulunan Hayvan', icon: '🐕', color: '#4ECDC4' },
  yarali: { label: 'Yaralı Hayvan', icon: '🏥', color: '#FFE66D' },
};

const animalTypes = ['Kedi', 'Köpek', 'Kuş', 'Tavşan', 'Diğer'];

const CreateReportScreen = ({ route, navigation }) => {
  const { type = 'kayip', fromReport, report } = route?.params || {};
  const { token } = useAuth();

  const isEdit = !!report;

  // Düzenleme modunda mevcut verilerle doldur
  const [animalType, setAnimalType] = useState(report?.animal_type || '');
  const [description, setDescription] = useState(report?.description || '');
  const [locationDesc, setLocationDesc] = useState(report?.location_desc || '');
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(
    report?.latitude ? { latitude: report.latitude, longitude: report.longitude } : null
  );
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapPickerVisible, setMapPickerVisible] = useState(false);

  const currentType = fromReport ? 'bulunan' : (report?.report_type || type);
  const config_type = typeConfig[currentType] || typeConfig.kayip;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galeri iznine ihtiyaç var.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera iznine ihtiyaç var.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Konum iznine ihtiyaç var.');
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

  const handleMapConfirm = async (coords) => {
    setLocation(coords);
    try {
      const address = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      if (address.length > 0) {
        const addr = address[0];
        setLocationDesc([addr.district, addr.city].filter(Boolean).join(', '));
      }
    } catch (e) {}
  };

  // Buldum akışı
  const handleFoundSubmit = async () => {
    if (!animalType || !description) {
      Alert.alert('Hata', 'Lütfen hayvan türü ve açıklama alanlarını doldurun.');
      return;
    }
    setLoading(true);
    try {
      const autoMessage = [
        `Merhaba! "${fromReport.animal_type}" ilanınızı gördüm.`,
        ``,
        `📋 Hayvan Bilgileri:`,
        `🐾 Hayvan Türü: ${animalType}`,
        `📝 Not: ${description}`,
        locationDesc ? `📍 Konum: ${locationDesc}` : null,
        ``,
        `Benimle iletişime geçer misiniz?`,
      ].filter(line => line !== null).join('\n');

      const response = await fetch(`${API_URL}/api/messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiver_id: fromReport.user_id,
          content: autoMessage,
          report_id: fromReport.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Hata', data.error || 'Mesaj gönderilemedi.');
        return;
      }

      if (image) {
        const messageId = data.data.id;
        const formData = new FormData();
        const ext = image.uri.split('.').pop();
        formData.append('image', {
          uri: image.uri,
          name: `msg_${Date.now()}.${ext}`,
          type: `image/${ext}`,
        });
        await fetch(`${API_URL}/api/messages/${messageId}/upload-image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      }

      Alert.alert(
        '🎉 Mesaj Gönderildi!',
        'İlan sahibine bilgi verildi. Mesajlaşma ekranına yönlendiriliyorsunuz.',
        [{
          text: 'Tamam',
          onPress: () => {
            navigation.reset({
              index: 1,
              routes: [
                { name: 'UserHome' },
                {
                  name: 'Conversation',
                  params: {
                    otherUserId: fromReport.user_id,
                    otherUserName: fromReport.user_name,
                    otherUserPhoto: fromReport.user_photo,
                    reportId: fromReport.id,
                    reportAnimal: fromReport.animal_type,
                  },
                },
              ],
            });
          },
        }],
      );
    } catch (e) {
      Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamıyor.');
    } finally {
      setLoading(false);
    }
  };

  // Normal ilan oluşturma veya düzenleme
  const handleNormalSubmit = async () => {
    if (!animalType || !description) {
      Alert.alert('Hata', 'Lütfen hayvan türü ve açıklama alanlarını doldurun.');
      return;
    }
    setLoading(true);
    try {
      const endpoint = isEdit ? `/api/reports/${report.id}` : '/api/reports/';
      const method = isEdit ? 'PUT' : 'POST';

      const body = isEdit
        ? {
            animal_type: animalType,
            description,
            location_desc: locationDesc,
            latitude: location?.latitude,
            longitude: location?.longitude,
          }
        : {
            report_type: type,
            animal_type: animalType,
            description,
            location_desc: locationDesc,
            latitude: location?.latitude,
            longitude: location?.longitude,
          };

      const { data } = await apiFetch(endpoint, { method, token, body });

      const reportId = isEdit ? report.id : data.report.id;

      if (image && !isEdit) {
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

      Alert.alert(
        'Başarılı',
        isEdit ? 'İlanınız güncellendi!' : 'Bildiriminiz oluşturuldu!',
        [{ text: 'Tamam', onPress: () => navigation.goBack() }],
      );
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

  const handleSubmit = fromReport ? handleFoundSubmit : handleNormalSubmit;

  return (
    <KeyboardSafeView contentStyle={styles.content}>

      {/* Buldum bandı */}
      {fromReport && (
        <View style={styles.foundBanner}>
          <Text style={styles.foundBannerText}>
            🐾 "{fromReport.animal_type}" ilanı sahibine mesaj gönderiyorsunuz
          </Text>
          <Text style={styles.foundBannerSub}>
            İlan oluşturulmayacak, sadece ilan sahibine bilgi gidecek
          </Text>
        </View>
      )}

      {/* Düzenleme bandı */}
      {isEdit && (
        <View style={styles.editBanner}>
          <Text style={styles.editBannerText}>
            ✏️ İlanı düzenliyorsunuz
          </Text>
        </View>
      )}

      {/* Tip Banner */}
      <View style={[
        styles.typeBanner,
        { backgroundColor: config_type.color + '22', borderColor: config_type.color },
      ]}>
        <Text style={styles.typeBannerIcon}>{config_type.icon}</Text>
        <Text style={[styles.typeBannerText, { color: config_type.color }]}>
          {fromReport ? 'Buldum Bildirimi' : config_type.label}
        </Text>
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
            <Text style={[
              styles.animalTypeBtnText,
              animalType === a && styles.animalTypeBtnTextActive,
            ]}>
              {a}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Açıklama */}
      <Text style={styles.sectionLabel}>
        {fromReport ? 'Not (ilan sahibine iletilecek) *' : 'Açıklama *'}
      </Text>
      <TextInput
        style={styles.textArea}
        placeholder={
          fromReport
            ? 'Hayvanı nerede gördünüz, nasıl tanıdınız, iletişim bilgileriniz...'
            : 'Hayvanı tanımlayın (renk, irk, ayırt edici özellikler...)'
        }
        placeholderTextColor="#aaa"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* Konum */}
      <Text style={styles.sectionLabel}>Konum</Text>
      <View style={styles.locationRow}>
        <TouchableOpacity
          style={[styles.locationBtn, styles.locationBtnLeft]}
          onPress={getCurrentLocation}
          disabled={locationLoading}
        >
          {locationLoading ? (
            <ActivityIndicator size="small" color="#4CAF50" />
          ) : (
            <Text style={styles.locationBtnText}>
              {location ? '✅ Alındı' : '📍 Konumum'}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.locationBtn, styles.locationBtnRight]}
          onPress={() => setMapPickerVisible(true)}
        >
          <Text style={styles.locationBtnText}>🗺️ Haritadan Seç</Text>
        </TouchableOpacity>
      </View>

      {location && (
        <Text style={styles.locationSetText}>
          ✅ Konum ayarlandı ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})
        </Text>
      )}

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
          <Text style={styles.submitBtnText}>
            {fromReport
              ? '📤 İlan Sahibine Bildir ve Mesajlaş'
              : isEdit
              ? '✅ Değişiklikleri Kaydet'
              : 'Bildirimi Gönder'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Harita Modal */}
      <MapPickerModal
        visible={mapPickerVisible}
        onClose={() => setMapPickerVisible(false)}
        onConfirm={handleMapConfirm}
        initialCoords={location}
      />

    </KeyboardSafeView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  foundBanner: {
    backgroundColor: '#4ECDC411',
    borderWidth: 1.5,
    borderColor: '#4ECDC4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  foundBannerText: {
    fontSize: 13,
    color: '#4ECDC4',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  foundBannerSub: {
    fontSize: 11,
    color: '#4ECDC4',
    textAlign: 'center',
    opacity: 0.8,
  },
  editBanner: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1.5,
    borderColor: '#FFE69C',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  editBannerText: {
    fontSize: 13,
    color: '#856404',
    fontWeight: '600',
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
  locationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  locationBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    padding: 12,
    alignItems: 'center',
  },
  locationBtnLeft: {},
  locationBtnRight: {},
  locationBtnText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
  },
  locationSetText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
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
});

export default CreateReportScreen;