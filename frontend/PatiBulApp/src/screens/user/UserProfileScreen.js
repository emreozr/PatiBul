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
import { useAuth } from '../../context/AuthContext';
import Colors from '../../styles/colors';
import { apiFetch } from '../../services/api';
import * as ImagePicker from 'expo-image-picker';
import config from '../../config';

export default function UserProfileScreen({ navigation }) {
  const { token, user: authUser, login, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    profile_photo: '',
  });
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    profile_photo: '',
  });
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await apiFetch('/api/user/profile', { token });
      const u = data.user;
      const loaded = {
        name: u.name || '',
        email: u.email || '',
        phone: u.phone || '',
        profile_photo: u.profile_photo || '',
      };
      setProfile(loaded);
      setForm(loaded);
      if (u.profile_photo) setPhotoUri(`${config.API_URL}/${u.profile_photo}`);
    } catch (error) {
      console.log('Profil çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera izni gerekiyor.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) uploadPhoto(result.assets[0].uri);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galeri izni gerekiyor.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) uploadPhoto(result.assets[0].uri);
  };

  const showImageOptions = () => {
    Alert.alert('Profil Fotoğrafı', 'Nereden yüklemek istersiniz?', [
      { text: 'Kamera', onPress: takePhoto },
      { text: 'Galeri', onPress: pickImage },
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  const uploadPhoto = async (uri) => {
    setUploadingPhoto(true);
    setPhotoUri(uri);
    const formData = new FormData();
    const uriParts = uri.split('.');
    const fileType = uriParts[uriParts.length - 1].toLowerCase();
    formData.append('photo', {
      uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
      name: `profile_${Date.now()}.${fileType}`,
      type: fileType === 'png' ? 'image/png' : 'image/jpeg',
    });
    try {
      const response = await fetch(`${config.API_URL}/api/user/profile/photo`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok) {
        login(token, { ...authUser, profile_photo: data.photo_url });
        setProfile((prev) => ({ ...prev, profile_photo: data.photo_url }));
        setPhotoUri(`${config.API_URL}/${data.photo_url}`);
        Alert.alert('Başarılı', 'Profil fotoğrafınız güncellendi.');
      } else {
        Alert.alert('Hata', data.error || 'Yükleme başarısız.');
      }
    } catch (error) {
      Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhoneChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length <= 11) {
      setForm({ ...form, phone: cleaned });
      setPhoneError(
        cleaned.length > 0 && cleaned.length < 10
          ? 'En az 10 haneli olmalıdır'
          : ''
      );
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Uyarı', 'Ad alanı boş bırakılamaz.');
      return;
    }
    if (form.phone && form.phone.length > 0 && form.phone.length < 10) {
      Alert.alert('Uyarı', 'Geçerli bir telefon numarası girin.');
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/api/user/profile', {
        method: 'PUT',
        token,
        body: { name: form.name.trim(), phone: form.phone.trim() },
      });
      setProfile({ ...profile, ...form });
      login(token, { ...authUser, ...form });
      setEditMode(false);
      Alert.alert('Başarılı', 'Bilgileriniz güncellendi.');
    } catch (error) {
      Alert.alert('Hata', 'Güncelleme başarısız.');
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            onPress={() => editMode && showImageOptions()}
            style={styles.avatarWrapper}
            activeOpacity={editMode ? 0.7 : 1}
          >
            {uploadingPhoto ? (
              <View style={styles.avatar}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#1a1a2e' }]}>
                <Text style={styles.avatarText}>
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            {editMode && (
              <View style={styles.editBadge}>
                <Text style={{ fontSize: 14 }}>📷</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.nameLabel}>{profile?.name}</Text>
          <Text style={styles.emailLabel}>{profile?.email}</Text>
        </View>

        {/* Kişisel Bilgiler */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>KİŞİSEL BİLGİLER</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Ad Soyad</Text>
            {editMode ? (
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(t) => setForm({ ...form, name: t })}
                placeholder="Adınız Soyadınız"
                placeholderTextColor="#aaa"
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
                  keyboardType="phone-pad"
                  maxLength={11}
                  placeholder="05XX XXX XX XX"
                  placeholderTextColor="#aaa"
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

        {/* Butonlar */}
        <View style={{ gap: 12 }}>
          {editMode ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.btn, styles.cancelBtn]}
                onPress={() => {
                  setForm({ ...profile });
                  setPhoneError('');
                  setEditMode(false);
                }}
              >
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.saveBtn]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
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
              <Text style={styles.editProfileBtnText}>Profili Düzenle</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.changePasswordBtn}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <Text style={styles.changePasswordBtnText}>Şifre Değiştir</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 40,
    color: '#FFF',
    fontWeight: 'bold',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 5,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  nameLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginTop: 4,
  },
  emailLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  card: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
    elevation: 2,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 15,
    letterSpacing: 1,
  },
  field: {
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 16,
    color: Colors.textDark,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary,
    paddingVertical: 5,
    fontSize: 16,
    color: Colors.textDark,
  },
  inputError: {
    borderBottomColor: '#E74C3C',
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
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  editProfileBtn: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editProfileBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    flex: 2,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cancelBtn: {
    backgroundColor: '#EEE',
    flex: 1,
  },
  cancelBtnText: {
    color: '#333',
    fontWeight: '500',
  },
  changePasswordBtn: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  changePasswordBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  logoutBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FF6B6B',
    backgroundColor: '#fff',
  },
  logoutBtnText: {
    color: '#FF6B6B',
    fontWeight: '700',
    fontSize: 15,
  },
});