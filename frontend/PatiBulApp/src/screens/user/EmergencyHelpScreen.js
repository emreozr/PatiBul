import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import config from '../../config';

const API_URL = config.API_URL;
const STORAGE_KEY = 'pati_chat_history';

const QUICK_QUESTIONS = [
  '🐱 Yavru kedi ne ile beslenmeli?',
  '🩹 Yaralı bir hayvan buldum, ne yapmalıyım?',
  '🐶 Yavru köpek nasıl beslenir?',
  '🌡️ Hayvanın ateşi var, ne yapmalıyım?',
  '🐦 Yaralı kuş buldum, nasıl yardım ederim?',
  '🚗 Hayvan kazaya karışmış, ilk yardım?',
];

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: 'Merhaba! Ben Pati 🐾\n\nHayvanlarla ilgili acil durumlar, ilk yardım veya bakım konularında sana yardımcı olabilirim. Ne öğrenmek istersin?',
};

const Message = ({ item }) => {
  const isUser = item.role === 'user';
  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAI]}>
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Text style={styles.aiAvatarText}>🐾</Text>
        </View>
      )}
      <View style={[styles.messageBubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextAI]}>
          {item.content}
        </Text>
      </View>
    </View>
  );
};

const EmergencyHelpScreen = () => {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  // Geçmişi yükle
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem(`${STORAGE_KEY}_${user?.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.length > 0) setMessages(parsed);
        }
      } catch (e) {}
    };
    loadHistory();
  }, []);

  // Geçmişi kaydet
  const saveHistory = useCallback(async (msgs) => {
    try {
      // Son 50 mesajı kaydet
      const toSave = msgs.slice(-50);
      await AsyncStorage.setItem(`${STORAGE_KEY}_${user?.id}`, JSON.stringify(toSave));
    } catch (e) {}
  }, [user?.id]);

  const sendMessage = useCallback(async (text) => {
    const userMessage = text || input.trim();
    if (!userMessage || loading) return;

    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      const updatedMessages = response.ok
        ? [...newMessages, { role: 'assistant', content: data.message }]
        : [...newMessages, { role: 'assistant', content: 'Üzgünüm, şu an yanıt veremiyorum. Lütfen tekrar dene. 🙏' }];

      setMessages(updatedMessages);
      saveHistory(updatedMessages);
    } catch (e) {
      const updatedMessages = [...newMessages, {
        role: 'assistant',
        content: 'Bağlantı hatası. Lütfen internet bağlantını kontrol et. 📡',
      }];
      setMessages(updatedMessages);
      saveHistory(updatedMessages);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, messages, loading, token, saveHistory]);

  const clearHistory = useCallback(async () => {
    setMessages([INITIAL_MESSAGE]);
    try {
      await AsyncStorage.removeItem(`${STORAGE_KEY}_${user?.id}`);
    } catch (e) {}
  }, [user?.id]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        {/* Geçmişi temizle butonu */}
        {messages.length > 1 && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearHistory}>
            <Text style={styles.clearBtnText}>🗑️ Geçmişi Temizle</Text>
          </TouchableOpacity>
        )}

        {/* Mesajlar */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => <Message item={item} />}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            loading ? (
              <View style={styles.typingRow}>
                <View style={styles.aiAvatar}>
                  <Text style={styles.aiAvatarText}>🐾</Text>
                </View>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color="#3DAA6E" />
                </View>
              </View>
            ) : null
          }
        />

        {/* Hızlı sorular - sadece ilk mesajda */}
        {messages.length === 1 && (
          <View style={styles.quickQuestions}>
            <Text style={styles.quickQuestionsTitle}>Sık sorulan sorular</Text>
            <FlatList
              data={QUICK_QUESTIONS}
              keyExtractor={(_, i) => i.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.quickBtn} onPress={() => sendMessage(item)}>
                  <Text style={styles.quickBtnText}>{item}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            />
          </View>
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Sorunuzu yazın..."
            placeholderTextColor="#aaa"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendBtnText}>➤</Text>
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
  clearBtn: {
    alignSelf: 'flex-end',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  clearBtnText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAI: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3DAA6E22',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  aiAvatarText: {
    fontSize: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
  },
  bubbleUser: {
    backgroundColor: '#3DAA6E',
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextUser: {
    color: '#fff',
  },
  messageTextAI: {
    color: '#1a1a2e',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typingBubble: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  quickQuestions: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  quickQuestionsTitle: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  quickBtn: {
    backgroundColor: '#3DAA6E11',
    borderWidth: 1,
    borderColor: '#3DAA6E44',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quickBtnText: {
    fontSize: 13,
    color: '#3DAA6E',
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3DAA6E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#ccc',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default EmergencyHelpScreen;