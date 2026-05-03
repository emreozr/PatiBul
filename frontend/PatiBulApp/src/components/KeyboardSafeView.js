import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

/**
 * KeyboardSafeView
 * Tüm ekranlarda klavye sorununu çözen ortak layout.
 *
 * Kullanım:
 * <KeyboardSafeView>
 *   ... ekran içeriği ...
 * </KeyboardSafeView>
 *
 * Props:
 * - style: dış kapsayıcı için stil
 * - contentStyle: ScrollView içeriği için stil
 * - scrollable: false ise ScrollView kullanmaz (default: true)
 * - backgroundColor: arka plan rengi (default: '#F5F7FA')
 * - useSafeArea: true ise SafeAreaView kullanır (Login, Register gibi header'sız ekranlar için)
 */
const KeyboardSafeView = ({
  children,
  style,
  contentStyle,
  scrollable = true,
  backgroundColor = '#F5F7FA',
  useSafeArea = false,
}) => {
  const Wrapper = useSafeArea
    ? require('react-native-safe-area-context').SafeAreaView
    : View;

  return (
    <Wrapper style={[styles.flex, { backgroundColor }, style]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          {scrollable ? (
            <ScrollView
              style={styles.flex}
              contentContainerStyle={[styles.content, contentStyle]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={styles.flex}>{children}</View>
          )}
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 40,
  },
});

export default KeyboardSafeView;