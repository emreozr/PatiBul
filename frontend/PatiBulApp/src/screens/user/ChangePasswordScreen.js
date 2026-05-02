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
      // DÜZELTME: apiFetch yapısına uygun hale getirildi.
      // Token ve body objesi doğrudan geçiriliyor.
      const result = await apiFetch('/api/auth/change-password', {
        method: 'PUT',
        token: token,
        body: {
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        },
      });

      // API başarılı döndüğünde (200 OK)
      Alert.alert('Başarılı', 'Şifreniz başarıyla değiştirildi.', [
        {
          text: 'Tamam',
          onPress: () => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setErrors({});
            navigation.goBack();
          },
        },
      ]);

    } catch (error) {
      console.log("Şifre Değiştirme Hatası:", error);

      // Hata mesajını backend'den gelen veriye göre yakala
      const errorMessage =
        error.data?.error ||
        error.message ||
        'Şifre değiştirilirken hata oluştu';

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
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View style={{ marginTop: 30 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: colors.textDark || '#000',
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

        {/* Butonlar */}
        <View style={{ gap: 10 }}>
          <CustomButton
            title={loading ? 'İşlem yapılıyor...' : 'Şifreyi Güncelle'}
            onPress={handleChangePassword}
            disabled={loading}
          />

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ paddingVertical: 12 }}
            disabled={loading}
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
        </View>

        {loading && (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 20 }}
          />
        )}
      </View>
    </ScrollView>
  );
}