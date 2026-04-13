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
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../styles/colors';
import config from '../../config';

const API_URL = config.API_URL;

export default function UserProfileScreen() {
  const { token, user: authUser, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${config.API_URL}/api/user/profile`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok) {
        const u = data.user;
        const loaded = { name: u.name || '', email: u.email || '', phone: u.phone || '' };
        setProfile(loaded);
        setForm(loaded);
      } else {
        Alert.alert('Hata', data.error || 'Profil bilgileri alınamadı.');
      }
    } catch (e) {
      Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Uyarı', 'Ad alanı boş bırakılamaz.'); return; }
    setSaving(true);
    try {
      const response = await fetch(`${config.API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), phone: form.phone.trim() }),
      });
      const data = await response.json();
      if (response.ok) {
        const updated = { ...profile, name: form.name.trim(), phone: form.phone.trim() };
        setProfile(updated);
        setForm(updated);
        login(token, { ...authUser, name: form.name.trim() });
        setEditMode(false);
        Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.');
      } else {
        Alert.alert('Hata', data.error || 'Güncelleme başarısız.');
      }
    } catch (e) {
      Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
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
});
