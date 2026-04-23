import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import InputField from '../../components/InputField';
import CustomButton from '../../components/CustomButton';
import colors from '../../styles/colors';

export default function ChangePasswordScreen({ navigation }) {
  const { token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Form validasyonu
  const validateForm = () => {
    let newErrors = {};

    if (!currentPassword.trim()) {
      newErrors.currentPassword = 'Mevcut şifreyi girin';
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = 'Yeni şifreyi girin';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Şifre en az 6 karakter olmalıdır';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Şifreyi tekrar girin';
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Şifre değiştirme işlemi
  const handleChangePassword = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await apiFetch('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (result.data) {
        Alert.alert('Başarılı', result.data.message, [
          {
            text: 'Tamam',
            onPress: () => {
              // Alanları temizle
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setErrors({});
              // Kullanıcı profiline dön
              navigation.goBack();
            },
          },
        ]);
      }
    } catch (error) {
      // Backend hatasını göster
      const errorMessage = error.data?.error || error.message || 'Şifre değiştirilirken hata oluştu';
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 20,
      }}
    >
      <View style={{ marginTop: 30 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 20,
          }}
        >
          Şifre Değiştir
        </Text>

        {/* Mevcut Şifre */}
        <InputField
          label="Mevcut Şifre"
          placeholder="Mevcut şifrenizi girin"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry={!showCurrentPassword}
          error={errors.currentPassword}
          rightIcon={showCurrentPassword ? '👁️' : '👁️‍🗨️'}
          onPressRightIcon={() => setShowCurrentPassword(!showCurrentPassword)}
        />

        {/* Yeni Şifre */}
        <InputField
          label="Yeni Şifre"
          placeholder="Yeni şifre oluşturun"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNewPassword}
          error={errors.newPassword}
          rightIcon={showNewPassword ? '👁️' : '👁️‍🗨️'}
          onPressRightIcon={() => setShowNewPassword(!showNewPassword)}
        />

        {/* Şifre Tekrar */}
        <InputField
          label="Yeni Şifre Tekrar"
          placeholder="Yeni şifreyi tekrar girin"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          error={errors.confirmPassword}
          rightIcon={showConfirmPassword ? '👁️' : '👁️‍🗨️'}
          onPressRightIcon={() => setShowConfirmPassword(!showConfirmPassword)}
        />

        {/* Bilgilendirme Mesajı */}
        <View
          style={{
            backgroundColor: '#E8F4F8',
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
            padding: 15,
            borderRadius: 8,
            marginTop: 20,
            marginBottom: 30,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 13, lineHeight: 20 }}>
            💡 <Text style={{ fontWeight: '600' }}>İpucu:</Text> Şifrenizi güvenli tutmak için
            büyük harf, küçük harf ve rakam içeren karmaşık bir şifre kullanın.
          </Text>
        </View>

        {/* Değiştir Butonu */}
        <CustomButton
          title={loading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
          onPress={handleChangePassword}
          disabled={loading}
        />

        {/* İptal Butonu */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            paddingVertical: 12,
            marginTop: 15,
            marginBottom: 40,
          }}
        >
          <Text
            style={{
              color: colors.primary,
              fontSize: 16,
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            İptal
          </Text>
        </TouchableOpacity>

        {loading && (
          <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}