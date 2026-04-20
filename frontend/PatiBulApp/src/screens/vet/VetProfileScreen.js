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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../styles/colors';
import { apiFetch, ApiError, ERROR_TYPES, ERROR_MESSAGES } from '../../services/api';
import { uploadProfilePhoto } from '../../services/api';
import ErrorScreen from '../../components/ErrorScreen';

export default function VetProfileScreen() {
  const { token, user: authUser, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [profile, setProfile] = useState({
    name: '', email: '', phone: '',
    clinic_name: '', clinic_address: '', clinic_hours: '',
    latitude: null, longitude: null,
  });
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
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
        clinic_name: u.clinic_name || '',
        clinic_address: u.clinic_address || '',
        clinic_hours: u.clinic_hours || '',
        latitude: u.latitude || null,
        longitude: u.longitude || null,
      };
      setProfile(loaded);
      setForm(loaded);
    } catch (error) {
      if (error instanceof ApiError) {
        setLoadError(error);
        if (error.type === ERROR_TYPES.CLIENT) {
          Alert.alert('Hata', error.data?.error || 'Profil bilgileri alınamadı.');
        }
      } else {
        setLoadError({ type: ERROR_TYPES.UNKNOWN });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Konum izni verilmedi.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setForm({
        ...form,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      Alert.alert('Başarılı', 'Klinik konumu alındı. Kaydetmeyi unutma!');
    } catch (e) {
      Alert.alert('Hata', 'Konum alınamadı.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.clinic_name.trim()) { Alert.alert('Uyarı', 'Klinik adı boş bırakılamaz.'); return; }
    if (!form.clinic_address.trim()) { Alert.alert('Uyarı', 'Adres boş bırakılamaz.'); return; }
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
        <ActivityIndicator size="large" color={Colors.primary} />
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🏥</Text>
            </View>
            <Text style={styles.nameLabel}>{profile.clinic_name || 'Klinik Adı'}</Text>
            <Text style={styles.emailLabel}>{profile.email}</Text>
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
                <Text style={styles.fieldValue}>{profile.name || '—'}</Text>
              )}
            </View>

            <View style={[styles.field, { marginBottom: 0 }]}>
              <Text style={styles.fieldLabel}>Telefon</Text>
              {editMode ? (
                <TextInput
                  style={styles.input}
                  value={form.phone}
                  onChangeText={(t) => setForm({ ...form, phone: t })}
                  placeholder="Telefon numaranızı girin"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.phone || '—'}</Text>
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
                <Text style={styles.fieldValue}>{profile.clinic_name || '—'}</Text>
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
                <Text style={styles.fieldValue}>{profile.clinic_address || '—'}</Text>
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
                <Text style={styles.fieldValue}>{profile.clinic_hours || '—'}</Text>
              )}
            </View>

            {/* Konum */}
            <View style={[styles.field, { marginBottom: 0 }]}>
              <Text style={styles.fieldLabel}>Klinik Konumu (Harita için)</Text>
              {profile.latitude && profile.longitude ? (
                <Text style={styles.locationSet}>
                  ✅ Konum ayarlandı ({profile.latitude.toFixed(4)}, {profile.longitude.toFixed(4)})
                </Text>
              ) : (
                <Text style={styles.locationNotSet}>⚠️ Konum henüz ayarlanmadı</Text>
              )}
              {editMode && (
                <TouchableOpacity
                  style={styles.locationBtn}
                  onPress={handleGetLocation}
                  disabled={locationLoading}
                >
                  {locationLoading
                    ? <ActivityIndicator color={Colors.white} size="small" />
                    : <Text style={styles.locationBtnText}>📍 Mevcut Konumu Al</Text>
                  }
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Butonlar */}
          {editMode ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.btn, styles.cancelBtn]}
                onPress={() => { setForm({ ...profile }); setEditMode(false); }}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.saveBtnText}>Kaydet</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[styles.btn, styles.editBtn]} onPress={() => setEditMode(true)}>
              <Text style={styles.editBtnText}>Klinik Bilgilerini Düzenle</Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  avatarContainer: { alignItems: 'center', marginVertical: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarEmoji: { fontSize: 36 },
  nameLabel: { fontSize: 20, fontWeight: '700', color: Colors.textDark, textAlign: 'center' },
  emailLabel: { fontSize: 13, color: Colors.textLight, marginTop: 4 },
  card: {
    backgroundColor: Colors.white, borderRadius: 16,
    padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.textLight, letterSpacing: 1.2, marginBottom: 16 },
  field: { marginBottom: 18 },
  fieldLabel: { fontSize: 12, color: Colors.textLight, marginBottom: 6, fontWeight: '500' },
  fieldValue: { fontSize: 16, color: Colors.textDark, fontWeight: '500' },
  input: {
    fontSize: 15, color: Colors.textDark,
    borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: Colors.background,
  },
  multiline: { minHeight: 80, paddingTop: 10 },
  locationSet: { fontSize: 13, color: Colors.success, fontWeight: '600', marginBottom: 8 },
  locationNotSet: { fontSize: 13, color: '#856404', fontWeight: '500', marginBottom: 8 },
  locationBtn: {
    backgroundColor: Colors.primary, borderRadius: 10,
    padding: 12, alignItems: 'center',
  },
  locationBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  editBtn: { backgroundColor: Colors.primary },
  editBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  saveBtn: { backgroundColor: Colors.primary },
  saveBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  cancelBtn: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border },
  cancelBtnText: { color: Colors.textDark, fontSize: 15, fontWeight: '600' },
});
