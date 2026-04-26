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
import { config } from '../../config';

export default function UserProfileScreen({ navigation }) {
  const { token, user: authUser, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [photoUri, setPhotoUri] = useState(null);
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', profile_photo: '' });
  const [form, setForm] = useState({ name: '', email: '', phone: '', profile_photo: '' });

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
        profile_photo: u.profile_photo || ''
      };
      setProfile(loaded);
      setForm(loaded);
      if (u.profile_photo) {
        setPhotoUri(`${config.API_URL}/${u.profile_photo}`);
      }
    } catch (error) {
      console.log("Profil çekme hatası:", error);
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
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galeriye erişim için izin vermeniz gerekiyor.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Profil Fotoğrafı Seç',
      'Nereden yüklemek istersiniz?',
      [
        { text: 'Kamera', onPress: takePhoto },
        { text: 'Galeri', onPress: pickImage },
        { text: 'İptal', style: 'cancel' },
      ]
    );
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
      // ÖNEMLİ: Content-Type başlığını MANUEL EKLEMİYORUZ.
      const response = await fetch(`${config.API_URL}/api/user/profile/photo`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
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
      console.log("Upload Error:", error);
      Alert.alert('Hata', 'Sunucuya bağlanılamadı. IP adresinizi kontrol edin.');
    } finally {
      setSaving(false);
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

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={() => editMode && showImageOptions()} style={styles.avatarWrapper}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
                  <Text style={styles.avatarText}>{profile?.name ? profile.name.charAt(0).toUpperCase() : '?'}</Text>
                </View>
              )}
              {editMode && <View style={styles.editBadge}><Text style={{fontSize: 14}}>📷</Text></View>}
            </TouchableOpacity>
            <Text style={styles.nameLabel}>{profile?.name}</Text>
            <Text style={styles.emailLabel}>{profile?.email}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>KİŞİSEL BİLGİLER</Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Ad Soyad</Text>
              {editMode ? (
                <TextInput style={styles.input} value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
              ) : (
                <Text style={styles.fieldValue}>{profile?.name || '—'}</Text>
              )}
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Telefon</Text>
              {editMode ? (
                <TextInput style={styles.input} value={form.phone} onChangeText={(t) => setForm({ ...form, phone: t })} keyboardType="phone-pad" />
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

          <View style={{ gap: 10 }}>
            {editMode ? (
              <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => { setForm({ ...profile }); setEditMode(false); }}>
                  <Text style={styles.cancelBtnText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSave} disabled={saving}>
                  <Text style={styles.saveBtnText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={[styles.btn, styles.editBtn]} onPress={() => setEditMode(true)}>
                <Text style={styles.editBtnText}>Profili Düzenle</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => navigation.navigate('ChangePassword')} style={styles.changePasswordRow}>
              <Text style={{ fontSize: 16, color: Colors.textDark, flex: 1 }}>🔐 Şifre Değiştir</Text>
              <Text style={{ fontSize: 16, color: '#CCC' }}>›</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  avatarContainer: { alignItems: 'center', marginBottom: 20 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: '#DDD' },
  avatarText: { fontSize: 40, color: '#FFF', fontWeight: 'bold' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FFF', padding: 5, borderRadius: 15, elevation: 5 },
  nameLabel: { fontSize: 22, fontWeight: 'bold', color: Colors.textDark, marginTop: 10 },
  emailLabel: { fontSize: 14, color: Colors.textLight },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, elevation: 2, marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: Colors.primary, marginBottom: 15 },
  field: { marginBottom: 15 },
  fieldLabel: { fontSize: 12, color: Colors.textLight, marginBottom: 5 },
  fieldValue: { fontSize: 16, color: Colors.textDark },
  input: { borderBottomWidth: 1, borderBottomColor: Colors.primary, paddingVertical: 5, fontSize: 16 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  btn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  editBtn: { backgroundColor: Colors.primary },
  editBtnText: { color: '#FFF', fontWeight: 'bold' },
  saveBtn: { backgroundColor: Colors.primary, flex: 2 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold' },
  cancelBtn: { backgroundColor: '#EEE', flex: 1 },
  cancelBtnText: { color: '#333' },
  uploadNowBtn: { backgroundColor: '#4CAF50', padding: 10, borderRadius: 8, marginTop: 10 },
  uploadNowBtnText: { color: '#FFF', textAlign: 'center', fontWeight: 'bold' },
  changePasswordRow: { flexDirection: 'row', paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#EEE', marginTop: 10 }
});