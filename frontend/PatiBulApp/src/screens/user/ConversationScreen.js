import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import config from '../../config';

const API_URL = config.API_URL;

const ConversationScreen = ({ route, navigation }) => {
  const { otherUserId, otherUserName, otherUserPhoto, reportId, reportAnimal } = route.params;
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      title: otherUserName,
      headerStyle: { backgroundColor: '#4CAF50' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    });
  }, [otherUserName]);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/messages/conversation/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error('Mesajlar yüklenemedi:', e);
    } finally {
      setLoading(false);
    }
  }, [token, otherUserId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galeri iznine ihtiyaç var.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera iznine ihtiyaç var.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const showImageOptions = () => {
    Alert.alert('Fotoğraf Ekle', '', [
      { text: 'Galeriden Seç', onPress: pickImage },
      { text: 'Fotoğraf Çek', onPress: takePhoto },
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedImage) return;
    setSending(true);
    try {
      // 1. Önce metni gönder
      const response = await fetch(`${API_URL}/api/messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiver_id: otherUserId,
          content: newMessage.trim() || '📷 Fotoğraf gönderildi',
          report_id: reportId || null,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Hata', data.error || 'Mesaj gönderilemedi.');
        return;
      }

      const messageId = data.data.id;

      // 2. Fotoğraf varsa yükle
      if (selectedImage) {
        const formData = new FormData();
        const ext = selectedImage.uri.split('.').pop();
        formData.append('image', {
          uri: selectedImage.uri,
          name: `msg_${Date.now()}.${ext}`,
          type: `image/${ext}`,
        });

        await fetch(`${API_URL}/api/messages/${messageId}/upload-image`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      }

      setNewMessage('');
      setSelectedImage(null);
      fetchMessages();
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (e) {
      Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamıyor.');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender_id === user?.id;
    return (
      <View style={[styles.messageRow, isMe ? styles.myRow : styles.theirRow]}>
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
          {item.image_url && (
            <Image
              source={{ uri: `${API_URL}${item.image_url}` }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          )}
          {item.content !== '📷 Fotoğraf gönderildi' || !item.image_url ? (
            <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>
              {item.content}
            </Text>
          ) : null}
          <Text style={[styles.messageTime, isMe ? styles.myTime : styles.theirTime]}>
            {new Date(item.created_at).toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        {/* İlan bilgisi bandı */}
        {reportAnimal && (
          <View style={styles.reportBanner}>
            <Text style={styles.reportBannerText}>
              🐾 {reportAnimal} ilanı hakkında konuşuyorsunuz
            </Text>
          </View>
        )}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatIcon}>💬</Text>
                <Text style={styles.emptyChatText}>Henüz mesaj yok</Text>
                <Text style={styles.emptyChatSub}>İlk mesajı sen gönder!</Text>
              </View>
            }
          />
        )}

        {/* Seçili fotoğraf önizleme */}
        {selectedImage && (
          <View style={styles.imagePreviewBar}>
            <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={() => setSelectedImage(null)}
            >
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mesaj gönderme kutusu */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.imageBtn} onPress={showImageOptions}>
            <Text style={styles.imageBtnText}>📷</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Mesajınızı yazın..."
            placeholderTextColor="#aaa"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!newMessage.trim() && !selectedImage || sending) && styles.sendBtnDisabled,
            ]}
            onPress={sendMessage}
            disabled={(!newMessage.trim() && !selectedImage) || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendBtnText}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportBanner: {
    backgroundColor: '#4CAF5011',
    borderBottomWidth: 1,
    borderBottomColor: '#4CAF5033',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  reportBannerText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
  },
  messageList: {
    padding: 16,
    paddingBottom: 16,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  myRow: {
    justifyContent: 'flex-end',
  },
  theirRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  myBubble: {
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
    marginBottom: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  myText: {
    color: '#fff',
  },
  theirText: {
    color: '#1a1a2e',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  theirTime: {
    color: '#aaa',
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyChatIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyChatText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  emptyChatSub: {
    fontSize: 13,
    color: '#aaa',
  },
  imagePreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  removeImageBtn: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  imageBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageBtnText: {
    fontSize: 24,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    maxHeight: 100,
    minHeight: 44,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#ccc',
  },
  sendBtnText: {
    fontSize: 18,
    color: '#fff',
  },
});

export default ConversationScreen;