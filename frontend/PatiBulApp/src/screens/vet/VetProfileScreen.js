import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../styles/colors';
import { apiFetch, ApiError, ERROR_TYPES, ERROR_MESSAGES } from '../../services/api';
import ErrorScreen from '../../components/ErrorScreen';
import MapPickerModal from '../../components/MapPickerModal';
import config from '../../config';

export default function VetProfileScreen({ navigation }) {
  const { token, user: authUser, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [phoneError, setPhoneError] = useState('');
  const [mapPickerVisible, setMapPickerVisible] = useState(false);

  const [photoUri, setPhotoUri] = useState(null);
  const [profile, setProfile] = useState({
    name: '', email: '', phone: '', profile_photo: '',
    clinic_name: '', clinic_address: '', clinic_hours: '',
    latitude: null, longitude: null,
  });
  const [form, setForm] = useState({
    name: '', email: '', phone: '', profile_photo: '',
    clinic_name: '', clinic_address: '', clinic_hours: '',
    latitude: null, longitude: null,
  });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data } = await apiFetch('/api/user/profile', { token });
      const u = data.user;
      const loaded = {
        name: u.name || '',
        email: u.email || '',
        phone: u.phone || '',
        profile_photo: u.profile_photo || '',
        clinic_name: u.clinic_name || '',
        clinic_address: u.clinic_address || '',
        clinic_hours: u.clinic_hours || '',
        latitude: u.latitude || null,
        longitude: u.longitude || null,
      };
      setProfile(loaded);
      setForm(loaded);
      if (u.profile_photo) {
        setPhotoUri(`${config.API_URL}/${u.profile_photo}`);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setLoadError(error);
      } else {
        setLoadError({ type: ERROR_TYPES.UNKNOWN });
      }
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galeri izni verilmedi.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera izni verilmedi.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const showImageOptions = () => {
    Alert.alert('Profil Fotoğrafı Seç', '', [
      { text: 'Kamera', onPress: takePhoto },
      { text: 'Galeri', onPress: pickImage },
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  const uploadPhoto = async () => {
    if (!photoUri || photoUri.startsWith('http')) {
      Alert.alert('Uyarı', 'Lütfen önce yeni bir fotoğraf seçin.');
      return;
    }
    setSaving(true);
    const formData = new FormData();
    const uriParts = photoUri.split('.');
    const fileType = uriParts[uriParts.length - 1].toLowerCase();
    const mimeType = fileType === 'png' ? 'image/png' : 'image/jpeg';
    formData.append('photo', {
      uri: Platform.OS === 'android' ? photoUri : photoUri.replace('file://', ''),
      name: `profile_${Date.now()}.${fileType}`,
      type: mimeType,
    });
    try {
      const response = await fetch(`${config.API_URL}/api/user/profile/photo`, {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Başarılı', 'Profil fotoğrafınız güncellendi.');
        login(token, { ...authUser, profile_photo: data.photo_url });
        setProfile({ ...profile, profile_photo: data.photo_url });
        setPhotoUri(`${config.API_URL}/${data.photo_url}`);
      } else {
        Alert.alert('Hata', data.error || 'Yükleme başarısız.');
      }
    } catch (error) {
      Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhoneChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length <= 11) {
      setForm({ ...form, phone: cleaned });
      if (cleaned.length > 0 && cleaned.length < 10) {
        setPhoneError('Telefon numarası en az 10 haneli olmalıdır');
      } else {
        setPhoneError('');
      }
    }
  };

  const handleGetCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Konum izni verilmedi.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setForm({ ...form, latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      Alert.alert('Başarılı', 'Klinik konumu alındı. Kaydetmeyi unutma!');
    } catch (e) {
      Alert.alert('Hata', 'Konum alınamadı.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleMapConfirm = (coords) => {
    setForm({ ...form, latitude: coords.latitude, longitude: coords.longitude });
    Alert.alert('Başarılı', 'Konum seçildi. Kaydetmeyi unutma!');
  };

  const handleSave = async () => {
    if (!form.clinic_name.trim()) { Alert.alert('Uyarı', 'Klinik adı boş bırakılamaz.'); return; }
    if (!form.clinic_address.trim()) { Alert.alert('Uyarı', 'Adres boş bırakılamaz.'); return; }
    if (form.phone && form.phone.length > 0 && form.phone.length < 10) {
      Alert.alert('Uyarı', 'Geçerli bir telefon numarası girin.');
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/api/user/profile', {
        method: 'PUT',
        token,
        body: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          clinic_name: form.clinic_name.trim(),
          clinic_address: form.clinic_address.trim(),
          clinic_hours: form.clinic_hours.trim(),
          latitude: form.latitude,
          longitude: form.longitude,
        },
      });
      setProfile({ ...form });
      login(token, { ...authUser, name: form.name.trim() });
      setEditMode(false);
      Alert.alert('Başarılı', 'Klinik bilgileriniz güncellendi.');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.type === ERROR_TYPES.CLIENT) {
          Alert.alert('Hata', error.data?.error || 'Güncelleme başarısız.');
        } else {
          const errorInfo = ERROR_MESSAGES[error.type] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
          Alert.alert(errorInfo.title, errorInfo.message);
        }
      } else {
        Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (loadError && !profile.email) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorScreen errorType={loadError.type} onRetry={fetchProfile} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={showImageOptions} style={styles.avatarWrapper}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarEmoji}>🏥</Text>
                </View>
              )}
              <View style={styles.editBadge}>
                <Text style={{ fontSize: 14 }}>📷</Text>
              </View>
            </TouchableOpacity>

            {photoUri && !photoUri.startsWith('http') && (
              <TouchableOpacity style={styles.uploadBtn} onPress={uploadPhoto} disabled={saving}>
                <Text style={styles.uploadBtnText}>Fotoğrafı Yükle</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.nameLabel}>{profile?.clinic_name || 'Klinik Adı'}</Text>
            <Text style={styles.emailLabel}>{profile?.email}</Text>
          </View>

          {/* Veteriner Bilgileri */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>VETERİNER BİLGİLERİ</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Ad Soyad</Text>
              {editMode ? (
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={(t) => setForm({ ...form, name: t })}
                  placeholder="Adınızı girin"
                  placeholderTextColor={Colors.textLight}
                />
              ) : (
                <Text style={styles.fieldValue}>{profile?.name || '—'}</Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Telefon</Text>
              {editMode ? (
                <>
                  <TextInput
                    style={[styles.input, phoneError ? styles.inputError : null]}
                    value={form.phone}
                    onChangeText={handlePhoneChange}
                    placeholder="05XX XXX XX XX"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="phone-pad"
                    maxLength={11}
                  />
                  {phoneError ? (
                    <Text style={styles.errorText}>{phoneError}</Text>
                  ) : (
                    <Text style={styles.hintText}>{form.phone.length}/11</Text>
                  )}
                </>
              ) : (
                <Text style={styles.fieldValue}>{profile?.phone || '—'}</Text>
              )}
            </View>
          </View>

          {/* Klinik Bilgileri */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>KLİNİK BİLGİLERİ</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Klinik Adı</Text>
              {editMode ? (
                <TextInput
                  style={styles.input}
                  value={form.clinic_name}
                  onChangeText={(t) => setForm({ ...form, clinic_name: t })}
                  placeholder="Klinik adını girin"
                  placeholderTextColor={Colors.textLight}
                />
              ) : (
                <Text style={styles.fieldValue}>{profile?.clinic_name || '—'}</Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Adres</Text>
              {editMode ? (
                <TextInput
                  style={[styles.input, styles.multiline]}
                  value={form.clinic_address}
                  onChangeText={(t) => setForm({ ...form, clinic_address: t })}
                  placeholder="Klinik adresini girin"
                  placeholderTextColor={Colors.textLight}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile?.clinic_address || '—'}</Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Çalışma Saatleri</Text>
              {editMode ? (
                <TextInput
                  style={[styles.input, styles.multiline]}
                  value={form.clinic_hours}
                  onChangeText={(t) => setForm({ ...form, clinic_hours: t })}
                  placeholder={'Örn: Pzt-Cum 09:00-18:00\nCmt 10:00-14:00'}
                  placeholderTextColor={Colors.textLight}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile?.clinic_hours || '—'}</Text>
              )}
            </View>

            {/* Konum */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Klinik Konumu (Harita için)</Text>
              {form.latitude && form.longitude ? (
                <Text style={styles.locationSet}>
                  ✅ Konum ayarlandı ({(form.latitude || profile.latitude)?.toFixed(4)}, {(form.longitude || profile.longitude)?.toFixed(4)})
                </Text>
              ) : (
                <Text style={styles.locationNotSet}>⚠️ Konum henüz ayarlanmadı</Text>
              )}
              {editMode && (
                <View style={styles.locationRow}>
                  <TouchableOpacity
                    style={[styles.locationBtn, { flex: 1 }]}
                    onPress={handleGetCurrentLocation}
                    disabled={locationLoading}
                  >
                    {locationLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.locationBtnText}>📍 Konumumu Al</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.locationBtn, styles.locationBtnMap, { flex: 1 }]}
                    onPress={() => setMapPickerVisible(true)}
                  >
                    <Text style={styles.locationBtnText}>🗺️ Haritadan Seç</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Butonlar */}
          <View style={{ gap: 12 }}>
            {editMode ? (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={() => { setForm({ ...profile }); setPhoneError(''); setEditMode(false); }}
                  disabled={saving}
                >
                  <Text style={styles.cancelBtnText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.saveBtn]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Kaydet</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={() => setEditMode(true)}
              >
                <Text style={styles.editProfileBtnText}>Klinik Bilgilerini Düzenle</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.changePasswordBtn}
              onPress={() => navigation.navigate('ChangePassword')}
            >
              <Text style={styles.changePasswordBtnText}>Şifre Değiştir</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Harita Modal */}
      <MapPickerModal
        visible={mapPickerVisible}
        onClose={() => setMapPickerVisible(false)}
        onConfirm={handleMapConfirm}
        initialCoords={
          form.latitude
            ? { latitude: form.latitude, longitude: form.longitude }
            : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarEmoji: {
    fontSize: 44,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 5,
    borderRadius: 15,
    elevation: 5,
  },
  uploadBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 20,
  },
  uploadBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  nameLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
    textAlign: 'center',
    marginTop: 12,
  },
  emailLabel: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textLight,
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  field: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 6,
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 16,
    color: Colors.textDark,
    fontWeight: '500',
  },
  input: {
    fontSize: 15,
    color: Colors.textDark,
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.background,
  },
  inputError: {
    borderColor: '#E74C3C',
  },
  multiline: {
    minHeight: 80,
    paddingTop: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#E74C3C',
    marginTop: 4,
  },
  hintText: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 4,
    textAlign: 'right',
  },
  locationSet: {
    fontSize: 13,
    color: '#28a745',
    fontWeight: '600',
    marginBottom: 8,
  },
  locationNotSet: {
    fontSize: 13,
    color: '#856404',
    fontWeight: '500',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  locationBtn: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  locationBtnMap: {
    backgroundColor: '#4CAF50',
  },
  locationBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileBtn: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editProfileBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#4CAF50',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    color: Colors.textDark,
    fontSize: 15,
    fontWeight: '600',
  },
  changePasswordBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  changePasswordBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});