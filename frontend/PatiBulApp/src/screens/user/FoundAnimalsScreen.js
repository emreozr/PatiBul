import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import config from '../../config';

const API_URL = config.API_URL;

const FoundAnimalCard = ({ item, onPress }) => {
  const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)}>
      {firstImage && (
        <Image
          source={{ uri: `${API_URL}${firstImage.image_url}` }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.foundBadge}>
            <Text style={styles.foundBadgeText}>🎉 Bulundu</Text>
          </View>
          <Text style={styles.cardDate}>
            {new Date(item.created_at).toLocaleDateString('tr-TR')}
          </Text>
        </View>
        <Text style={styles.cardAnimal}>{item.animal_type}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        {item.location_desc ? (
          <Text style={styles.cardLocation}>📍 {item.location_desc}</Text>
        ) : null}
        <Text style={styles.cardUser}>👤 {item.user_name}</Text>
      </View>
    </TouchableOpacity>
  );
};

const FoundAnimalsScreen = ({ navigation }) => {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFoundAnimals = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reports/closed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setReports(data.reports || []);
      }
    } catch (e) {
      console.error('Bulunan hayvanlar yüklenemedi:', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFoundAnimals();
  }, [fetchFoundAnimals]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.bannerIcon}>🎉</Text>
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Bulunan Hayvanlar</Text>
          <Text style={styles.bannerSubtitle}>
            PatiBul sayesinde sahiplerine kavuşan {reports.length} hayvan
          </Text>
        </View>
      </View>

      <FlatList
        data={reports}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <FoundAnimalCard
            item={item}
            onPress={r => navigation.navigate('ReportDetail', { report: r })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🐾</Text>
            <Text style={styles.emptyText}>Henüz bulunan hayvan yok</Text>
            <Text style={styles.emptySubtext}>
              Kayıp hayvanlar bulundukça burada listelenecek
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={fetchFoundAnimals}
        refreshing={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: '#4CAF5011',
    borderBottomWidth: 1,
    borderBottomColor: '#4CAF5033',
    padding: 16,
    alignItems: 'center',
  },
  bannerIcon: {
    fontSize: 36,
    marginRight: 12,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  foundBadge: {
    backgroundColor: '#4CAF5022',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  foundBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4CAF50',
  },
  cardDate: {
    fontSize: 12,
    color: '#aaa',
  },
  cardAnimal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
  },
  cardLocation: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  cardUser: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default FoundAnimalsScreen;