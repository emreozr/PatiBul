import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { Mail } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../styles/colors';
import config from '../../config';

const API_URL = config.API_URL;

const QuickActionCard = ({ icon, title, subtitle, color, onPress, badge }) => (
  <TouchableOpacity style={[styles.card, { borderLeftColor: color }]} onPress={onPress}>
    <Text style={styles.cardIcon}>{icon}</Text>
    <View style={styles.cardText}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </View>
    {badge > 0 && (
      <View style={styles.cardBadge}>
        <Text style={styles.cardBadgeText}>{badge}</Text>
      </View>
    )}
    <Text style={styles.cardArrow}>›</Text>
  </TouchableOpacity>
);

const UserHomeScreen = ({ navigation }) => {
  const { user, logout, token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setUnreadCount(data.unread_count || 0);
    } catch (e) {}
  }, [token]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Merhaba 👋</Text>
          <Text style={styles.headerName}>{user?.name || 'Kullanıcı'}</Text>
        </View>

        <View style={styles.headerRight}>
          {/* 📬 Gelen kutusu butonu */}
          <TouchableOpacity
            style={styles.inboxBtn}
            onPress={() => navigation.navigate('Inbox')}
          >
            <Mail size={26} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.inboxBadge}>
                <Text style={styles.inboxBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Profil */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => navigation.navigate('UserProfile')}
          >
            {user?.profile_photo ? (
              <Image
                key={user.profile_photo}
                source={{ uri: `${config.API_URL}/${user.profile_photo}` }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>
                {user?.name?.[0]?.toUpperCase() || '?'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerIcon}>🐾</Text>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>PatiBul'a hoş geldiniz!</Text>
            <Text style={styles.bannerSubtitle}>
              Kayıp ilanlarını görün, bildirim oluşturun.
            </Text>
          </View>
        </View>

        {/* İlanlar */}
        <Text style={styles.sectionTitle}>İlanlar</Text>

        <QuickActionCard
          icon="📋"
          title="Tüm İlanlar"
          subtitle="Kayıp, bulunan ve yaralı hayvan ilanları"
          color={Colors.primary}
          onPress={() => navigation.navigate('AllReports')}
        />
        <QuickActionCard
          icon="📌"
          title="Bildirimlerim"
          subtitle="Verdiğiniz ilanlar ve veteriner yanıtları"
          color="#7B61FF"
          onPress={() => navigation.navigate('MyReports')}
        />
        <QuickActionCard
          icon="🎉"
          title="Bulunan Hayvanlar"
          subtitle="Uygulama sayesinde sahiplerine kavuşan hayvanlar"
          color="#4CAF50"
          onPress={() => navigation.navigate('FoundAnimals')}
        />
        <QuickActionCard
          icon="✉️"
          title="Mesajlarım"
          subtitle="Kullanıcılarla özel mesajlaşma"
          color="#007AFF"
          badge={unreadCount}
          onPress={() => navigation.navigate('Inbox')}
        />

        {/* Bildirim Oluştur */}
        <Text style={styles.sectionTitle}>Bildirim Oluştur</Text>

        <QuickActionCard
          icon="🚨"
          title="Kayıp İlanı Ver"
          subtitle="Kaybolan hayvanınızı bildirin"
          color="#FF6B6B"
          onPress={() => navigation.navigate('CreateReport', { type: 'kayip' })}
        />
        <QuickActionCard
          icon="🐕"
          title="Bulunan Hayvan Bildirimi"
          subtitle="Bulduğunuz hayvanı kayıt edin"
          color="#4ECDC4"
          onPress={() => navigation.navigate('CreateReport', { type: 'bulunan' })}
        />
        <QuickActionCard
          icon="🏥"
          title="Yaralı Hayvan Bildirimi"
          subtitle="Yaralı hayvanı yetkililere bildirin"
          color="#FFE66D"
          onPress={() => navigation.navigate('CreateReport', { type: 'yarali' })}
        />
        <QuickActionCard
          icon="📍"
          title="Yakındaki Veterinerler"
          subtitle="Size en yakın klinikleri görün"
          color="#FF9500"
          onPress={() => navigation.navigate('NearbyVets')}
        />

        {/* Çıkış */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerGreeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  headerName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inboxBtn: {
    position: 'relative',
    padding: 4,
  },
  inboxIcon: {
    fontSize: 26,
  },
  inboxBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  inboxBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerIcon: {
    fontSize: 36,
    marginRight: 12,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  cardBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginRight: 8,
  },
  cardBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  cardArrow: {
    fontSize: 22,
    color: '#ccc',
    fontWeight: 'bold',
  },
  logoutButton: {
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  logoutText: {
    color: '#FF6B6B',
    fontWeight: '600',
    fontSize: 15,
  },
  bottomSpace: {
    height: 40,
  },
});

export default UserHomeScreen;