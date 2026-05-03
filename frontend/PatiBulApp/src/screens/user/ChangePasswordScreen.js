import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import KeyboardSafeView from '../../components/KeyboardSafeView';
import InputField from '../../components/InputField';
import CustomButton from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
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

  const validateForm = () => {
    let newErrors = {};
    if (!currentPassword.trim()) newErrors.currentPassword = 'Mevcut şifreyi girin';
    if (!newPassword.trim()) newErrors.newPassword = 'Yeni şifreyi girin';
    else if (newPassword.length < 6) newErrors.newPassword = 'Şifre en az 6 karakter olmalıdır';
    if (!confirmPassword.trim()) newErrors.confirmPassword = 'Şifreyi tekrar girin';
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await apiFetch('/api/auth/change-password', {
        method: 'PUT',
        token,
        body: { current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword },
      });
      Alert.alert('Başarılı', 'Şifreniz başarıyla değiştirildi.', [{
        text: 'Tamam',
        onPress: () => { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setErrors({}); navigation.goBack(); },
      }]);
    } catch (error) {
      Alert.alert('Hata', error.data?.error || error.message || 'Şifre değiştirilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardSafeView backgroundColor={colors.background} contentStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: colors.textDark || '#000', marginBottom: 20, marginTop: 10 }}>
        Şifre Değiştir
      </Text>

      <InputField
        label="Mevcut Şifre" placeholder="Mevcut şifrenizi girin"
        value={currentPassword} onChangeText={setCurrentPassword}
        secureTextEntry={!showCurrentPassword} error={errors.currentPassword}
        rightIcon={showCurrentPassword ? '👁️' : '👁️‍🗨️'}
        onPressRightIcon={() => setShowCurrentPassword(!showCurrentPassword)}
      />
      <InputField
        label="Yeni Şifre" placeholder="Yeni şifre oluşturun"
        value={newPassword} onChangeText={setNewPassword}
        secureTextEntry={!showNewPassword} error={errors.newPassword}
        rightIcon={showNewPassword ? '👁️' : '👁️‍🗨️'}
        onPressRightIcon={() => setShowNewPassword(!showNewPassword)}
      />
      <InputField
        label="Yeni Şifre Tekrar" placeholder="Yeni şifreyi tekrar girin"
        value={confirmPassword} onChangeText={setConfirmPassword}
        secureTextEntry={!showConfirmPassword} error={errors.confirmPassword}
        rightIcon={showConfirmPassword ? '👁️' : '👁️‍🗨️'}
        onPressRightIcon={() => setShowConfirmPassword(!showConfirmPassword)}
      />

      <View style={{ backgroundColor: '#E8F4F8', borderLeftWidth: 4, borderLeftColor: colors.primary, padding: 15, borderRadius: 8, marginTop: 20, marginBottom: 30 }}>
        <Text style={{ color: colors.text, fontSize: 13, lineHeight: 20 }}>
          💡 <Text style={{ fontWeight: '600' }}>İpucu:</Text> Büyük harf, küçük harf ve rakam içeren karmaşık bir şifre kullanın.
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        <CustomButton title={loading ? 'İşlem yapılıyor...' : 'Şifreyi Güncelle'} onPress={handleChangePassword} disabled={loading} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingVertical: 12 }} disabled={loading}>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600', textAlign: 'center' }}>İptal</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />}
    </KeyboardSafeView>
  );
}