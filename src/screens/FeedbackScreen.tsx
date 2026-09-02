import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import * as MailComposer from 'expo-mail-composer';
import * as Device from 'expo-device';
import { Ionicons } from '@expo/vector-icons';

const FeedbackScreen = () => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [feedback, setFeedback] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendFeedback = async () => {
    if (!feedback.trim()) {
      Alert.alert(t('common.error'), t('feedback.emptyError'));
      return;
    }

    setIsSending(true);

    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      
      const deviceInfo = `
--- Device Info ---
Model: ${Device.modelName}
OS: ${Device.osName} ${Device.osVersion}
Brand: ${Device.brand}
App Version: 1.2.0
-------------------
      `;

      if (isAvailable) {
        await MailComposer.composeAsync({
          recipients: ['destek@rafomrum.com'], // Buraya kendi mailinizi yazabilirsiniz
          subject: `FreshTrack Feedback - ${Device.modelName}`,
          body: `${feedback}\n\n${deviceInfo}`,
        });
        setFeedback('');
      } else {
        Alert.alert(
          t('common.error'),
          t('feedback.mailNotAvailable')
        );
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('feedback.sendError'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="chatbubble-ellipses" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('feedback.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textLight }]}>
            {t('feedback.subtitle')}
          </Text>
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder={t('feedback.placeholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={10}
            value={feedback}
            onChangeText={setFeedback}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleSendFeedback}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>{t('feedback.send')}</Text>
              <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  inputContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    minHeight: 200,
  },
  input: {
    fontSize: 16,
    height: '100%',
  },
  button: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default FeedbackScreen;
