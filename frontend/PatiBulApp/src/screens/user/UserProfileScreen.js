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
import { useAuth } from '../../context/AuthContext';
import Colors from '../../styles/colors';
import { apiFetch } from '../../services/api';
import * as ImagePicker from 'expo-image-picker';
import config from '../../config';

export default function UserProfileScreen({ navigation }) {
  const { token, user: authUser, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [photoUri, setPhotoUri] = useState(null);
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', profile_photo: '' });
  const [form, setForm] = useState({ name: '', email: '', phone: '', profile_photo: '' });
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => { fetchProfile(); }, []);

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
      if (u.profile_photo) {
        setPhotoUri(`${config.API_URL}/${u.profile_photo}`);
      }
    } catch (error) {
      console.log('Profil çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera kullanımı için izin vermeniz gerekiyor.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galeriye erişim için izin vermeniz gerekiyor.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const showImageOptions = () => {
    Alert.alert('Profil Fotoğrafı Seç', 'Nereden yüklemek istersiniz?', [
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
        setEditMode(false);
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
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={() => editMode && showImageOptions()} style={styles.avatarWrapper}>
              {photoUri ? (
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

            {editMode && photoUri && !photoUri.startsWith('http') && (
              <TouchableOpacity style={styles.uploadNowBtn} onPress={uploadPhoto} disabled={saving}>
                <Text style={styles.uploadNowBtnText}>Yeni Fotoğrafı Şimdi Yükle</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Butonlar */}
          <View style={{ gap: 12 }}>
            {editMode ? (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={() => { setForm({ ...profile }); setPhoneError(''); setEditMode(false); }}
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
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DDD',
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
  },
  nameLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginTop: 10,
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
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 15,
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
    borderBottomColor: '#4CAF50',
    paddingVertical: 5,
    fontSize: 16,
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
    backgroundColor: '#4CAF50',
    flex: 2,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  cancelBtn: {
    backgroundColor: '#EEE',
    flex: 1,
  },
  cancelBtnText: {
    color: '#333',
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
  uploadNowBtn: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  uploadNowBtnText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});