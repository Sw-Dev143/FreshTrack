import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../context/ThemeContext';
import { COLORS, SIZES, SHADOWS } from '../theme';
import { exportBackup, importBackup } from '../utils/backup';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

const SettingsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation();

  const handleLanguageChange = async (langCode: string) => {
    try {
      await changeLanguage(langCode);
    } catch (e) {
      console.warn('Language change error:', e);
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: t('settings.shareMessage'),
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleResetData = () => {
    Alert.alert(
      t('settings.resetConfirmTitle'),
      t('settings.resetConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Updates.reloadAsync();
            } catch (e) {
              Alert.alert(t('common.error'), 'Failed to reset data');
            }
          }
        }
      ]
    );
  };

  const currentLang = currentLanguage;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Dil Seçimi */}
        <Text style={[styles.sectionTitle, { color: colors.secondary }]}>
          {t('settings.language')}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {LANGUAGES.map((lang, index) => {
            const isSelected = currentLang === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.rowEntry,
                  index < LANGUAGES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                ]}
                onPress={() => handleLanguageChange(lang.code)}
                activeOpacity={0.7}
              >
                <View style={styles.rowLeft}>
                  <Text style={styles.flag}>{lang.flag}</Text>
                  <Text style={[styles.rowLabel, { color: colors.text }, isSelected && { fontWeight: '700', color: COLORS.primary }]}>
                    {lang.label}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Veri Yönetimi */}
        <Text style={[styles.sectionTitle, { color: colors.secondary, marginTop: SIZES.lg }]}>
          {t('settings.dataManagement')}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.rowEntry, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            onPress={() => exportBackup()}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: COLORS.primary + '15' }]}>
                <Ionicons name="download-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settings.exportBackup')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rowEntry}
            onPress={() => importBackup(() => {
              Alert.alert(t('common.success'), t('settings.importWarning'));
            })}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: COLORS.warning + '15' }]}>
                <Ionicons name="push-outline" size={18} color={COLORS.warning} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settings.importBackup')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rowEntry}
            onPress={handleResetData}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: COLORS.danger + '15' }]}>
                <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
              </View>
              <Text style={[styles.rowLabel, { color: COLORS.danger }]}>{t('settings.resetData')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Legal & About */}
        <Text style={[styles.sectionTitle, { color: colors.secondary, marginTop: SIZES.lg }]}>
          {t('common.legal') || 'Legal'} & {t('settings.about') || 'About'}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.rowEntry, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('Feedback' as never)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: COLORS.secondary + '15' }]}>
                <Ionicons name="chatbubbles-outline" size={18} color={COLORS.secondary} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{t('feedback.title')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rowEntry, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('PrivacyPolicy' as never)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: COLORS.safe + '15' }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.safe} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settings.privacyPolicy')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.rowEntry, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            onPress={handleShareApp}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: COLORS.secondary + '15' }]}>
                <Ionicons name="share-social-outline" size={18} color={COLORS.secondary} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settings.shareApp')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.rowEntry}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: colors.border + '30' }]}>
                <Ionicons name="information-circle-outline" size={18} color={colors.textLight} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.textLight }]}>{t('settings.version') || 'Version'}</Text>
            </View>
            <Text style={[styles.versionText, { color: colors.textMuted }]}>1.2.0 (Build 3)</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: SIZES.md, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: SIZES.sm,
    marginLeft: 4,
  },
  card: {
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  rowEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flag: {
    fontSize: 20,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SettingsScreen;
