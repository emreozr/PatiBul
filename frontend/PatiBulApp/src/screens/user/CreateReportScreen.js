import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../styles/colors';
import config from '../../config';

const API_URL = config.API_URL;

const typeConfig = {
  kayip: { label: 'Kayıp İlanı', icon: '🚨', color: '#FF6B6B' },
  bulunan: { label: 'Bulunan Hayvan', icon: '🐕', color: '#4ECDC4' },
  yarali: { label: 'Yaralı Hayvan', icon: '🏥', color: '#FFE66D' },
};

const animalTypes = ['Kedi', 'Köpek', 'Kuş', 'Tavşan', 'Diğer'];

const CreateReportScreen = ({ route, navigation }) => {
  const { type = 'kayip' } = route?.params || {};
  const { token } = useAuth();

  const [animalType, setAnimalType] = useState('');
  const [description, setDescription] = useState('');
  const [locationDesc, setLocationDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const config = typeConfig[type];

  const handleSubmit = async () => {
    if (!animalType || !description) {
      Alert.alert('Hata', 'Lütfen hayvan türü ve açıklama alanlarını doldurun.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reports/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          report_type: type,
          animal_type: animalType,
          description,
          location_desc: locationDesc,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Hata', data.error || 'Bildirim oluşturulamadı.');
        return;
      }

      Alert.alert('Başarılı', 'Bildiriminiz oluşturuldu!', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamıyor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.typeBanner, { backgroundColor: config.color + '22', borderColor: config.color }]}>
        <Text style={styles.typeBannerIcon}>{config.icon}</Text>
        <Text style={[styles.typeBannerText, { color: config.color }]}>{config.label}</Text>
      </View>

      <Text style={styles.sectionLabel}>Hayvan Türü *</Text>
      <View style={styles.animalTypeRow}>
        {animalTypes.map(a => (
          <TouchableOpacity
            key={a}
            style={[styles.animalTypeBtn, animalType === a && styles.animalTypeBtnActive]}
            onPress={() => setAnimalType(a)}
          >
            <Text style={[styles.animalTypeBtnText, animalType === a && styles.animalTypeBtnTextActive]}>
              {a}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Açıklama *</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Hayvanı tanımlayın (renk, irk, ayırt edici özellikler...)"
        placeholderTextColor="#aaa"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <Text style={styles.sectionLabel}>Konum Açıklaması</Text>
      <TextInput
        style={styles.input}
        placeholder="Örn: Kadıköy Moda Parkı yakını"
        placeholderTextColor="#aaa"
        value={locationDesc}
        onChangeText={setLocationDesc}
      />

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: config.color }]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitBtnText}>Bildirimi Gönder</Text>
        </TouchableOpacity>
      )}

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 20,
  },
  typeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
  },
  typeBannerIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  typeBannerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  animalTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  animalTypeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  animalTypeBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '11',
  },
  animalTypeBtnText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  animalTypeBtnTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
    fontSize: 14,
    color: '#333',
    marginBottom: 24,
  },
  loader: {
    marginTop: 20,
  },
  submitBtn: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpace: {
    height: 40,
  },
});

export default CreateReportScreen;