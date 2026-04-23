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
import { useAuth } from '../../context/AuthContext';
import Colors from '../../styles/colors';
import { apiFetch, ApiError, ERROR_TYPES, ERROR_MESSAGES } from '../../services/api';
import ErrorScreen from '../../components/ErrorScreen';
import ImagePicker from 'react-native-image-picker';

export default function UserProfileScreen() {
  const { token, user: authUser, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [profile, setProfile] = useState({ name: '', email: '', phone: '', profile_photo: '' });
  const [form, setForm] = useState({ name: '', email: '', phone: '', profile_photo: '' });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data } = await apiFetch('/api/user/profile', { token });
      const u = data.user;
      const loaded = { name: u.name || '', email: u.email || '', phone: u.phone || '', profile_photo: u.profile_photo || '' };
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

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Uyarı', 'Ad alanı boş bırakılamaz.'); return; }
    setSaving(true);
    try {
      await apiFetch('/api/user/profile', {
        method: 'PUT',
        token,
        body: { name: form.name.trim(), phone: form.phone.trim() },
      });

      const updated = { ...profile, name: form.name.trim(), phone: form.phone.trim() };
      setProfile(updated);
      setForm(updated);
      login(token, { ...authUser, name: form.name.trim() });
      setEditMode(false);
      Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.');
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

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
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

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const uploadPhoto = async () => {
    if (!photoUri) return;
    setSaving(true);
    try {
      await uploadProfilePhoto(token, photoUri);
      const updated = { ...profile, profile_photo: photoUri.replace(config.API_URL + '/', '') };
      setProfile(updated);
      setForm(updated);
      login(token, { ...authUser, profile_photo: updated.profile_photo });
      Alert.alert('Başarılı', 'Fotoğraf yüklendi.');
    } catch (error) {
      Alert.alert('Hata', 'Fotoğraf yüklenemedi.');
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
            <TouchableOpacity onPress={() => editMode && Alert.alert('Fotoğraf Seç', '', [
              { text: 'Galeri', onPress: pickImage },
              { text: 'Kamera', onPress: takePhoto },
              { text: 'İptal', style: 'cancel' },
            ])}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {editMode && photoUri !== (profile.profile_photo ? `${config.API_URL}/${profile.profile_photo}` : null) && (
              <TouchableOpacity style={styles.uploadBtn} onPress={uploadPhoto} disabled={saving}>
                <Text style={styles.uploadBtnText}>Fotoğrafı Yükle</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.nameLabel}>{profile.name}</Text>
            <Text style={styles.emailLabel}>{profile.email}</Text>
          </View>

          {/* Kart */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>KİŞİSEL BİLGİLER</Text>

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

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>E-posta</Text>
              <Text style={styles.fieldValue}>{profile.email || '—'}</Text>
              {editMode && <Text style={styles.fieldHint}>E-posta değiştirilemez</Text>}
            </View>

            <View style={[styles.field, { marginBottom: 0 }]}>
              <Text style={styles.fieldLabel}>Telefon Numarası</Text>
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

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Profil Fotoğrafı</Text>
              {profile.profile_photo ? (
                <View style={styles.imageContainer}>
                  <Image source={profile.profile_photo} style={styles.image} />
                </View>
              ) : (
                <View style={styles.imageContainer}>
                  <Text style={styles.imagePlaceholder}>Fotoğraf yükleniyor...</Text>
                </View>
              )}
              {editMode && (
                <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                  <Text style={styles.imagePickerBtnText}>Galeriden Seç</Text>
                </TouchableOpacity>
              )}
              {editMode && (
                <TouchableOpacity style={styles.imagePickerBtn} onPress={takePhoto}>
                  <Text style={styles.imagePickerBtnText}>Kameradan Al</Text>
                </TouchableOpacity>
              )}
              {editMode && (
                <TouchableOpacity style={styles.imagePickerBtn} onPress={uploadPhoto}>
                  <Text style={styles.imagePickerBtnText}>Yükle</Text>
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
              <Text style={styles.editBtnText}>Profili Düzenle</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => navigation.navigate('ChangePassword')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 15,
              borderBottomWidth: 1,
              borderBottomColor: '#ECECEC',
            }}
          >
            <Text style={{ fontSize: 16, color: colors.text, flex: 1 }}>🔐 Şifre Değiştir</Text>
            <Text style={{ fontSize: 16, color: '#CCC' }}>›</Text>
          </TouchableOpacity>

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
  avatarText: { fontSize: 34, fontWeight: '700', color: Colors.white },
  nameLabel: { fontSize: 20, fontWeight: '700', color: Colors.textDark },
  emailLabel: { fontSize: 13, color: Colors.textLight, marginTop: 4 },
  card: {
    backgroundColor: Colors.white, borderRadius: 16,
    padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.textLight, letterSpacing: 1.2, marginBottom: 16 },
  field: { marginBottom: 18 },
  fieldLabel: { fontSize: 12, color: Colors.textLight, marginBottom: 6, fontWeight: '500' },
  fieldValue: { fontSize: 16, color: Colors.textDark, fontWeight: '500' },
  fieldHint: { fontSize: 11, color: Colors.textLight, marginTop: 4 },
  input: {
    fontSize: 15, color: Colors.textDark,
    borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: Colors.background,
  },
  buttonRow: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  editBtn: { backgroundColor: Colors.primary },
  editBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  saveBtn: { backgroundColor: Colors.primary },
  saveBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  cancelBtn: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border },
  cancelBtnText: { color: Colors.textDark, fontSize: 15, fontWeight: '600' },
  imageContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  image: { width: 100, height: 100, borderRadius: 50 },
  imagePlaceholder: { fontSize: 16, color: Colors.textLight },
  imagePickerBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 10 },
  imagePickerBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  uploadBtn: { marginTop: 8, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: Colors.primary, borderRadius: 8 },
  uploadBtnText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
});
