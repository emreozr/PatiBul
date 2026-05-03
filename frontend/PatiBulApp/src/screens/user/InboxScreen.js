import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import config from '../../config';

const API_URL = config.API_URL;

const InboxScreen = ({ navigation }) => {
  const { token, user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInbox = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/messages/inbox`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setConversations(data.conversations || []);
      }
    } catch (e) {
      console.error('Gelen kutusu yüklenemedi:', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInbox();
    const interval = setInterval(fetchInbox, 15000);
    return () => clearInterval(interval);
  }, [fetchInbox]);

  const renderItem = ({ item }) => {
    const initials = item.other_user_name?.charAt(0)?.toUpperCase() || '?';
    const time = new Date(item.last_message_time).toLocaleDateString('tr-TR');

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => navigation.navigate('Conversation', {
          otherUserId: item.other_user_id,
          otherUserName: item.other_user_name,
          otherUserPhoto: item.other_user_photo,
          reportId: item.report_id,
          reportAnimal: item.report_animal,
        })}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.other_user_photo ? (
            <Image source={{ uri: `${API_URL}/${item.other_user_photo}` }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          {item.unread_count > 0 && (
            <View style={styles.unreadDot}>
              <Text style={styles.unreadDotText}>{item.unread_count}</Text>
            </View>
          )}
        </View>

        {/* İçerik */}
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.conversationName, item.unread_count > 0 && styles.conversationNameBold]}>
              {item.other_user_name}
            </Text>
            <Text style={styles.conversationTime}>{time}</Text>
          </View>

          {item.report_animal && (
            <Text style={styles.conversationReport}>🐾 {item.report_animal} ilanı hakkında</Text>
          )}

          <Text
            style={[styles.conversationLastMsg, item.unread_count > 0 && styles.conversationLastMsgBold]}
            numberOfLines={1}
          >
            {item.is_last_mine ? 'Sen: ' : ''}{item.last_message}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.other_user_id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📬</Text>
            <Text style={styles.emptyText}>Henüz mesajınız yok</Text>
            <Text style={styles.emptySubtext}>
              Bir ilana "Buldum" diyerek mesajlaşmaya başlayabilirsiniz
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={fetchInbox}
        refreshing={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingVertical: 8, flexGrow: 1 },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: { position: 'relative', marginRight: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
  unreadDot: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#4CAF50', borderRadius: 10,
    minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadDotText: { fontSize: 11, color: '#fff', fontWeight: 'bold' },
  conversationContent: { flex: 1 },
  conversationHeader: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2,
  },
  conversationName: { fontSize: 15, color: '#1a1a2e', fontWeight: '500' },
  conversationNameBold: { fontWeight: '700' },
  conversationTime: { fontSize: 12, color: '#aaa' },
  conversationReport: { fontSize: 11, color: '#4CAF50', fontWeight: '600', marginBottom: 2 },
  conversationLastMsg: { fontSize: 13, color: '#888' },
  conversationLastMsgBold: { color: '#333', fontWeight: '600' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 17, fontWeight: '600', color: '#555', marginBottom: 8 },
  emptySubtext: { fontSize: 13, color: '#aaa', textAlign: 'center', paddingHorizontal: 40 },
});

export default InboxScreen;