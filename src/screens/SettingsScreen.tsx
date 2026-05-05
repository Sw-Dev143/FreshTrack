import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
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
        </View>

        {/* Legal */}
        <Text style={[styles.sectionTitle, { color: colors.secondary, marginTop: SIZES.lg }]}>
          {t('common.legal') || 'Legal'}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={styles.rowEntry}
            onPress={() => Linking.openURL('https://github.com/Sw-Dev143/FreshTrack/security/policy')}
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
});

export default SettingsScreen;
